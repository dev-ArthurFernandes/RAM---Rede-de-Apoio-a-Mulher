import { useState } from 'react';
import { TextInput, TextInputProps, View, Text, Pressable } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  required?: boolean;
}

export function Input({ label, required, secureTextEntry, ...props }: InputProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View className="gap-1">
      {label && (
        <Text className="text-sm font-medium text-text-main">
          {label}{required && ' *'}
        </Text>
      )}
      <View className="relative">
        <TextInput
          className={`bg-muted rounded-xl px-4 py-3 text-text-main text-sm ${isPassword ? 'pr-11' : ''}`}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isPassword && !visible}
          {...props}
        />
        {isPassword && (
          <Pressable
            className="absolute right-3 top-0 bottom-0 items-center justify-center"
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
          >
            <Text className="text-base">{visible ? '🙈' : '👁️'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
