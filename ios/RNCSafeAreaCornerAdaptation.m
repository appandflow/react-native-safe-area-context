#import "RNCSafeAreaCornerAdaptation.h"
#import <React/RCTConvert.h>

@implementation RCTConvert (RNCSafeAreaCornerAdaptation)

RCT_ENUM_CONVERTER(
    RNCSafeAreaCornerAdaptation,
    (@{
      @"none" : @(RNCSafeAreaCornerAdaptationNone),
      @"vertical" : @(RNCSafeAreaCornerAdaptationVertical),
      @"horizontal" : @(RNCSafeAreaCornerAdaptationHorizontal),
    }),
    RNCSafeAreaCornerAdaptationNone,
    integerValue);

@end
