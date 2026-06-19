import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { EmergencyBar } from '../../components/EmergencyBar';
import { QRCodeModal } from '../../components/QRCodeModal';
import { supabase } from '../../lib/supabase';

const menuItems = [
  { id: 'cartilha', icon: '📖', title: 'Cartilha', subtitle: 'Informações sobre violência', href: '/(app)/cartilha' as const },
  { id: 'triagem', icon: '📋', title: 'Triagem', subtitle: 'Identificar tipo de violência', href: '/(app)/triagem' as const },
  { id: 'contato-juridico', icon: '⚖️', title: 'Contato Jurídico', subtitle: 'Assistência legal', href: '/(app)/contato-juridico' as const },
  { id: 'apoio-psicologico', icon: '💜', title: 'Apoio Psicológico', subtitle: 'Suporte emocional', href: '/(app)/apoio-psicologico' as const },
  { id: 'calendario-menstrual', icon: '🩸', title: 'Calendário Menstrual', subtitle: 'Acompanhe seu ciclo', href: '/(app)/calendario-menstrual' as const },
];

export default function Home() {
  const router = useRouter();
  const [qrVisible, setQrVisible] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="flex-grow px-4 py-8 gap-6">
        <TouchableOpacity
          className="self-end"
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          }}
        >
          <Text className="text-text-sub text-sm">Sair</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View className="items-center gap-2">
          <View className="w-16 h-16 rounded-full bg-primary-light items-center justify-center">
            <Text className="text-2xl">🤍</Text>
          </View>
          <Text className="text-3xl font-bold text-text-main">RAM</Text>
          <Text className="text-sm text-text-sub">Rede de Apoio à Mulher</Text>
          <TouchableOpacity
            className="flex-row items-center gap-2 border border-gray-200 rounded-full px-4 py-2 mt-2"
            onPress={() => setQrVisible(true)}
          >
            <Text className="text-sm">▦</Text>
            <Text className="text-sm text-text-main">Compartilhar App</Text>
          </TouchableOpacity>
        </View>

        {/* Grid */}
        <View className="flex-row flex-wrap gap-3">
          {menuItems.map((item, index) => (
            <Animated.View key={item.id} entering={FadeInUp.delay(index * 80).duration(400)} style={{ width: '47%' }}>
              <TouchableOpacity
                className="border border-gray-100 rounded-2xl p-5 gap-3"
                onPress={() => router.push(item.href)}
              >
                <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center">
                  <Text className="text-lg">{item.icon}</Text>
                </View>
                <View className="gap-1">
                  <Text className="font-semibold text-text-main text-sm">{item.title}</Text>
                  <Text className="text-text-sub text-xs">{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <EmergencyBar />

      <QRCodeModal visible={qrVisible} onClose={() => setQrVisible(false)} />
    </SafeAreaView>
  );
}
