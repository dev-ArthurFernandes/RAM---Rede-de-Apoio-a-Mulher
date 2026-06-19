import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../components/BackHeader';
import { PrimaryButton } from '../components/PrimaryButton';

export default function ReconhecimentoFacial() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackHeader />
      <View className="flex-1 px-4">
        <View className="bg-white rounded-3xl p-6 border border-gray-100 gap-6">
          <View className="w-14 h-14 rounded-2xl bg-primary items-center justify-center">
            <Text className="text-2xl">📷</Text>
          </View>

          <View className="gap-1">
            <Text className="text-xl font-bold text-text-main">Reconhecimento Facial</Text>
            <Text className="text-text-sub text-sm">Use seu rosto para acessar o aplicativo de forma segura e discreta</Text>
          </View>

          <View className="bg-primary-bg rounded-2xl p-4 flex-row gap-3">
            <Text className="text-primary text-lg">ℹ️</Text>
            <Text className="flex-1 text-text-main text-sm">
              O reconhecimento facial garante que apenas você tenha acesso ao aplicativo. Suas informações biométricas são processadas localmente e não são armazenadas.
            </Text>
          </View>

          <PrimaryButton label="📷  Usar Câmera" onPress={() => router.replace('/(app)/home')} />
          <PrimaryButton label="⬆  Fazer Upload de Foto" variant="outline" onPress={() => router.replace('/(app)/home')} />

          <View className="gap-2">
            <Text className="font-semibold text-text-main text-sm">Por que reconhecimento facial?</Text>
            {[
              'Acesso discreto sem senhas visíveis',
              'Maior segurança e privacidade',
              'Rápido e fácil de usar',
              'Proteção adicional dos seus dados',
            ].map((item) => (
              <Text key={item} className="text-text-sub text-sm">• {item}</Text>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
