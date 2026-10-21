package com.th3rdwave.safeareacontext

import android.os.Build
import android.view.RoundedCorner
import android.view.View
import androidx.annotation.RequiresApi
import kotlin.math.max
import kotlin.math.sqrt

enum class CornerAdaptation {
  NONE,
  VERTICAL,
  HORIZONTAL,
}

/**
 * Enlarges [insets] of [view] where the display's rounded corners reach past them.
 *
 * Vertical adaptation raises the top and bottom insets to where each corner's arc crosses the left
 * and right edges of the view's safe area. Horizontal adaptation raises the left and right insets
 * to where each arc crosses the top and bottom edges of the safe area. Corners are approximated by
 * the quarter circles that [WindowInsets.getRoundedCorner] reports, so before API 31 the insets are
 * returned unchanged.
 */
fun getCornerAdaptedInsets(
    view: View,
    insets: EdgeInsets,
    cornerAdaptation: CornerAdaptation,
): EdgeInsets {
  if (cornerAdaptation == CornerAdaptation.NONE || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
    return insets
  }
  return getCornerAdaptedInsetsS(view, insets, cornerAdaptation)
}

@RequiresApi(Build.VERSION_CODES.S)
private fun getCornerAdaptedInsetsS(
    view: View,
    insets: EdgeInsets,
    cornerAdaptation: CornerAdaptation,
): EdgeInsets {
  val windowInsets = view.rootWindowInsets ?: return insets
  val location = IntArray(2)
  view.getLocationInWindow(location)
  val viewLeft = location[0].toFloat()
  val viewTop = location[1].toFloat()
  val viewRight = viewLeft + view.width
  val viewBottom = viewTop + view.height
  val safeLeft = viewLeft + insets.left
  val safeTop = viewTop + insets.top
  val safeRight = viewRight - insets.right
  val safeBottom = viewBottom - insets.bottom

  var top = insets.top
  var right = insets.right
  var bottom = insets.bottom
  var left = insets.left

  for (position in
      intArrayOf(
          RoundedCorner.POSITION_TOP_LEFT,
          RoundedCorner.POSITION_TOP_RIGHT,
          RoundedCorner.POSITION_BOTTOM_RIGHT,
          RoundedCorner.POSITION_BOTTOM_LEFT,
      )) {
    val corner = windowInsets.getRoundedCorner(position) ?: continue
    val radius = corner.radius.toFloat()
    if (radius <= 0f) {
      continue
    }
    val centerX = corner.center.x.toFloat()
    val centerY = corner.center.y.toFloat()
    val isLeft =
        position == RoundedCorner.POSITION_TOP_LEFT ||
            position == RoundedCorner.POSITION_BOTTOM_LEFT
    val isTop =
        position == RoundedCorner.POSITION_TOP_LEFT || position == RoundedCorner.POSITION_TOP_RIGHT

    if (cornerAdaptation == CornerAdaptation.VERTICAL) {
      val edgeX = if (isLeft) safeLeft else safeRight
      val dx = if (isLeft) centerX - edgeX else edgeX - centerX
      if (dx <= 0f) {
        continue
      }
      val arcY = arcOffset(radius, dx)
      if (isTop) {
        top = max(top, centerY - arcY - viewTop)
      } else {
        bottom = max(bottom, viewBottom - (centerY + arcY))
      }
    } else {
      val edgeY = if (isTop) safeTop else safeBottom
      val dy = if (isTop) centerY - edgeY else edgeY - centerY
      if (dy <= 0f) {
        continue
      }
      val arcX = arcOffset(radius, dy)
      if (isLeft) {
        left = max(left, centerX - arcX - viewLeft)
      } else {
        right = max(right, viewRight - (centerX + arcX))
      }
    }
  }

  return EdgeInsets(top = top, right = right, bottom = bottom, left = left)
}

private fun arcOffset(radius: Float, offset: Float): Float {
  return sqrt(max(radius * radius - offset * offset, 0f))
}
