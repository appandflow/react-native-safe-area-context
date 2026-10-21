package com.th3rdwave.safeareacontext

import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import androidx.annotation.RequiresApi
import java.lang.IllegalArgumentException
import kotlin.math.max
import kotlin.math.min

@RequiresApi(Build.VERSION_CODES.R)
private fun getRootWindowInsetsCompatR(windowInsets: WindowInsets?): EdgeInsets? {
  val insets =
      windowInsets?.getInsets(
          WindowInsets.Type.statusBars() or
              WindowInsets.Type.displayCutout() or
              WindowInsets.Type.navigationBars() or
              WindowInsets.Type.captionBar()
      ) ?: return null
  return EdgeInsets(
      top = insets.top.toFloat(),
      right = insets.right.toFloat(),
      bottom = insets.bottom.toFloat(),
      left = insets.left.toFloat(),
  )
}

@RequiresApi(Build.VERSION_CODES.M)
@Suppress("DEPRECATION")
private fun getRootWindowInsetsCompatM(windowInsets: WindowInsets?): EdgeInsets? {
  val insets = windowInsets ?: return null
  return EdgeInsets(
      top = insets.systemWindowInsetTop.toFloat(),
      right = insets.systemWindowInsetRight.toFloat(),
      // System insets are more reliable to account for notches but the
      // system inset for bottom includes the soft keyboard which we don't
      // want to be consistent with iOS. Using the min value makes sure we
      // never get the keyboard offset while still working with devices that
      // hide the navigation bar. This also caps extra bottom insets that an
      // ancestor adds to the dispatched insets at the stable inset.
      bottom = min(insets.systemWindowInsetBottom, insets.stableInsetBottom).toFloat(),
      left = insets.systemWindowInsetLeft.toFloat(),
  )
}

private fun getRootWindowInsetsCompatBase(rootView: View): EdgeInsets? {
  val visibleRect = android.graphics.Rect()
  rootView.getWindowVisibleDisplayFrame(visibleRect)
  return EdgeInsets(
      top = visibleRect.top.toFloat(),
      right = (rootView.width - visibleRect.right).toFloat(),
      bottom = (rootView.height - visibleRect.bottom).toFloat(),
      left = visibleRect.left.toFloat(),
  )
}

private fun getRootWindowInsetsCompat(
    rootView: View,
    dispatchedInsets: WindowInsets?,
): EdgeInsets? {
  return when {
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.R ->
        maxInsets(
            getRootWindowInsetsCompatR(rootView.rootWindowInsets),
            getRootWindowInsetsCompatR(dispatchedInsets),
        )
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ->
        maxInsets(
            getRootWindowInsetsCompatM(rootView.rootWindowInsets),
            getRootWindowInsetsCompatM(dispatchedInsets),
        )
    else -> getRootWindowInsetsCompatBase(rootView)
  }
}

// Ancestors also lower the insets they dispatch without making that area safe. For example React
// Native's translucent StatusBar sets the top inset to 0 so fitsSystemWindows adds no padding. So
// dispatched insets can only add to the root insets.
private fun maxInsets(rootInsets: EdgeInsets?, dispatchedInsets: EdgeInsets?): EdgeInsets? {
  if (rootInsets == null || dispatchedInsets == null) {
    return rootInsets
  }
  return EdgeInsets(
      top = max(rootInsets.top, dispatchedInsets.top),
      right = max(rootInsets.right, dispatchedInsets.right),
      bottom = max(rootInsets.bottom, dispatchedInsets.bottom),
      left = max(rootInsets.left, dispatchedInsets.left),
  )
}

internal class DispatchedWindowInsets {
  private var mInsets: WindowInsets? = null
  private var mRootInsets: WindowInsets? = null

  fun update(view: View, insets: WindowInsets?) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return
    }
    mInsets = insets
    mRootInsets = view.rootWindowInsets
  }

  fun get(view: View): WindowInsets? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return null
    }
    val insets = mInsets ?: return null
    // Ancestors can stop dispatching insets to the view, for example after consuming them. The
    // root insets then change without a new dispatch reaching the view, so the last dispatched
    // value is stale and the root insets are used instead.
    return if (view.rootWindowInsets == mRootInsets) insets else null
  }

  fun clear() {
    mInsets = null
    mRootInsets = null
  }
}

@JvmOverloads
fun getSafeAreaInsets(view: View, dispatchedInsets: WindowInsets? = null): EdgeInsets? {
  // The view has not been layout yet.
  if (view.height == 0) {
    return null
  }
  val rootView = view.rootView
  val windowInsets = getRootWindowInsetsCompat(rootView, dispatchedInsets) ?: return null

  // Calculate the part of the view that overlaps with window insets.
  val windowWidth = rootView.width.toFloat()
  val windowHeight = rootView.height.toFloat()
  val visibleRect = android.graphics.Rect()
  view.getGlobalVisibleRect(visibleRect)
  return EdgeInsets(
      top = max(windowInsets.top - visibleRect.top, 0f),
      right = max(min(visibleRect.left + view.width - windowWidth, 0f) + windowInsets.right, 0f),
      bottom = max(min(visibleRect.top + view.height - windowHeight, 0f) + windowInsets.bottom, 0f),
      left = max(windowInsets.left - visibleRect.left, 0f),
  )
}

fun getFrame(rootView: ViewGroup, view: View): Rect? {
  // This can happen while the view gets unmounted.
  if (view.parent == null) {
    return null
  }
  val offset = android.graphics.Rect()
  view.getDrawingRect(offset)
  try {
    rootView.offsetDescendantRectToMyCoords(view, offset)
  } catch (ex: IllegalArgumentException) {
    // This can throw if the view is not a descendant of rootView. This should not
    // happen but avoid potential crashes.
    ex.printStackTrace()
    return null
  }
  return Rect(
      x = offset.left.toFloat(),
      y = offset.top.toFloat(),
      width = view.width.toFloat(),
      height = view.height.toFloat(),
  )
}
