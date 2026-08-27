package com.th3rdwave.safeareacontext

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager

@ReactModule(name = SafeAreaViewManager.REACT_CLASS)
class SafeAreaViewManager : ReactViewManager() {
  override fun getName() = REACT_CLASS

  override fun createViewInstance(context: ThemedReactContext) = SafeAreaView(context)

  // These props are applied by RNCSafeAreaViewShadowNode in C++.
  @ReactProp(name = "mode") fun setMode(view: SafeAreaView, mode: String?) = Unit

  @ReactProp(name = "edges") fun setEdges(view: SafeAreaView, edges: ReadableMap?) = Unit

  override fun updateState(
      view: ReactViewGroup,
      props: ReactStylesDiffMap?,
      stateWrapper: StateWrapper?,
  ): Any? {
    (view as SafeAreaView).setStateWrapper(stateWrapper)
    return null
  }

  companion object {
    const val REACT_CLASS = "RNCSafeAreaView"
  }
}
