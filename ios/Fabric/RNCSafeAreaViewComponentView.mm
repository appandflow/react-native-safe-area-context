#import "RNCSafeAreaViewComponentView.h"

#import <react/renderer/components/safeareacontext/EventEmitters.h>
#import <react/renderer/components/safeareacontext/Props.h>
#import <react/renderer/components/safeareacontext/RCTComponentViewHelpers.h>
#import <react/renderer/components/safeareacontext/RNCSafeAreaViewComponentDescriptor.h>
#import <react/renderer/components/safeareacontext/RNCSafeAreaViewShadowNode.h>

#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>

#import "RNCSafeAreaProviderComponentView.h"
#import "RNCSafeAreaUtils.h"

using namespace facebook::react;

@interface RNCSafeAreaViewComponentView () <RCTRNCSafeAreaViewViewProtocol>
@end

#if TARGET_OS_IPHONE
// Mirror of the provider-side derivation (see
// RNCSafeAreaProviderComponentView.mm): substitute window-derived insets
// when an attached provider view still reads all-zero (iOS 26.4+ reattach
// propagation bug).
static UIEdgeInsets RNCViewDeriveInsetsFromWindow(UIView *view, UIEdgeInsets current)
{
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
}
#endif

@implementation RNCSafeAreaViewComponentView {
  RNCSafeAreaViewShadowNode::ConcreteState::Shared _state;
  UIEdgeInsets _currentSafeAreaInsets;
  __weak UIView *_Nullable _providerView;
}

// Needed because of this: https://github.com/facebook/react-native/pull/37274
+ (void)load
{
  [super load];
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNCSafeAreaViewProps>();
    _props = defaultProps;
  }

  return self;
}

- (NSString *)description
{
  NSString *superDescription = [super description];

  // Cutting the last `>` character.
  if (superDescription.length > 0 && [superDescription characterAtIndex:superDescription.length - 1] == '>') {
    superDescription = [superDescription substringToIndex:superDescription.length - 1];
  }

#if TARGET_OS_IPHONE
  NSString *providerViewSafeAreaInsetsString = NSStringFromUIEdgeInsets(_providerView.safeAreaInsets);
  NSString *currentSafeAreaInsetsString = NSStringFromUIEdgeInsets(_currentSafeAreaInsets);
#elif TARGET_OS_OSX
  NSString *providerViewSafeAreaInsetsString = [NSString stringWithFormat:@"{%f,%f,%f,%f}",
                                                                          _providerView.safeAreaInsets.top,
                                                                          _providerView.safeAreaInsets.left,
                                                                          _providerView.safeAreaInsets.bottom,
                                                                          _providerView.safeAreaInsets.right];
  NSString *currentSafeAreaInsetsString = [NSString stringWithFormat:@"{%f,%f,%f,%f}",
                                                                     _currentSafeAreaInsets.top,
                                                                     _currentSafeAreaInsets.left,
                                                                     _currentSafeAreaInsets.bottom,
                                                                     _currentSafeAreaInsets.right];
#endif

  return [NSString stringWithFormat:@"%@; RNCSafeAreaInsets = %@; appliedRNCSafeAreaInsets = %@>",
                                    superDescription,
                                    providerViewSafeAreaInsetsString,
                                    currentSafeAreaInsetsString];
}

- (void)didMoveToWindow
{
  [self attachToProviderView];
}

- (void)attachToProviderView
{
  UIView *previousProviderView = _providerView;
  _providerView = [self findNearestProvider];

  [self updateStateIfNecessary];

  if (previousProviderView != _providerView) {
    [NSNotificationCenter.defaultCenter removeObserver:self name:RNCSafeAreaDidChange object:previousProviderView];
    [NSNotificationCenter.defaultCenter addObserver:self
                                           selector:@selector(safeAreaProviderInsetsDidChange:)
                                               name:RNCSafeAreaDidChange
                                             object:_providerView];
  }

  // Mirror of the provider's deferred re-check (see
  // RNCSafeAreaProviderComponentView didMoveToWindow): on iOS 26.4+ a
  // reattached subtree can receive its safe-area insets without any
  // callback or layout pass following, so the value read at attach time
  // (often zero) would stick. Re-read after the runloop settles.
  if (self.window != nil) {
    __weak __typeof__(self) weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      [weakSelf updateStateIfNecessary];
      dispatch_async(dispatch_get_main_queue(), ^{
        [weakSelf updateStateIfNecessary];
      });
    });
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.15 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      [weakSelf updateStateIfNecessary];
    });
  }
}

