package com.safeareaexample.insetstest

import android.content.Context
import android.graphics.Insets
import android.os.Build
import android.view.WindowInsets
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.views.view.ReactViewGroup

class InsetsTestContainerView(context: Context) : ReactViewGroup(context) {
  private var extraBottomPx = 0

  fun setExtraBottomInset(dp: Float) {
    val px = PixelUtil.toPixelFromDIP(dp).toInt()
    if (px != extraBottomPx) {
      extraBottomPx = px
      requestApplyInsets()
    }
  }

  override fun dispatchApplyWindowInsets(insets: WindowInsets): WindowInsets {
    if (extraBottomPx == 0 || Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      return super.dispatchApplyWindowInsets(insets)
    }
    val navigationBars = insets.getInsets(WindowInsets.Type.navigationBars())
    val modified =
        WindowInsets.Builder(insets)
            .setInsets(
                WindowInsets.Type.navigationBars(),
                Insets.of(
                    navigationBars.left,
                    navigationBars.top,
                    navigationBars.right,
                    navigationBars.bottom + extraBottomPx,
                ),
            )
            .build()
    return super.dispatchApplyWindowInsets(modified)
  }
}
