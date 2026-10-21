package com.th3rdwave.safeareacontext

import android.os.Build
import android.view.RoundedCorner
import android.view.View
import androidx.annotation.RequiresApi
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sqrt

enum class CornerAdaptation {
  NONE,
  VERTICAL,
  HORIZONTAL,
}

/**
 * Enlarges [insets] of [view] where the display's rounded corners reach past them, matching UIKit's
 * `edgeInsets(for: .safeArea(cornerAdaptation:))` on iOS 26.
 *
 * Measured on iOS 26/27 simulators, UIKit gives each corner the inset `r * (1 - √2 / 2)` (the arc's
 * 45° point) of an effective radius `r = min(R - max(dx, dy), width / 2, height / 2)`, where `R` is
 * the display corner radius and `dx`, `dy` are the view's distances from the two edges meeting at
 * that corner. Vertical adaptation applies the top corners to the top inset and the bottom corners
 * to the bottom inset, horizontal applies the left and right corners to the side insets, each never
 * below the regular inset. [corners] comes from [getRoundedCorners]; without it the insets are
 * returned unchanged.
 */
fun getCornerAdaptedInsets(
    view: View,
    insets: EdgeInsets,
    corners: List<RoundedCorner?>?,
    cornerAdaptation: CornerAdaptation,
): EdgeInsets {
  if (
      cornerAdaptation == CornerAdaptation.NONE ||
          corners == null ||
          Build.VERSION.SDK_INT < Build.VERSION_CODES.S
  ) {
    return insets
  }
  return getCornerAdaptedInsetsS(view, insets, corners, cornerAdaptation)
}

/**
 * The display's rounded corners for [view]'s window, indexed by [RoundedCorner] position, or null
 * before API 31 where [WindowInsets.getRoundedCorner] doesn't exist.
 */
fun getRoundedCorners(view: View): List<RoundedCorner?>? {
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
    return null
  }
  return getRoundedCornersS(view)
}

@RequiresApi(Build.VERSION_CODES.S)
private fun getRoundedCornersS(view: View): List<RoundedCorner?>? {
  val windowInsets = view.rootWindowInsets ?: return null
  return List(4) { windowInsets.getRoundedCorner(it) }
}

private val ARC_45_DEGREES = 1f - sqrt(2f) / 2f

@RequiresApi(Build.VERSION_CODES.S)
private fun getCornerAdaptedInsetsS(
    view: View,
    insets: EdgeInsets,
    corners: List<RoundedCorner?>,
    cornerAdaptation: CornerAdaptation,
): EdgeInsets {
  val location = IntArray(2)
  view.getLocationInWindow(location)
  val left = location[0].toFloat()
  val top = location[1].toFloat()
  val right = left + view.width
  val bottom = top + view.height
  val maxRadius = min(view.width, view.height) / 2f

  fun cornerInset(position: Int): Float {
    val corner = corners[position] ?: return 0f
    val radius = corner.radius.toFloat()
    val center = corner.center
    val dx =
        when (position) {
          RoundedCorner.POSITION_TOP_LEFT,
          RoundedCorner.POSITION_BOTTOM_LEFT -> left - (center.x - radius)
          else -> center.x + radius - right
        }
    val dy =
        when (position) {
          RoundedCorner.POSITION_TOP_LEFT,
          RoundedCorner.POSITION_TOP_RIGHT -> top - (center.y - radius)
          else -> center.y + radius - bottom
        }
    val effectiveRadius = min(radius - max(dx, dy), maxRadius)
    return max(effectiveRadius, 0f).times(ARC_45_DEGREES).roundToInt().toFloat()
  }

  return if (cornerAdaptation == CornerAdaptation.VERTICAL) {
    insets.copy(
        top =
            max(
                insets.top,
                max(
                    cornerInset(RoundedCorner.POSITION_TOP_LEFT),
                    cornerInset(RoundedCorner.POSITION_TOP_RIGHT),
                ),
            ),
        bottom =
            max(
                insets.bottom,
                max(
                    cornerInset(RoundedCorner.POSITION_BOTTOM_LEFT),
                    cornerInset(RoundedCorner.POSITION_BOTTOM_RIGHT),
                ),
            ),
    )
  } else {
    insets.copy(
        left =
            max(
                insets.left,
                max(
                    cornerInset(RoundedCorner.POSITION_TOP_LEFT),
                    cornerInset(RoundedCorner.POSITION_BOTTOM_LEFT),
                ),
            ),
        right =
            max(
                insets.right,
                max(
                    cornerInset(RoundedCorner.POSITION_TOP_RIGHT),
                    cornerInset(RoundedCorner.POSITION_BOTTOM_RIGHT),
                ),
            ),
    )
  }
}
