import { TextInput, TextInputProps, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  required?: boolean;
}

export function Input({ label, required, ...props }: InputProps) {
  return (
    <View className="gap-1">
      {label && (
        <Text className="text-sm font-medium text-text-main">
          {label}{required && ' *'}
        </Text>
      )}
      <TextInput
        className="bg-muted rounded-xl px-4 py-3 text-text-main text-sm"
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    </View>
  );
}
