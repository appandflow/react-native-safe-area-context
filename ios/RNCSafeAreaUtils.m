#import "RNCSafeAreaUtils.h"

#import <React/RCTUIManager.h>

NSString *const RNCSafeAreaDidChange = @"RNCSafeAreaDidChange";

#if TARGET_OS_IPHONE
BOOL UIEdgeInsetsEqualToEdgeInsetsWithThreshold(UIEdgeInsets insets1, UIEdgeInsets insets2, CGFloat threshold)
#elif TARGET_OS_OSX
BOOL NSEdgeInsetsEqualToEdgeInsetsWithThreshold(NSEdgeInsets insets1, NSEdgeInsets insets2, CGFloat threshold)
#endif
{
  return ABS(insets1.left - insets2.left) <= threshold && ABS(insets1.right - insets2.right) <= threshold &&
      ABS(insets1.top - insets2.top) <= threshold && ABS(insets1.bottom - insets2.bottom) <= threshold;
}

#if TARGET_OS_IPHONE
UIViewController *RNCParentViewController(UIView *view)
{
  UIResponder *responder = view.nextResponder;
  while (responder != nil) {
    if ([responder isKindOfClass:[UIViewController class]]) {
      return (UIViewController *)responder;
    }
    responder = responder.nextResponder;
  }
  return nil;
}
#elif TARGET_OS_OSX
NSViewController *RNCParentViewController(NSView *view)
{
  NSResponder *responder = view.nextResponder;
  while (responder != nil) {
    if ([responder isKindOfClass:[NSViewController class]]) {
      return (NSViewController *)responder;
    }
    responder = responder.nextResponder;
  }
  return nil;
}
#endif

#if TARGET_OS_IPHONE
UIEdgeInsets RNCSafeAreaInsetsWithCornerAdaptation(UIView *view, RNCSafeAreaCornerAdaptation cornerAdaptation)
{
  // UIViewLayoutRegion is only declared by the iOS 26 SDK and later.
#if (defined(__IPHONE_26_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_26_0) || \
    (defined(__TVOS_26_0) && __TV_OS_VERSION_MAX_ALLOWED >= __TVOS_26_0)
  if (@available(iOS 26.0, tvOS 26.0, visionOS 26.0, *)) {
    switch (cornerAdaptation) {
      case RNCSafeAreaCornerAdaptationVertical:
        return [view edgeInsetsForLayoutRegion:[UIViewLayoutRegion safeAreaLayoutRegionWithCornerAdaptation:
                                                                       UIViewLayoutRegionAdaptivityAxisVertical]];
      case RNCSafeAreaCornerAdaptationHorizontal:
        return [view edgeInsetsForLayoutRegion:[UIViewLayoutRegion safeAreaLayoutRegionWithCornerAdaptation:
                                                                       UIViewLayoutRegionAdaptivityAxisHorizontal]];
      case RNCSafeAreaCornerAdaptationNone:
        break;
    }
  }
#endif
  return view.safeAreaInsets;
}

RNCSafeAreaCornerInputs RNCSafeAreaCornerInputsMake(UIView *view, UIEdgeInsets safeAreaInsets)
{
  return (RNCSafeAreaCornerInputs){
      .safeAreaInsets = safeAreaInsets,
      .frameInWindow = [view convertRect:view.bounds toView:nil],
      .windowFrame = view.window.frame,
  };
}

BOOL RNCSafeAreaCornerInputsEqual(RNCSafeAreaCornerInputs inputs1, RNCSafeAreaCornerInputs inputs2)
{
  return UIEdgeInsetsEqualToEdgeInsets(inputs1.safeAreaInsets, inputs2.safeAreaInsets) &&
      CGRectEqualToRect(inputs1.frameInWindow, inputs2.frameInWindow) &&
      CGRectEqualToRect(inputs1.windowFrame, inputs2.windowFrame);
}
#endif
