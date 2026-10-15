package com.th3rdwave.safeareacontext

import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.ContextWrapper
import android.graphics.Insets
import android.view.DisplayCutout
import android.view.View
import android.view.WindowInsets
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [29])
class SafeAreaUtilsTest {
  @Test
  fun aStatusBarHiddenThroughTheSystemUiVisibilityLeavesNoTopInset() {
    val view = viewFillingScreen(systemUiVisibility = EDGE_TO_EDGE or HIDDEN_STATUS_BAR)

    assertEquals(
        EdgeInsets(top = 0f, right = 0f, bottom = NAVIGATION_BAR, left = 0f),
        getSafeAreaInsets(view),
    )
  }

  @Test
  fun aHiddenStatusBarLeavesTheDisplayCutoutsTopInset() {
    val view =
        viewFillingScreen(
            systemUiVisibility = EDGE_TO_EDGE or HIDDEN_STATUS_BAR,
            cutoutTop = CUTOUT,
        )

    assertEquals(
        EdgeInsets(top = CUTOUT, right = 0f, bottom = NAVIGATION_BAR, left = 0f),
        getSafeAreaInsets(view),
    )
  }

  @Test
  fun aVisibleStatusBarKeepsItsInset() {
    val view = viewFillingScreen(systemUiVisibility = EDGE_TO_EDGE)

    assertEquals(
        EdgeInsets(top = STATUS_BAR, right = 0f, bottom = NAVIGATION_BAR, left = 0f),
        getSafeAreaInsets(view),
    )
  }

  @Test
  fun aNavigationBarHiddenThroughTheSystemUiVisibilityLeavesNoBottomInset() {
    val view = viewFillingScreen(systemUiVisibility = EDGE_TO_EDGE or HIDDEN_NAVIGATION_BAR)

    assertEquals(
        EdgeInsets(top = STATUS_BAR, right = 0f, bottom = 0f, left = 0f),
        getSafeAreaInsets(view),
    )
  }

  @Test
  fun barsTheSystemShowsInMultiWindowModeKeepTheirInsets() {
    val view =
        viewFillingScreen(
            systemUiVisibility = EDGE_TO_EDGE or HIDDEN_STATUS_BAR or HIDDEN_NAVIGATION_BAR,
            viewContext = activityContext(isInMultiWindowMode = true),
        )

    assertEquals(
        EdgeInsets(top = STATUS_BAR, right = 0f, bottom = NAVIGATION_BAR, left = 0f),
        getSafeAreaInsets(view),
    )
  }

  @Test
  fun aDecorViewTakesMultiWindowModeFromTheActivityItIsGiven() {
    val decorView =
        viewFillingScreen(
            systemUiVisibility = EDGE_TO_EDGE or HIDDEN_STATUS_BAR or HIDDEN_NAVIGATION_BAR,
            viewContext = ContextWrapper(mock<Application>()),
        )

    assertEquals(
        EdgeInsets(top = STATUS_BAR, right = 0f, bottom = NAVIGATION_BAR, left = 0f),
        getSafeAreaInsets(decorView, activityContext(isInMultiWindowMode = true)),
    )
  }

  @Test
  fun anAppHidingNoBarNeverAsksWhetherItIsInMultiWindowMode() {
    val activity = mock<Activity>()
    val view =
        viewFillingScreen(systemUiVisibility = EDGE_TO_EDGE, viewContext = ContextWrapper(activity))

    getSafeAreaInsets(view)

    verify(activity, never()).isInMultiWindowMode
  }

  private fun activityContext(isInMultiWindowMode: Boolean): Context =
      ContextWrapper(
          mock<Activity> { on { this.isInMultiWindowMode } doReturn isInMultiWindowMode }
      )

  private fun viewFillingScreen(
      systemUiVisibility: Int,
      cutoutTop: Float = 0f,
      viewContext: Context = activityContext(isInMultiWindowMode = false),
  ): View {
    val cutout =
        if (cutoutTop > 0f) {
          DisplayCutout(
              Insets.of(0, cutoutTop.toInt(), 0, 0),
              null,
              android.graphics.Rect(0, 0, SCREEN_WIDTH, cutoutTop.toInt()),
              null,
              null,
          )
        } else {
          null
        }
    val systemBars = Insets.of(0, STATUS_BAR.toInt(), 0, NAVIGATION_BAR.toInt())
    val insets =
        WindowInsets.Builder()
            .setSystemWindowInsets(systemBars)
            .setStableInsets(systemBars)
            .setDisplayCutout(cutout)
            .build()
    val rootView =
        mock<View> {
          on { rootWindowInsets } doReturn insets
          on { windowSystemUiVisibility } doReturn systemUiVisibility
          on { width } doReturn SCREEN_WIDTH
          on { height } doReturn SCREEN_HEIGHT
        }
    return mock {
      on { context } doReturn viewContext
      on { this.rootView } doReturn rootView
      on { width } doReturn SCREEN_WIDTH
      on { height } doReturn SCREEN_HEIGHT
      on { getGlobalVisibleRect(any()) } doAnswer
          {
            it.getArgument<android.graphics.Rect>(0).set(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
            true
          }
    }
  }

  private companion object {
    @Suppress("DEPRECATION")
    const val EDGE_TO_EDGE: Int =
        View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
    @Suppress("DEPRECATION") const val HIDDEN_STATUS_BAR: Int = View.SYSTEM_UI_FLAG_FULLSCREEN
    @Suppress("DEPRECATION")
    const val HIDDEN_NAVIGATION_BAR: Int = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
    const val SCREEN_WIDTH: Int = 1080
    const val SCREEN_HEIGHT: Int = 2340
    const val STATUS_BAR: Float = 96f
    const val NAVIGATION_BAR: Float = 126f
    const val CUTOUT: Float = 80f
  }
}
