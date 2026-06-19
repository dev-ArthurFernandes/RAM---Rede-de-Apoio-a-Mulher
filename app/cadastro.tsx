import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RAMLogo } from '../components/RAMLogo';
import { PrimaryButton } from '../components/PrimaryButton';

type Perfil = 'advogado' | 'estudante-direito' | 'estudante-psicologia' | 'usuaria';

const perfis: { id: Perfil; icon: string; title: string; subtitle: string }[] = [
  { id: 'advogado', icon: '⚖️', title: 'Advogado(a)', subtitle: 'Profissional com OAB ativa' },
  { id: 'estudante-direito', icon: '📖', title: 'Estudante de Direito', subtitle: 'Cursando graduação em Direito' },
  { id: 'estudante-psicologia', icon: '🧠', title: 'Estudante de Psicologia', subtitle: 'Cursando graduação em Psicologia' },
  { id: 'usuaria', icon: '👤', title: 'Usuária Geral', subtitle: 'Cadastro padrão para usuárias' },
];

export default function Cadastro() {
  const router = useRouter();
  const [selected, setSelected] = useState<Perfil>('usuaria');

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-8">
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 gap-6">
          <RAMLogo size="md" />
          <View className="items-center gap-1">
            <Text className="text-2xl font-bold text-text-main">Criar Conta</Text>
            <Text className="text-text-sub text-sm">Selecione seu perfil de acesso</Text>
          </View>

          <View className="gap-3">
            {perfis.map((p) => (
              <TouchableOpacity
                key={p.id}
                className={`flex-row items-center gap-4 p-4 rounded-2xl border-2 ${
                  selected === p.id ? 'border-primary bg-muted' : 'border-gray-100'
                }`}
                onPress={() => setSelected(p.id)}
              >
                <View className="w-10 h-10 rounded-xl bg-primary-light items-center justify-center">
                  <Text className="text-lg">{p.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-text-main text-sm">{p.title}</Text>
                  <Text className="text-text-sub text-xs">{p.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <PrimaryButton
            label="Continuar"
            onPress={() => router.push({ pathname: '/cadastro-form', params: { perfil: selected } })}
          />

          <TouchableOpacity
            className="items-center flex-row justify-center gap-1"
            onPress={() => router.replace('/login')}
          >
            <Text className="text-text-sub text-sm">Já tem conta?</Text>
            <Text className="text-primary text-sm font-medium">Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
