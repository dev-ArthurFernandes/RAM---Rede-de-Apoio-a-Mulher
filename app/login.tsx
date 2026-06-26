import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RAMLogo } from '../components/RAMLogo';
import { Input } from '../components/Input';
import { PrimaryButton } from '../components/PrimaryButton';
import { AnimatedTabs } from '../components/AnimatedTabs';
import { QRCodeModal } from '../components/QRCodeModal';
import { supabase } from '../lib/supabase';
import { translateAuthError } from '../lib/auth';

type Tab = 'usuaria' | 'profissional';

export default function Login() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('usuaria');
  const [qrVisible, setQrVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEntrar() {
    if (!email.trim() || !senha) {
      setError('Informe e-mail e senha.');
      return;
    }
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    setLoading(false);
    if (signInError) {
      setError(translateAuthError(signInError.message));
      return;
    }
    router.replace('/(app)/calendario-menstrual');
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 gap-6">
            <RAMLogo size="md" />

            {/* Tab switcher */}
            <AnimatedTabs
              tabs={[
                { key: 'usuaria', icon: '👤', label: 'Acesso Usuária' },
                { key: 'profissional', icon: '🏛', label: 'Acesso Profissional' },
              ]}
              value={tab}
              onChange={setTab}
            />

            {tab === 'usuaria' ? (
              <View className="gap-4">
                <Input
                  label="E-mail"
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <Input label="Senha" placeholder="••••••••" secureTextEntry value={senha} onChangeText={setSenha} />
                {error && <Text className="text-emergency text-sm">{error}</Text>}
                <PrimaryButton label={loading ? 'Entrando...' : 'Entrar'} onPress={handleEntrar} disabled={loading} />
                <TouchableOpacity className="items-center">
                  <Text className="text-text-sub text-sm">Esqueci minha senha</Text>
                </TouchableOpacity>
                <TouchableOpacity className="items-center flex-row justify-center gap-1" onPress={() => router.push('/cadastro')}>
                  <Text className="text-text-sub text-sm">Não tem conta?</Text>
                  <Text className="text-primary text-sm font-medium">Criar conta</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-4">
                <Text className="text-sm font-medium text-text-main">Área de Atuação</Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 border-2 border-primary rounded-xl p-4 items-center gap-2"
                    onPress={() => router.push({ pathname: '/login-profissional', params: { area: 'npj' } })}
                  >
                    <Text className="text-2xl">⚖️</Text>
                    <Text className="text-sm font-medium text-text-main">NPJ/Advocacia</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 border border-gray-200 rounded-xl p-4 items-center gap-2"
                    onPress={() => router.push({ pathname: '/login-profissional', params: { area: 'psicologia' } })}
                  >
                    <Text className="text-2xl">🧠</Text>
                    <Text className="text-sm font-medium text-text-main">Psicologia</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity className="flex-row items-center justify-center gap-2 mt-6" onPress={() => setQrVisible(true)}>
            <Text className="text-sm">▦</Text>
            <Text className="text-text-sub text-sm">Compartilhar QR Code do App</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <QRCodeModal visible={qrVisible} onClose={() => setQrVisible(false)} />
    </SafeAreaView>
  );
}
