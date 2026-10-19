package com.th3rdwave.safeareacontext

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import androidx.annotation.RequiresApi
import java.lang.IllegalArgumentException
import kotlin.math.max
import kotlin.math.min

@RequiresApi(Build.VERSION_CODES.R)
private fun getRootWindowInsetsCompatR(rootView: View): EdgeInsets? {
  val insets =
      rootView.rootWindowInsets?.getInsets(
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

@RequiresApi(Build.VERSION_CODES.P)
private fun getDisplayCutoutInsetsCompatP(insets: WindowInsets): EdgeInsets {
  val cutout =
      insets.displayCutout ?: return EdgeInsets(top = 0f, right = 0f, bottom = 0f, left = 0f)
  return EdgeInsets(
      top = cutout.safeInsetTop.toFloat(),
      right = cutout.safeInsetRight.toFloat(),
      bottom = cutout.safeInsetBottom.toFloat(),
      left = cutout.safeInsetLeft.toFloat(),
  )
}

private fun getDisplayCutoutInsetsCompat(insets: WindowInsets): EdgeInsets {
  return when {
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.P -> getDisplayCutoutInsetsCompatP(insets)
    else -> EdgeInsets(top = 0f, right = 0f, bottom = 0f, left = 0f)
  }
}

private fun isInMultiWindowMode(context: Context?): Boolean {
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
    return false
  }
  var current = context
  while (current is ContextWrapper) {
    if (current is Activity) {
      return current.isInMultiWindowMode
    }
    current = current.baseContext
  }
  return false
}

@RequiresApi(Build.VERSION_CODES.M)
@Suppress("DEPRECATION")
private fun getRootWindowInsetsCompatM(rootView: View, activityContext: Context?): EdgeInsets? {
  val insets = rootView.rootWindowInsets ?: return null
  // Under SYSTEM_UI_FLAG_LAYOUT_STABLE a hidden bar keeps its system window inset, so a bar hidden
  // through the system UI visibility leaves only the display cutout, as getInsets does from API 30.
  val systemUiVisibility = rootView.windowSystemUiVisibility
  val hidesStatusBar = (systemUiVisibility and View.SYSTEM_UI_FLAG_FULLSCREEN) != 0
  val hidesNavigationBar = (systemUiVisibility and View.SYSTEM_UI_FLAG_HIDE_NAVIGATION) != 0
  // In multi-window mode the system shows the bars whatever the app requested. Asking is a binder
  // call, so only an app hiding a bar asks.
  val showsBarsAnyway =
      (hidesStatusBar || hidesNavigationBar) && isInMultiWindowMode(activityContext)
  val isStatusBarHidden = hidesStatusBar && !showsBarsAnyway
  val isNavigationBarHidden = hidesNavigationBar && !showsBarsAnyway
  val cutout = getDisplayCutoutInsetsCompat(insets)
  return EdgeInsets(
      top = if (isStatusBarHidden) cutout.top else insets.systemWindowInsetTop.toFloat(),
      right = if (isNavigationBarHidden) cutout.right else insets.systemWindowInsetRight.toFloat(),
      // System insets are more reliable to account for notches but the
      // system inset for bottom includes the soft keyboard which we don't
      // want to be consistent with iOS. Using the min value makes sure we
      // never get the keyboard offset while still working with devices that
      // hide the navigation bar.
      bottom =
          if (isNavigationBarHidden) cutout.bottom
          else min(insets.systemWindowInsetBottom, insets.stableInsetBottom).toFloat(),
      left = if (isNavigationBarHidden) cutout.left else insets.systemWindowInsetLeft.toFloat(),
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

private fun getRootWindowInsetsCompat(rootView: View, activityContext: Context?): EdgeInsets? {
  return when {
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.R -> getRootWindowInsetsCompatR(rootView)
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ->
        getRootWindowInsetsCompatM(rootView, activityContext)
    else -> getRootWindowInsetsCompatBase(rootView)
  }
}

fun getSafeAreaInsets(view: View): EdgeInsets? = getSafeAreaInsets(view, view.context)

/**
 * [activityContext] leads to the activity whose window holds [view], which a decor view's own
 * context does not.
 */
fun getSafeAreaInsets(view: View, activityContext: Context?): EdgeInsets? {
  // The view has not been layout yet.
  if (view.height == 0) {
    return null
  }
  val rootView = view.rootView
  val windowInsets = getRootWindowInsetsCompat(rootView, activityContext) ?: return null

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
