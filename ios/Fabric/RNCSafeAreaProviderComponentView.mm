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
  [self invalidateSafeAreaInsets];
}

static UIEdgeInsets RNCDeriveInsetsFromWindow(UIView *view, UIEdgeInsets current)
{
#if TARGET_OS_IPHONE
  // iOS 26.4+ reattach bug: UIKit can leave a reattached view's
  // safeAreaInsets at zero indefinitely (no propagation, no callback, no
  // layout pass). The window's insets are always correct — derive the
  // view's geometric share of them, exactly as UIKit propagation would.
  // Only substitutes in the broken case: attached + all-zero + window
  // non-zero.
  UIWindow *window = view.window;
  if (window == nil || !UIEdgeInsetsEqualToEdgeInsets(current, UIEdgeInsetsZero)) {
    return current;
  }
  UIEdgeInsets w = window.safeAreaInsets;
  if (UIEdgeInsetsEqualToEdgeInsets(w, UIEdgeInsetsZero)) {
    return current;
  }
  CGRect fw = [view convertRect:view.bounds toView:window];
  CGFloat winW = window.bounds.size.width;
  CGFloat winH = window.bounds.size.height;
  UIEdgeInsets derived;
  derived.top = MAX(0, w.top - MAX(0, CGRectGetMinY(fw)));
  derived.left = MAX(0, w.left - MAX(0, CGRectGetMinX(fw)));
  derived.bottom = MAX(0, w.bottom - MAX(0, winH - CGRectGetMaxY(fw)));
  derived.right = MAX(0, w.right - MAX(0, winW - CGRectGetMaxX(fw)));
  return derived;
#else
  return current;
#endif
}

- (void)invalidateSafeAreaInsets
{
  if (self.superview == nil) {
    return;
  }
#if TARGET_OS_IPHONE
  // A detached subtree legitimately reports zero insets; caching/emitting
  // them poisons the JS context and the sent-flag until the next
  // threshold-exceeding change (which iOS 26.4+ may never deliver). Wait
  // for the window; didMoveToWindow re-invalidates on attach.
  if (self.window == nil) {
    return;
  }
#endif
  // This gets called before the view size is set by react-native so
  // make sure to wait so we don't set wrong insets to JS.
  if (CGSizeEqualToSize(self.frame.size, CGSizeZero)) {
    return;
  }

  UIEdgeInsets safeAreaInsets = RNCDeriveInsetsFromWindow(self, self.safeAreaInsets);
  CGRect frame = [self convertRect:self.bounds toView:RNCParentViewController(self).view];

  if (_initialInsetsSent &&
#if TARGET_OS_IPHONE
      UIEdgeInsetsEqualToEdgeInsetsWithThreshold(safeAreaInsets, _currentSafeAreaInsets, 1.0 / RCTScreenScale()) &&
#elif TARGET_OS_OSX
      NSEdgeInsetsEqualToEdgeInsetsWithThreshold(safeAreaInsets, _currentSafeAreaInsets, 1.0 / RCTScreenScale()) &&
#endif
      CGRectEqualToRect(frame, _currentFrame)) {
    return;
  }

  _initialInsetsSent = YES;
  _currentSafeAreaInsets = safeAreaInsets;
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

  [self invalidateSafeAreaInsets];
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  // Safe area insets are only real once the view is in a window. A layout
  // pass on a detached subtree (e.g. a native tab's content) can cache
  // zero insets with _initialInsetsSent = YES; if UIKit's
  // safeAreaInsetsDidChange lands while the early-return guards above
  // still apply, nothing re-invalidates after attach and zero is latched
  // until an unrelated relayout (observed on iOS 26.4+). Re-reading here
  // is idempotent: the threshold check suppresses no-op changes.
  if (self.window != nil) {
    [self invalidateSafeAreaInsets];
    // iOS 26.4+: after a subtree reattach (e.g. native tabs reparenting),
    // UIKit can apply safe-area insets to this view WITHOUT calling
    // safeAreaInsetsDidChange, and with no further layout pass — a stale
    // (often zero) value then stays cached forever. Observed directly via
    // instrumentation: reattach reads top=0, the real value lands a beat
    // later, no callback follows. Re-check on the next runloop turns; the
    // threshold guard makes these free when nothing changed.
    __weak __typeof__(self) weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      [weakSelf invalidateSafeAreaInsets];
      dispatch_async(dispatch_get_main_queue(), ^{
        [weakSelf invalidateSafeAreaInsets];
      });
    });
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.15 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      [weakSelf invalidateSafeAreaInsets];
    });
  }
}

- (void)updateEventEmitter:(const facebook::react::EventEmitter::Shared &)eventEmitter
{
  [super updateEventEmitter:eventEmitter];

  // invalidateSafeAreaInsets caches values and sets _initialInsetsSent
  // BEFORE checking _eventEmitter, so an emit attempted pre-attach is
  // silently dropped and never retried — JS then never receives the
  // initial insets. Replay through the freshly attached emitter.
  if (_initialInsetsSent) {
    _initialInsetsSent = NO;
    [self invalidateSafeAreaInsets];
  }
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
