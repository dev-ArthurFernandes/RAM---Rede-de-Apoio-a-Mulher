import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface Tab<T extends string> {
  key: T;
  label: string;
  icon?: string;
}

interface AnimatedTabsProps<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (key: T) => void;
}

const PADDING = 4;

export function AnimatedTabs<T extends string>({ tabs, value, onChange }: AnimatedTabsProps<T>) {
  const [containerWidth, setContainerWidth] = useState(0);
  const index = Math.max(0, tabs.findIndex((tab) => tab.key === value));
  const tabWidth = Math.max(0, (containerWidth - PADDING * 2) / tabs.length);

  const pillStyle = useAnimatedStyle(() => ({
    width: tabWidth,
    transform: [{ translateX: withTiming(index * tabWidth, { duration: 200 }) }],
  }));

  return (
    <View
      className="flex-row bg-gray-100 rounded-2xl p-1"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: PADDING,
            bottom: PADDING,
            left: PADDING,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          },
          pillStyle,
        ]}
      />
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            className="flex-1 flex-row items-center justify-center gap-1 py-2 rounded-xl"
            onPress={() => onChange(tab.key)}
          >
            {tab.icon && <Text className="text-sm">{tab.icon}</Text>}
            <Text className={`text-sm font-medium ${active ? 'text-text-main' : 'text-text-sub'}`}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
