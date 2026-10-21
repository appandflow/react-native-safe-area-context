#import <React/RCTDefines.h>
#import <React/RCTView.h>
#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#elif TARGET_OS_OSX
#import <AppKit/AppKit.h>
typedef NSView UIView;
#endif
#import "RNCSafeAreaCornerAdaptation.h"

extern NSString *const RNCSafeAreaDidChange;

RCT_EXTERN BOOL
#if TARGET_OS_IPHONE
UIEdgeInsetsEqualToEdgeInsetsWithThreshold(UIEdgeInsets insets1, UIEdgeInsets insets2, CGFloat threshold);
#elif TARGET_OS_OSX
NSEdgeInsetsEqualToEdgeInsetsWithThreshold(NSEdgeInsets insets1, NSEdgeInsets insets2, CGFloat threshold);
#endif

#if TARGET_OS_IPHONE
RCT_EXTERN UIViewController *RNCParentViewController(UIView *view);
#elif TARGET_OS_OSX
RCT_EXTERN NSViewController *RNCParentViewController(NSView *view);
#endif

#if TARGET_OS_IPHONE
RCT_EXTERN UIEdgeInsets
RNCSafeAreaInsetsWithCornerAdaptation(UIView *view, RNCSafeAreaCornerAdaptation cornerAdaptation);

typedef struct RNCSafeAreaCornerInputs {
  UIEdgeInsets safeAreaInsets;
  CGRect frameInWindow;
  CGRect windowFrame;
} RNCSafeAreaCornerInputs;

RCT_EXTERN RNCSafeAreaCornerInputs RNCSafeAreaCornerInputsMake(UIView *view, UIEdgeInsets safeAreaInsets);
RCT_EXTERN BOOL RNCSafeAreaCornerInputsEqual(RNCSafeAreaCornerInputs inputs1, RNCSafeAreaCornerInputs inputs2);
#endif
