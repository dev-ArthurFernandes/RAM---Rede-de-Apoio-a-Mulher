import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RAMLogo } from '../components/RAMLogo';
import { Input } from '../components/Input';
import { PrimaryButton } from '../components/PrimaryButton';
import { AnimatedTabs } from '../components/AnimatedTabs';
import { QRCodeModal } from '../components/QRCodeModal';
import { supabase } from '../lib/supabase';
import { getProfile, translateAuthError } from '../lib/auth';

export default function LoginProfissional() {
  const router = useRouter();
  const { area } = useLocalSearchParams<{ area: 'npj' | 'psicologia' }>();
  const [selectedArea, setSelectedArea] = useState<'npj' | 'psicologia'>(area ?? 'npj');
  const [qrVisible, setQrVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [oabNumero, setOabNumero] = useState('');
  const [oabUf, setOabUf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNpj = selectedArea === 'npj';

  async function handleEntrar() {
    if (!email.trim() || !senha) {
      setError('Informe e-mail e senha.');
      return;
    }

    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (signInError || !data.session) {
      setLoading(false);
      setError(signInError ? translateAuthError(signInError.message) : 'E-mail ou senha incorretos.');
      return;
    }

    const profile = await getProfile(data.session.user.id);

    const tipoAutorizado = isNpj
      ? profile?.tipo === 'advogado' || profile?.tipo === 'estudante_direito'
      : profile?.tipo === 'estudante_psicologia';

    // Só valida OAB se o cadastro tiver um número registrado; quem não tem (ex: estudantes) passa direto.
    const temOabCadastrada = !!profile?.oab_numero?.trim();

    const oabValida =
      !isNpj ||
      !temOabCadastrada ||
      (profile?.oab_numero?.trim() === oabNumero.trim() &&
        profile?.oab_uf?.trim().toUpperCase() === oabUf.trim().toUpperCase());

    if (!tipoAutorizado || !oabValida) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(
        !tipoAutorizado
          ? 'Esta conta não tem acesso a este portal.'
          : 'Número de OAB ou UF não correspondem ao cadastro.'
      );
      return;
    }

    setLoading(false);
    router.replace(isNpj ? '/(app)/portal-npj' : '/(app)/portal-psicologia');
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-8" keyboardShouldPersistTaps="handled">
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 gap-6">
            <RAMLogo size="md" />

            {/* Tab switcher */}
            <AnimatedTabs
              tabs={[
                { key: 'usuaria', icon: '👤', label: 'Acesso Usuária' },
                { key: 'profissional', icon: '🏛', label: 'Acesso Profissional' },
              ]}
              value="profissional"
              onChange={(key) => {
                if (key === 'usuaria') router.replace('/login');
              }}
            />

            {/* Area selector */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-text-main">Área de Atuação</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className={`flex-1 border-2 rounded-xl p-4 items-center gap-2 ${isNpj ? 'border-primary' : 'border-gray-200'}`}
                  onPress={() => setSelectedArea('npj')}
                >
                  <Text className="text-2xl">⚖️</Text>
                  <Text className="text-sm font-medium text-text-main">NPJ/Advocacia</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 border-2 rounded-xl p-4 items-center gap-2 ${!isNpj ? 'border-primary' : 'border-gray-200'}`}
                  onPress={() => setSelectedArea('psicologia')}
                >
                  <Text className="text-2xl">🧠</Text>
                  <Text className="text-sm font-medium text-text-main">Psicologia</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Input
              label="E-mail Institucional"
              placeholder="profissional@instituicao.edu.br"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Input label="Senha" placeholder="••••••••" secureTextEntry value={senha} onChangeText={setSenha} />

            {isNpj && (
              <View className="bg-blue-50 rounded-xl p-3 gap-1">
                <Text className="text-blue-700 text-sm font-semibold">⚖️  Acesso ao Portal NPJ:</Text>
                <Text className="text-blue-600 text-sm">
                  Advogados devem informar o número e a UF da OAB. Estudantes de direito podem acessar sem preencher esses campos.
                </Text>
              </View>
            )}

            {isNpj && (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input label="Número OAB (advogados)" placeholder="123456" value={oabNumero} onChangeText={setOabNumero} />
                </View>
                <View className="w-24">
                  <Input label="UF" placeholder="SP" value={oabUf} onChangeText={setOabUf} autoCapitalize="characters" maxLength={2} />
                </View>
              </View>
            )}

            {error && <Text className="text-emergency text-sm">{error}</Text>}

            <PrimaryButton
              label={loading ? 'Entrando...' : isNpj ? 'Acessar Painel NPJ' : 'Acessar Painel de Psicologia'}
              onPress={handleEntrar}
              disabled={loading}
            />

            <Text className="text-center text-text-sub text-xs">
              {isNpj
                ? 'Acesso exclusivo para advogados e estudantes de direito parceiros com OAB ativa'
                : 'Acesso restrito a profissionais e estudantes de psicologia parceiros'}
            </Text>
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
