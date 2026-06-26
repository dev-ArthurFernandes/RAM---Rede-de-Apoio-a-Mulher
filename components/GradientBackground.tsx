import { useId } from 'react';
import { Platform, View, ViewProps, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface GradientBackgroundProps extends ViewProps {
  from?: string;
  to?: string;
}

export function GradientBackground({ from = '#EC4899', to = '#7C3AED', style, children, ...props }: GradientBackgroundProps) {
  const gradientId = useId().replace(/[:]/g, '');

  if (Platform.OS === 'web') {
    const webGradientStyle = { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` } as ViewStyle;
    return (
      <View style={[webGradientStyle, style]} {...props}>
        {children}
      </View>
    );
  }

  return (
    <View style={style} {...props}>
      <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
      {children}
    </View>
  );
}