// findNearestProvider can race view reparenting (e.g. native tabs on
// iOS 26.4+): at didMoveToWindow time the provider may not be in the
// ancestor chain yet, so the fallback binds to `self` — a view that never
// posts RNCSafeAreaDidChange — and this view reads its own (possibly zero)
// insets until the NEXT detach/reattach re-resolves it (which is why a
// push/pop "healed" it). Keep retrying on later passes until a real
// provider is found; apps genuinely without a provider still converge to
// the legacy self-fallback because retries keep returning self.
- (BOOL)needsProviderReattach
{
  return _providerView == nil || _providerView == (UIView *)self;
}

- (void)safeAreaProviderInsetsDidChange:(NSNotification *)notification
{
  [self updateStateIfNecessary];
}

- (void)updateStateIfNecessary
{
  // A view detached from the window (e.g. a screen covered by a react-native-screens
  // native stack) reports zero safeAreaInsets, which would commit a zero-inset layout
  // for the hidden screen.
  if (self.window == nil) {
    return;
  }
  if (_providerView == nil) {
    return;
  }
#if TARGET_OS_IPHONE
  UIEdgeInsets safeAreaInsets = RNCViewDeriveInsetsFromWindow(_providerView, _providerView.safeAreaInsets);

  if (UIEdgeInsetsEqualToEdgeInsetsWithThreshold(safeAreaInsets, _currentSafeAreaInsets, 1.0 / RCTScreenScale())) {
    return;
  }
#elif TARGET_OS_OSX
  NSEdgeInsets safeAreaInsets = _providerView.safeAreaInsets;
  if (NSEdgeInsetsEqualToEdgeInsetsWithThreshold(safeAreaInsets, _currentSafeAreaInsets, 1.0 / RCTScreenScale())) {
    return;
  }
#endif
  _currentSafeAreaInsets = safeAreaInsets;
  [self updateState];
}

- (UIView *)findNearestProvider
{
  UIView *current = self.superview;
  while (current != nil) {
    if ([current isKindOfClass:RNCSafeAreaProviderComponentView.class]) {
      return current;
    }
    current = current.superview;
  }
  return self;
}

- (void)updateState
{
  if (!_state) {
    return;
  }

  _state->updateState(
      [=](RNCSafeAreaViewShadowNode::ConcreteState::Data const &oldData)
          -> RNCSafeAreaViewShadowNode::ConcreteState::SharedData {
        auto newData = oldData;
        newData.insets = RCTEdgeInsetsFromUIEdgeInsets(_currentSafeAreaInsets);
        return std::make_shared<RNCSafeAreaViewShadowNode::ConcreteState::Data const>(newData);
      });
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNCSafeAreaViewComponentDescriptor>();
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _state = std::static_pointer_cast<RNCSafeAreaViewShadowNode::ConcreteState const>(state);
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];
  if ([self needsProviderReattach]) {
    [self attachToProviderView];
  } else {
    [self updateStateIfNecessary];
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  if ([self needsProviderReattach]) {
    [self attachToProviderView];
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];

  [NSNotificationCenter.defaultCenter removeObserver:self];
  _state.reset();
  _providerView = nil;
  _currentSafeAreaInsets = UIEdgeInsetsZero;
}

@end

Class<RCTComponentViewProtocol> RNCSafeAreaViewCls(void)
{
  return RNCSafeAreaViewComponentView.class;
}
