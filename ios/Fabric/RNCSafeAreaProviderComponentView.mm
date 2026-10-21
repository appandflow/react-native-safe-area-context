#import "RNCSafeAreaProviderComponentView.h"

#import <react/renderer/components/safeareacontext/ComponentDescriptors.h>
#import <react/renderer/components/safeareacontext/EventEmitters.h>
#import <react/renderer/components/safeareacontext/Props.h>
#import <react/renderer/components/safeareacontext/RCTComponentViewHelpers.h>

#import <React/RCTFabricComponentsPlugins.h>
#import "RNCSafeAreaUtils.h"

using namespace facebook::react;

@interface RNCSafeAreaProviderComponentView () <RCTRNCSafeAreaProviderViewProtocol>
@end

@implementation RNCSafeAreaProviderComponentView {
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
  BOOL _registeredNotifications;
}

// Needed because of this: https://github.com/facebook/react-native/pull/37274
+ (void)load
{
  [super load];
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNCSafeAreaProviderProps>();
    _props = defaultProps;
  }

  return self;
}

#if !TARGET_OS_OSX
- (void)willMoveToSuperview:(UIView *)newSuperView
{
  [super willMoveToSuperview:newSuperView];

  if (newSuperView != nil && !_registeredNotifications) {
    _registeredNotifications = YES;
    [self registerNotifications];
  }
}
#endif

- (void)registerNotifications
{
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
#endif
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
  if (self.superview == nil) {
    return;
  }
  // This gets called before the view size is set by react-native so
  // make sure to wait so we don't set wrong insets to JS.
  if (CGSizeEqualToSize(self.frame.size, CGSizeZero)) {
    return;
  }

  UIEdgeInsets safeAreaInsets = self.safeAreaInsets;
#if TARGET_OS_IPHONE
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
  UIEdgeInsets verticalCornerAdaptedInsets = safeAreaInsets;
  UIEdgeInsets horizontalCornerAdaptedInsets = safeAreaInsets;
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

  if (_eventEmitter) {
    RNCSafeAreaProviderEventEmitter::OnInsetsChange event = {
        .insets =
            {
                .top = safeAreaInsets.top,
                .left = safeAreaInsets.left,
                .bottom = safeAreaInsets.bottom,
                .right = safeAreaInsets.right,
            },
        .verticalCornerAdaptedInsets =
            {
                .top = verticalCornerAdaptedInsets.top,
                .right = verticalCornerAdaptedInsets.right,
                .bottom = verticalCornerAdaptedInsets.bottom,
                .left = verticalCornerAdaptedInsets.left,
            },
        .horizontalCornerAdaptedInsets =
            {
                .top = horizontalCornerAdaptedInsets.top,
                .right = horizontalCornerAdaptedInsets.right,
                .bottom = horizontalCornerAdaptedInsets.bottom,
                .left = horizontalCornerAdaptedInsets.left,
            },
        .frame =
            {
                .x = frame.origin.x,
                .y = frame.origin.y,
                .width = frame.size.width,
                .height = frame.size.height,
            },
    };
    std::static_pointer_cast<RNCSafeAreaProviderEventEmitter const>(_eventEmitter)->onInsetsChange(event);
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  // UIKit can update corner-adapted insets in a layout pass before anything they depend on changes, e.g. while
  // the iPhone Duo switches displays, so layout passes always measure them again.
  [self invalidateSafeAreaInsetsMeasuringCorners:YES];
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNCSafeAreaProviderComponentDescriptor>();
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _currentSafeAreaInsets = UIEdgeInsetsZero;
  _currentVerticalCornerAdaptedInsets = UIEdgeInsetsZero;
  _currentHorizontalCornerAdaptedInsets = UIEdgeInsetsZero;
#if TARGET_OS_IPHONE
  _cornerInputs = (RNCSafeAreaCornerInputs){};
#endif
  _currentFrame = CGRectZero;
  _initialInsetsSent = NO;
  [NSNotificationCenter.defaultCenter removeObserver:self];
  _registeredNotifications = NO;
}

@end

Class<RCTComponentViewProtocol> RNCSafeAreaProviderCls(void)
{
  return RNCSafeAreaProviderComponentView.class;
}
