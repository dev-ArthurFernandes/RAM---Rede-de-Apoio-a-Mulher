import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export function BackHeader() {
  const router = useRouter();
  return (
    <TouchableOpacity
      className="flex-row items-center gap-1 px-4 pt-4 pb-2"
      onPress={() => router.back()}
    >
      <Text className="text-text-main text-base">←</Text>
      <Text className="text-text-main text-base">Voltar</Text>
    </TouchableOpacity>
  );
}
