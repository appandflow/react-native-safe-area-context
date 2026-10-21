#import <Foundation/Foundation.h>
#import <React/RCTEventDispatcherProtocol.h>

@interface RNCOnInsetsChangeEvent : NSObject <RCTEvent>

- (instancetype)initWithEventName:(NSString *)eventName
                         reactTag:(NSNumber *)reactTag
                           insets:(UIEdgeInsets)insets
      verticalCornerAdaptedInsets:(UIEdgeInsets)verticalCornerAdaptedInsets
    horizontalCornerAdaptedInsets:(UIEdgeInsets)horizontalCornerAdaptedInsets
                            frame:(CGRect)frame
                    coalescingKey:(uint16_t)coalescingKey NS_DESIGNATED_INITIALIZER;

@end
