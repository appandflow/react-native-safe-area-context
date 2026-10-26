package com.th3rdwave.safeareacontext

import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = SafeAreaContextModule.NAME)
class SafeAreaContextModule(reactContext: ReactApplicationContext?) :
    NativeSafeAreaContextSpec(reactContext) {
  override fun getName(): String {
    return NAME
  }

  public override fun getTypedExportedConstants(): Map<String, Any?> {
    return mapOf("initialWindowMetrics" to getInitialWindowMetrics())
  }

  private fun getInitialWindowMetrics(): Map<String, Any>? {
    val decorView = reactApplicationContext.currentActivity?.window?.decorView as ViewGroup?
    val contentView = decorView?.findViewById<View>(android.R.id.content) ?: return null
    val insets = getSafeAreaInsets(decorView)
    val frame = getFrame(decorView, contentView)
    val corners = getRoundedCorners(decorView)
    return if (insets == null || frame == null) {
      null
    } else
        mapOf(
            "insets" to edgeInsetsToJavaMap(insets),
            "verticalCornerAdaptedInsets" to
                edgeInsetsToJavaMap(
                    getCornerAdaptedInsets(decorView, insets, corners, CornerAdaptation.VERTICAL)
                ),
            "horizontalCornerAdaptedInsets" to
                edgeInsetsToJavaMap(
                    getCornerAdaptedInsets(decorView, insets, corners, CornerAdaptation.HORIZONTAL)
                ),
            "frame" to rectToJavaMap(frame),
        )
  }

  companion object {
    const val NAME = "RNCSafeAreaContext"
  }
}
