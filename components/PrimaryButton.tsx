import { Text, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface PrimaryButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: 'solid' | 'outline';
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ label, variant = 'solid', style, disabled, onPressIn, onPressOut, ...props }: PrimaryButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        disabled={disabled}
        onPressIn={(e) => {
          scale.value = withTiming(0.97, { duration: 100 });
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withTiming(1, { duration: 100 });
          onPressOut?.(e);
        }}
        className={`rounded-xl py-4 items-center ${
          variant === 'solid' ? 'bg-primary' : 'bg-white border border-gray-200'
        } ${disabled ? 'opacity-50' : ''}`}
        {...props}
      >
        <Text
          className={`font-semibold text-sm ${
            variant === 'solid' ? 'text-white' : 'text-text-main'
          }`}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
