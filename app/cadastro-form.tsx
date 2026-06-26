import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { RAMLogo } from '../components/RAMLogo';
import { Input } from '../components/Input';
import { PrimaryButton } from '../components/PrimaryButton';
import { supabase } from '../lib/supabase';
import { routeForTipo, UserTipo } from '../lib/auth';

type Perfil = 'advogado' | 'estudante-direito' | 'estudante-psicologia' | 'usuaria';

const perfilLabel: Record<Perfil, string> = {
  advogado: 'Advogado(a)',
  'estudante-direito': 'Estudante de Direito',
  'estudante-psicologia': 'Estudante de Psicologia',
  usuaria: 'Usuária Geral',
};

const perfilTipo: Record<Perfil, UserTipo> = {
  advogado: 'advogado',
  'estudante-direito': 'estudante_direito',
  'estudante-psicologia': 'estudante_psicologia',
  usuaria: 'usuaria',
};

export default function CadastroForm() {
  const router = useRouter();
  const { perfil = 'usuaria' } = useLocalSearchParams<{ perfil: Perfil }>();

  const isAdvogado = perfil === 'advogado';
  const isEstudante = perfil === 'estudante-direito' || perfil === 'estudante-psicologia';

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [oabNumero, setOabNumero] = useState('');
  const [oabUf, setOabUf] = useState('');
  const [instituicao, setInstituicao] = useState('');
  const [semestre, setSemestre] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleCriarConta() {
    if (!nome.trim() || !email.trim()) {
      setError('Preencha nome e e-mail.');
      return;
    }
    if (isAdvogado && (!oabNumero.trim() || !oabUf.trim())) {
      setError('Informe o número e a UF da OAB.');
      return;
    }
    if (isEstudante && !instituicao.trim()) {
      setError('Informe a instituição de ensino.');
      return;
    }
    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    setError(null);
    setLoading(true);

    const tipo = perfilTipo[perfil as Perfil];
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        emailRedirectTo: Linking.createURL('login'),
        data: {
          tipo,
          nome: nome.trim(),
          telefone: telefone.trim() || null,
          oab_numero: isAdvogado ? oabNumero.trim() : null,
          oab_uf: isAdvogado ? oabUf.trim().toUpperCase() : null,
          instituicao: isEstudante ? instituicao.trim() : null,
          semestre: isEstudante ? semestre.trim() || null : null,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.replace(routeForTipo(tipo));
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-8">
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 gap-4 items-center">
            <RAMLogo size="md" />
            <Text className="text-2xl font-bold text-text-main text-center">Conta criada!</Text>
            <Text className="text-text-sub text-sm text-center">
              Enviamos um e-mail de confirmação para {email.trim()}. Confirme seu e-mail e faça login para continuar.
            </Text>
            <PrimaryButton label="Ir para Login" onPress={() => router.replace('/login')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-8" keyboardShouldPersistTaps="handled">
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 gap-5">
            <RAMLogo size="sm" />
            <View className="items-center gap-1">
              <Text className="text-2xl font-bold text-text-main">Criar Conta</Text>
              <Text className="text-text-sub text-sm">Perfil: {perfilLabel[perfil as Perfil] ?? 'Usuária Geral'}</Text>
            </View>

            <TouchableOpacity
              className="flex-row items-center gap-1"
              onPress={() => router.back()}
            >
              <Text className="text-text-sub text-sm">←</Text>
              <Text className="text-text-sub text-sm">Voltar</Text>
            </TouchableOpacity>

            <Input label="Nome completo" required placeholder="Seu nome completo" value={nome} onChangeText={setNome} />
            <Input
              label="E-mail"
              required
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Input label="Telefone" placeholder="(11) 99999-9999" keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} />

            {isAdvogado && (
              <>
                <View className="bg-blue-50 rounded-xl p-3 gap-1">
                  <Text className="text-blue-700 text-sm font-semibold">⚖️  Campo obrigatório:</Text>
                  <Text className="text-blue-600 text-sm">O número de OAB é necessário para cadastro de advogados.</Text>
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Input label="Número OAB" required placeholder="123456" value={oabNumero} onChangeText={setOabNumero} />
                  </View>
                  <View className="w-24">
                    <Input label="UF" required placeholder="SP" value={oabUf} onChangeText={setOabUf} autoCapitalize="characters" maxLength={2} />
                  </View>
                </View>
              </>
            )}

            {isEstudante && (
              <>
                <Input label="Instituição de Ensino" required placeholder="Nome da faculdade/universidade" value={instituicao} onChangeText={setInstituicao} />
                <Input label="Semestre atual" placeholder="Ex: 5º semestre" value={semestre} onChangeText={setSemestre} />
              </>
            )}

            <Input label="Senha" required placeholder="Mínimo 6 caracteres" secureTextEntry value={senha} onChangeText={setSenha} />
            <Input label="Confirmar senha" required placeholder="Repita a senha" secureTextEntry value={confirmarSenha} onChangeText={setConfirmarSenha} />

            {error && <Text className="text-emergency text-sm">{error}</Text>}

            <PrimaryButton label={loading ? 'Criando conta...' : 'Criar Conta'} onPress={handleCriarConta} disabled={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
