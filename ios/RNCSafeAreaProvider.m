#import "RNCSafeAreaProvider.h"

#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerObserverCoordinator.h>
#import "RNCOnInsetsChangeEvent.h"
#import "RNCSafeAreaUtils.h"

@interface RNCSafeAreaProvider () <RCTUIManagerObserver>

@end

@implementation RNCSafeAreaProvider {
  id<RCTEventDispatcherProtocol> _eventDispatcher;
  UIEdgeInsets _currentSafeAreaInsets;
  UIEdgeInsets _currentVerticalCornerAdaptedInsets;
  UIEdgeInsets _currentHorizontalCornerAdaptedInsets;
#if TARGET_OS_IPHONE
  RNCSafeAreaCornerInputs _cornerInputs;
  UIEdgeInsets _measuredVerticalCornerAdaptedInsets;
  UIEdgeInsets _measuredHorizontalCornerAdaptedInsets;
#endif
  CGRect _currentFrame;
  BOOL _initialInsetsSent;
}

- (instancetype)initWithEventDispatcher:(id<RCTEventDispatcherProtocol>)eventDispatcher
{
  RCTAssertParam(eventDispatcher);

  if ((self = [super initWithFrame:CGRectZero])) {
    _eventDispatcher = eventDispatcher;

#if !TARGET_OS_TV && !TARGET_OS_OSX
    [NSNotificationCenter.defaultCenter addObserver:self
                                           selector:@selector(invalidateSafeAreaInsets)
                                               name:UIKeyboardDidShowNotification
                                             object:nil];
    [NSNotificationCenter.defaultCenter addObserver:self
                                           selector:@selector(invalidateSafeAreaInsets)
                                               name:UIKeyboardDidHideNotification
                                             object:nil];
    [NSNotificationCenter.defaultCenter addObserver:self
                                           selector:@selector(invalidateSafeAreaInsets)
                                               name:UIKeyboardDidChangeFrameNotification
                                             object:nil];
    [NSNotificationCenter.defaultCenter addObserver:self
                                           selector:@selector(invalidateSafeAreaInsets)
                                               name:UIWindowDidBecomeVisibleNotification
                                             object:nil];
#endif
  }
  return self;
}

- (void)safeAreaInsetsDidChange
{
  [self invalidateSafeAreaInsetsMeasuringCorners:YES];
}

- (void)invalidateSafeAreaInsets
{
  [self invalidateSafeAreaInsetsMeasuringCorners:NO];
}

- (void)invalidateSafeAreaInsetsMeasuringCorners:(BOOL)measureCorners
{
  // This gets called before the view size is set by react-native so
  // make sure to wait so we don't set wrong insets to JS.
  if (CGSizeEqualToSize(self.frame.size, CGSizeZero)) {
    return;
  }

#if TARGET_OS_IPHONE
  UIEdgeInsets safeAreaInsets = self.safeAreaInsets;
  RNCSafeAreaCornerInputs cornerInputs = RNCSafeAreaCornerInputsMake(self, safeAreaInsets);
  if (measureCorners || !RNCSafeAreaCornerInputsEqual(cornerInputs, _cornerInputs)) {
    _cornerInputs = cornerInputs;
    _measuredVerticalCornerAdaptedInsets =
        RNCSafeAreaInsetsWithCornerAdaptation(self, RNCSafeAreaCornerAdaptationVertical);
    _measuredHorizontalCornerAdaptedInsets =
        RNCSafeAreaInsetsWithCornerAdaptation(self, RNCSafeAreaCornerAdaptationHorizontal);
  }
  UIEdgeInsets verticalCornerAdaptedInsets = _measuredVerticalCornerAdaptedInsets;
  UIEdgeInsets horizontalCornerAdaptedInsets = _measuredHorizontalCornerAdaptedInsets;
#elif TARGET_OS_OSX
  NSEdgeInsets safeAreaInsets;
  if (@available(macOS 11.0, *)) {
    safeAreaInsets = self.safeAreaInsets;
  } else {
    safeAreaInsets = NSEdgeInsetsZero;
  }
  NSEdgeInsets verticalCornerAdaptedInsets = safeAreaInsets;
  NSEdgeInsets horizontalCornerAdaptedInsets = safeAreaInsets;
#endif

  CGRect frame = [self convertRect:self.bounds toView:RNCParentViewController(self).view];

  if (_initialInsetsSent &&
#if TARGET_OS_IPHONE
      UIEdgeInsetsEqualToEdgeInsetsWithThreshold(safeAreaInsets, _currentSafeAreaInsets, 1.0 / RCTScreenScale()) &&
      UIEdgeInsetsEqualToEdgeInsetsWithThreshold(
          verticalCornerAdaptedInsets, _currentVerticalCornerAdaptedInsets, 1.0 / RCTScreenScale()) &&
      UIEdgeInsetsEqualToEdgeInsetsWithThreshold(
          horizontalCornerAdaptedInsets, _currentHorizontalCornerAdaptedInsets, 1.0 / RCTScreenScale()) &&
#elif TARGET_OS_OSX
      NSEdgeInsetsEqualToEdgeInsetsWithThreshold(safeAreaInsets, _currentSafeAreaInsets, 1.0 / RCTScreenScale()) &&
#endif
      CGRectEqualToRect(frame, _currentFrame)) {
    return;
  }
  _initialInsetsSent = YES;
  _currentSafeAreaInsets = safeAreaInsets;
  _currentVerticalCornerAdaptedInsets = verticalCornerAdaptedInsets;
  _currentHorizontalCornerAdaptedInsets = horizontalCornerAdaptedInsets;
  _currentFrame = frame;

  [NSNotificationCenter.defaultCenter postNotificationName:RNCSafeAreaDidChange object:self userInfo:nil];

  RNCOnInsetsChangeEvent *onInsetsChangeEvent =
      [[RNCOnInsetsChangeEvent alloc] initWithEventName:@"onInsetsChange"
                                               reactTag:self.reactTag
                                                 insets:safeAreaInsets
                            verticalCornerAdaptedInsets:verticalCornerAdaptedInsets
                          horizontalCornerAdaptedInsets:horizontalCornerAdaptedInsets
                                                  frame:frame
                                          coalescingKey:0];

  [_eventDispatcher sendEvent:onInsetsChangeEvent];
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  // UIKit can update corner-adapted insets in a layout pass before anything they depend on changes, e.g. while
  // the iPhone Duo switches displays, so layout passes always measure them again.
  [self invalidateSafeAreaInsetsMeasuringCorners:YES];
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

- (void)dealloc
{
  [_eventDispatcher.bridge.uiManager.observerCoordinator removeObserver:self];
}

@end
