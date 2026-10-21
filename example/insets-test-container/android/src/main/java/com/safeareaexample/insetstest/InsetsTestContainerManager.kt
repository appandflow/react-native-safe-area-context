package com.safeareaexample.insetstest

import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

class InsetsTestContainerManager : ViewGroupManager<InsetsTestContainerView>() {
  override fun getName() = "InsetsTestContainer"

  override fun createViewInstance(reactContext: ThemedReactContext) =
      InsetsTestContainerView(reactContext)

  @ReactProp(name = "extraBottomInset")
  fun setExtraBottomInset(view: InsetsTestContainerView, value: Float) {
    view.setExtraBottomInset(value)
  }
}
