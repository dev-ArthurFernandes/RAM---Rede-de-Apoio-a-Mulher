import { View, Text } from 'react-native';

export function RAMLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const circleSize = size === 'lg' ? 'w-20 h-20' : size === 'sm' ? 'w-10 h-10' : 'w-14 h-14';
  const heartSize = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
  const titleSize = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-xl' : 'text-3xl';

  return (
    <View className="items-center gap-2">
      <View className={`${circleSize} rounded-full bg-primary-light items-center justify-center`}>
        <Text className={`${heartSize}`}>🤍</Text>
      </View>
      <Text className={`${titleSize} font-bold text-text-main`}>RAM</Text>
      <Text className="text-sm text-text-sub">Rede de Apoio à Mulher</Text>
    </View>
  );
}
