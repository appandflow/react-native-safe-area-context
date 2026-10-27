package com.th3rdwave.safeareacontext

import android.content.Context
import android.os.Build
import android.view.RoundedCorner
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.view.WindowInsets
import com.facebook.react.views.view.ReactViewGroup

typealias OnInsetsChangeHandler =
    (
        view: SafeAreaProvider,
        insets: EdgeInsets,
        verticalCornerAdaptedInsets: EdgeInsets,
        horizontalCornerAdaptedInsets: EdgeInsets,
        frame: Rect,
    ) -> Unit

class SafeAreaProvider(context: Context?) :
    ReactViewGroup(context), ViewTreeObserver.OnPreDrawListener {
  private var mInsetsChangeHandler: OnInsetsChangeHandler? = null
  private var mLastInsets: EdgeInsets? = null
  private var mLastFrame: Rect? = null
  private var mLastCorners: List<RoundedCorner?>? = null
  private val mDispatchedInsets = DispatchedWindowInsets()

  internal fun getDispatchedWindowInsets(): WindowInsets? = mDispatchedInsets.get(this)

  private fun maybeUpdateInsets() {
    val insetsChangeHandler = mInsetsChangeHandler ?: return
    val edgeInsets = getSafeAreaInsets(this, getDispatchedWindowInsets()) ?: return
    val frame = getFrame(rootView as ViewGroup, this) ?: return
    val corners = getRoundedCorners(this)
    if (mLastInsets != edgeInsets || mLastFrame != frame || mLastCorners != corners) {
      insetsChangeHandler(
          this,
          edgeInsets,
          getCornerAdaptedInsets(this, edgeInsets, corners, CornerAdaptation.VERTICAL),
          getCornerAdaptedInsets(this, edgeInsets, corners, CornerAdaptation.HORIZONTAL),
          frame,
      )
      mLastInsets = edgeInsets
      mLastFrame = frame
      mLastCorners = corners
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    viewTreeObserver.addOnPreDrawListener(this)
    // Views attached after the last insets dispatch only receive insets on the next one.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      requestApplyInsets()
    }
    maybeUpdateInsets()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    viewTreeObserver.removeOnPreDrawListener(this)
    mDispatchedInsets.clear()
  }

  override fun dispatchApplyWindowInsets(insets: WindowInsets): WindowInsets {
    mDispatchedInsets.update(this, insets)
    return super.dispatchApplyWindowInsets(insets)
  }

  override fun onPreDraw(): Boolean {
    maybeUpdateInsets()
    return true
  }

  fun setOnInsetsChangeHandler(handler: OnInsetsChangeHandler?) {
    mInsetsChangeHandler = handler
    maybeUpdateInsets()
  }
}
