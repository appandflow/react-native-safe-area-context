package com.th3rdwave.safeareacontext

import android.content.Context
import android.os.Build
import android.os.SystemClock
import android.view.RoundedCorner
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.view.WindowInsets
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.views.view.ReactViewGroup

class SafeAreaView(context: Context?) :
    ReactViewGroup(context), ViewTreeObserver.OnPreDrawListener {
  private var mMode = SafeAreaViewMode.PADDING
  private var mInsets: EdgeInsets? = null
  private var mEdges: SafeAreaViewEdges? = null
  private var mCornerAdaptation = CornerAdaptation.NONE
  private var mLastSafeAreaInsets: EdgeInsets? = null
  private var mLastProviderFrame: Rect? = null
  private var mLastCorners: List<RoundedCorner?>? = null
  private var mProviderView: View? = null
  private var mStateWrapper: StateWrapper? = null
  private var mPendingStateInsets: EdgeInsets? = null
  private var mDrawHeldSince = NOT_HELD
  private val mDispatchedInsets = DispatchedWindowInsets()

  fun getStateWrapper(): StateWrapper? {
    return mStateWrapper
  }

  fun setStateWrapper(stateWrapper: StateWrapper?) {
    mStateWrapper = stateWrapper
  }

  private fun updateInsets() {
    val insets = mInsets
    if (insets != null) {
      val edges =
          mEdges
              ?: SafeAreaViewEdges(
                  SafeAreaViewEdgeModes.ADDITIVE,
                  SafeAreaViewEdgeModes.ADDITIVE,
                  SafeAreaViewEdgeModes.ADDITIVE,
                  SafeAreaViewEdgeModes.ADDITIVE,
              )
      val stateWrapper = getStateWrapper()
      if (stateWrapper != null) {
        val map = Arguments.createMap()
        map.putMap("insets", edgeInsetsToJsMap(insets))
        stateWrapper.updateState(map)
        mPendingStateInsets =
            EdgeInsets(
                top = PixelUtil.toDIPFromPixel(insets.top),
                right = PixelUtil.toDIPFromPixel(insets.right),
                bottom = PixelUtil.toDIPFromPixel(insets.bottom),
                left = PixelUtil.toDIPFromPixel(insets.left),
            )
      } else {
        val localData = SafeAreaViewLocalData(insets = insets, mode = mMode, edges = edges)
        val reactContext = getReactContext(this)
        val uiManager = reactContext.getNativeModule(UIManagerModule::class.java)
        if (uiManager != null) {
          uiManager.setViewLocalData(id, localData)
        }
      }
    }
  }

  fun setMode(mode: SafeAreaViewMode) {
    mMode = mode
    updateInsets()
  }

  fun setEdges(edges: SafeAreaViewEdges) {
    mEdges = edges
    updateInsets()
  }

  fun setCornerAdaptation(cornerAdaptation: CornerAdaptation) {
    mCornerAdaptation = cornerAdaptation
    mLastSafeAreaInsets = null
    maybeUpdateInsets()
  }

  private fun maybeUpdateInsets(): Boolean {
    val providerView = mProviderView ?: return false
    val dispatchedInsets =
        if (providerView is SafeAreaProvider) providerView.getDispatchedWindowInsets()
        else mDispatchedInsets.get(this)
    val safeAreaInsets = getSafeAreaInsets(providerView, dispatchedInsets) ?: return false
    val edgeInsets: EdgeInsets
    if (mCornerAdaptation == CornerAdaptation.NONE) {
      edgeInsets = safeAreaInsets
    } else {
      val frame = getFrame(providerView.rootView as ViewGroup, providerView) ?: return false
      val corners = getRoundedCorners(providerView)
      if (
          mLastSafeAreaInsets == safeAreaInsets &&
              mLastProviderFrame == frame &&
              mLastCorners == corners
      ) {
        return false
      }
      mLastSafeAreaInsets = safeAreaInsets
      mLastProviderFrame = frame
      mLastCorners = corners
      edgeInsets = getCornerAdaptedInsets(providerView, safeAreaInsets, corners, mCornerAdaptation)
    }
    if (mInsets != edgeInsets) {
      mInsets = edgeInsets
      updateInsets()
      return true
    }
    return false
  }

  private fun findProvider(): View {
    var current = parent
    while (current != null) {
      if (current is SafeAreaProvider) {
        return current
      }
      current = current.parent
    }
    return this
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    mProviderView = findProvider()
    mProviderView?.viewTreeObserver?.addOnPreDrawListener(this)
    if (mProviderView === this && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      requestApplyInsets()
    }
    maybeUpdateInsets()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    mProviderView?.viewTreeObserver?.removeOnPreDrawListener(this)
    mProviderView = null
    mLastSafeAreaInsets = null
    mPendingStateInsets = null
    mDrawHeldSince = NOT_HELD
    mDispatchedInsets.clear()
  }

  override fun dispatchApplyWindowInsets(insets: WindowInsets): WindowInsets {
    mDispatchedInsets.update(this, insets)
    return super.dispatchApplyWindowInsets(insets)
  }

  // Fabric commits the state update asynchronously, so the padding reaches the view in a later
  // mount. Until then the view is laid out with the previous insets.
  private fun isWaitingForState(): Boolean {
    val pending = mPendingStateInsets ?: return false
    val state = mStateWrapper?.stateData?.getMap("insets")
    if (
        state != null &&
            EdgeInsets(
                top = state.getDouble("top").toFloat(),
                right = state.getDouble("right").toFloat(),
                bottom = state.getDouble("bottom").toFloat(),
                left = state.getDouble("left").toFloat(),
            ) == pending
    ) {
      mPendingStateInsets = null
      return false
    }
    return true
  }

  override fun onPreDraw(): Boolean {
    val didUpdate = maybeUpdateInsets()
    if (didUpdate) {
      requestLayout()
    }
    if (!didUpdate && !isWaitingForState()) {
      mDrawHeldSince = NOT_HELD
      return true
    }
    // Skip draws until the new insets are mounted, but never for longer than MAX_DRAW_HOLD_MS, so
    // a busy JS thread cannot stop the window from drawing.
    val now = SystemClock.uptimeMillis()
    if (mDrawHeldSince == NOT_HELD) {
      mDrawHeldSince = now
    } else if (now - mDrawHeldSince >= MAX_DRAW_HOLD_MS) {
      mPendingStateInsets = null
      mDrawHeldSince = NOT_HELD
      return true
    }
    return false
  }

  private companion object {
    const val NOT_HELD = -1L
    const val MAX_DRAW_HOLD_MS = 100L
  }
}
