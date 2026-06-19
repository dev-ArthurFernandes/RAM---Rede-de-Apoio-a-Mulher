import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import {
  CasoNpj,
  CasoStatus,
  PerfilResumo,
  PrioridadeNivel,
  atribuirAlunoCaso,
  atualizarStatusCaso,
  criarCasoNpj,
  fetchCasosNpj,
  fetchEstudantes,
  formatDataBR,
  formatDataHora,
  parseDataBR,
  prioridadeColor,
  prioridadeLabel,
  prioridades,
  statusColor,
  statusLabel,
  tipoColor,
  tiposViolencia,
} from '../../lib/casos';
import { maskCPF, maskEmail, maskNome, maskTelefone } from '../../lib/mask';

export default function PortalNPJ() {
  const router = useRouter();
  const [casos, setCasos] = useState<CasoNpj[]>([]);
  const [estudantes, setEstudantes] = useState<PerfilResumo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revelado, setRevelado] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);

  // Estado do formulário "Nova Ficha"
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [dataIncidente, setDataIncidente] = useState('');
  const [relato, setRelato] = useState('');
  const [novaFichaTypes, setNovaFichaTypes] = useState<string[]>(['Física']);
  const [novaFichaPrioridade, setNovaFichaPrioridade] = useState<PrioridadeNivel>('media');
  const [formError, setFormError] = useState<string | null>(null);

  const selectedCaso = casos.find((c) => c.id === selectedId) ?? null;
  const atendimentoIniciado = selectedCaso?.status === 'em_atendimento';

  async function carregar() {
    setLoading(true);
    setError(null);
    try {
      const [casosData, estudantesData] = await Promise.all([fetchCasosNpj(), fetchEstudantes('estudante_direito')]);
      setCasos(casosData);
      setEstudantes(estudantesData);
      setSelectedId((prev) => prev ?? casosData[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar casos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleAtribuirAluno(alunoId: string) {
    if (!selectedCaso) return;
    setSaving(true);
    try {
      await atribuirAlunoCaso(selectedCaso.id, alunoId);
      setCasos((prev) => prev.map((c) => (c.id === selectedCaso.id ? { ...c, aluno_responsavel_id: alunoId } : c)));
      setAssignModalVisible(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atribuir aluno.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtendimento() {
    if (!selectedCaso) return;
    const novoStatus: CasoStatus = atendimentoIniciado ? 'pendente' : 'em_atendimento';
    setSaving(true);
    try {
      await atualizarStatusCaso(selectedCaso.id, novoStatus);
      setCasos((prev) => prev.map((c) => (c.id === selectedCaso.id ? { ...c, status: novoStatus } : c)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar status do atendimento.');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setNome('');
    setCpf('');
    setTelefone('');
    setEmail('');
    setDataIncidente('');
    setRelato('');
    setNovaFichaTypes(['Física']);
    setNovaFichaPrioridade('media');
    setFormError(null);
  }

  async function handleCriarFicha() {
    if (!nome.trim()) {
      setFormError('Informe o nome completo da usuária.');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const novoCaso = await criarCasoNpj({
        nome_completo: nome.trim(),
        cpf: cpf.trim() || null,
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        data_incidente: parseDataBR(dataIncidente),
        tipos_violencia: novaFichaTypes,
        relato: relato.trim() || null,
        prioridade: novaFichaPrioridade,
      });
      setCasos((prev) => [novoCaso, ...prev]);
      setSelectedId(novoCaso.id);
      setModalVisible(false);
      resetForm();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erro ao criar ficha.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 md:px-8 py-3 md:py-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center">
            <Text>🤍</Text>
          </View>
          <View>
            <Text className="font-bold text-text-main">Portal NPJ</Text>
            <Text className="text-text-sub text-xs">Núcleo de Prática Jurídica - RAM</Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="bg-primary flex-row items-center gap-1 px-3 py-2 rounded-xl"
            onPress={() => setModalVisible(true)}
          >
            <Text className="text-white text-lg font-light">+</Text>
            <Text className="text-white text-sm font-medium">Nova Ficha</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="border border-gray-200 flex-row items-center gap-1 px-3 py-2 rounded-xl"
            onPress={async () => {
              await supabase.auth.signOut();
              router.replace('/login');
            }}
          >
            <Text className="text-text-main text-sm">Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4 md:p-8" contentContainerClassName="gap-3 md:gap-4">
        {/* Banners */}
        <View className="flex-col md:flex-row gap-3 md:gap-4">
          <View className="w-full md:flex-1 bg-orange-50 border border-orange-200 rounded-2xl p-3 md:p-4 gap-2">
            <Text className="text-orange-600 text-sm font-semibold">🔒 Modo de Privacidade {revelado ? 'Desativado' : 'Ativo'}</Text>
            <Text className="text-orange-500 text-xs">Dados sensíveis estão protegidos com máscaras de segurança. Toque no botão abaixo para revelar informações completas quando necessário.</Text>
            <TouchableOpacity
              className="self-start flex-row items-center gap-1 bg-white border border-orange-200 px-3 py-1.5 rounded-full"
              onPress={() => setRevelado((r) => !r)}
            >
              <Text className="text-xs">{revelado ? '🙈' : '👁'}</Text>
              <Text className="text-orange-700 text-xs font-medium">{revelado ? 'Ocultar dados' : 'Revelar dados'}</Text>
            </TouchableOpacity>
          </View>
          <View className="w-full md:flex-1 bg-blue-50 border border-blue-200 rounded-2xl p-3 md:p-4 gap-1">
            <Text className="text-blue-600 text-sm font-semibold">📄 Fichas Automáticas</Text>
            <Text className="text-blue-500 text-xs">As fichas de atendimento são geradas automaticamente quando usuárias completam a triagem no aplicativo e são atribuídas a alunos especializados.</Text>
          </View>
        </View>

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-3 md:p-4 flex-row items-center justify-between gap-3">
            <Text className="text-emergency text-sm flex-1">{error}</Text>
            <TouchableOpacity className="border border-emergency px-3 py-1.5 rounded-xl" onPress={carregar}>
              <Text className="text-emergency text-sm font-medium">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator color="#7C3AED" />
          </View>
        ) : (
          <View className="flex-col md:flex-row gap-3 md:gap-4">
            {/* Lista */}
            <View className="w-full md:w-80 bg-white rounded-2xl border border-gray-100 p-3 md:p-4 gap-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm">📄</Text>
                <View>
                  <Text className="font-semibold text-text-main text-xs">Casos Ativos</Text>
                  <Text className="text-text-sub text-xs">{casos.length} casos em atendimento</Text>
                </View>
              </View>
              {casos.length === 0 && <Text className="text-text-sub text-xs">Nenhum caso cadastrado ainda.</Text>}
              {casos.map((caso) => {
                const aluno = estudantes.find((e) => e.id === caso.aluno_responsavel_id);
                return (
                  <TouchableOpacity
                    key={caso.id}
                    className={`rounded-xl p-3 gap-2 border-2 ${selectedId === caso.id ? 'border-primary bg-muted' : 'border-transparent bg-gray-50'}`}
                    onPress={() => setSelectedId(caso.id)}
                  >
                    <Text className="text-text-sub text-xs">{caso.codigo}</Text>
                    <Text className="font-semibold text-text-main text-xs">
                      {revelado ? caso.nome_completo : maskNome(caso.nome_completo)} 👁
                    </Text>
                    <View className="flex-row flex-wrap gap-1">
                      <View className={`px-2 py-0.5 rounded-full ${statusColor[caso.status]}`}>
                        <Text className="text-xs">{statusLabel[caso.status]}</Text>
                      </View>
                      <View className={`px-2 py-0.5 rounded-full flex-row items-center gap-1 ${prioridadeColor[caso.prioridade]}`}>
                        <Text className="text-xs">⚠</Text>
                        <Text className="text-xs">{prioridadeLabel[caso.prioridade]}</Text>
                      </View>
                    </View>
                    <View className="flex-row flex-wrap gap-1">
                      {caso.tipos_violencia.map((t) => (
                        <View key={t} className={`px-2 py-0.5 rounded-full ${tipoColor[t] ?? 'bg-gray-100 text-gray-700'}`}>
                          <Text className="text-xs">{t}</Text>
                        </View>
                      ))}
                    </View>
                    {aluno && <Text className="text-text-sub text-xs">👤 {aluno.nome}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Detalhes */}
            <View className="w-full md:flex-1 bg-white rounded-2xl border border-gray-100 p-4 md:p-6 gap-4">
              {selectedCaso ? (
                <>
                  <Text className="font-bold text-text-main text-sm">Detalhes do Caso {selectedCaso.codigo}</Text>

                  <View className="flex-col sm:flex-row gap-3">
                    <TouchableOpacity
                      className="w-full sm:flex-1 flex-row items-center justify-center gap-2 bg-primary px-4 py-3 rounded-xl"
                      onPress={() => setAssignModalVisible(true)}
                    >
                      <Text className="text-white text-base">👤➕</Text>
                      <Text className="text-white text-sm font-medium">Atribuir a Aluno</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`w-full sm:flex-1 flex-row items-center justify-center gap-2 border px-4 py-3 rounded-xl ${atendimentoIniciado ? 'border-emergency' : 'border-gray-200'} ${saving ? 'opacity-50' : ''}`}
                      onPress={handleToggleAtendimento}
                      disabled={saving}
                    >
                      <Text className={`text-base ${atendimentoIniciado ? 'text-emergency' : 'text-text-main'}`}>
                        {atendimentoIniciado ? '⏹' : '✓'}
                      </Text>
                      <Text className={`text-sm font-medium ${atendimentoIniciado ? 'text-emergency' : 'text-text-main'}`}>
                        {atendimentoIniciado ? 'Parar Atendimento' : 'Iniciar Atendimento'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="gap-2">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm">🔒</Text>
                      <Text className="font-semibold text-text-main text-sm">Dados da Usuária</Text>
                    </View>
                    <View className="bg-gray-50 rounded-xl p-3 gap-3">
                      <View className="flex-row gap-4">
                        <View className="flex-1">
                          <Text className="text-text-sub text-xs">Nome Completo</Text>
                          <Text className="text-text-main text-sm font-medium">
                            {revelado ? selectedCaso.nome_completo : maskNome(selectedCaso.nome_completo)} 👁
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-text-sub text-xs">CPF</Text>
                          <Text className="text-text-main text-sm font-medium">
                            {revelado ? selectedCaso.cpf || '—' : maskCPF(selectedCaso.cpf)} 👁
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row gap-4">
                        <View className="flex-1">
                          <Text className="text-text-sub text-xs">Telefone</Text>
                          <Text className="text-text-main text-sm font-medium">
                            {revelado ? selectedCaso.telefone || '—' : maskTelefone(selectedCaso.telefone)} 👁
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-text-sub text-xs">E-mail</Text>
                          <Text className="text-text-main text-sm font-medium">
                            {revelado ? selectedCaso.email || '—' : maskEmail(selectedCaso.email)} 👁
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="gap-2">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm">⚠</Text>
                      <Text className="font-semibold text-text-main text-sm">Informações do Caso</Text>
                    </View>
                    <View className="bg-gray-50 rounded-xl p-3 gap-3">
                      <View className="flex-row gap-4">
                        <View className="flex-1">
                          <Text className="text-text-sub text-xs">Data do Incidente</Text>
                          <Text className="text-text-main text-sm font-medium">{formatDataBR(selectedCaso.data_incidente)}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-text-sub text-xs">Status</Text>
                          <View className={`self-start px-2 py-0.5 rounded-full ${statusColor[selectedCaso.status]}`}>
                            <Text className="text-xs">{statusLabel[selectedCaso.status]}</Text>
                          </View>
                        </View>
                      </View>
                      <View className="flex-row gap-4">
                        <View className="flex-1">
                          <Text className="text-text-sub text-xs">Prioridade</Text>
                          <View className={`self-start px-2 py-0.5 rounded-full ${prioridadeColor[selectedCaso.prioridade]}`}>
                            <Text className="text-xs">{prioridadeLabel[selectedCaso.prioridade]} Prioridade</Text>
                          </View>
                        </View>
                        <View className="flex-1">
                          <Text className="text-text-sub text-xs">Cadastrado em</Text>
                          <Text className="text-text-main text-sm">{formatDataHora(selectedCaso.created_at)}</Text>
                        </View>
                      </View>
                      <View>
                        <Text className="text-text-sub text-xs">Tipo(s) de Violência</Text>
                        <View className="flex-row flex-wrap gap-1 mt-1">
                          {selectedCaso.tipos_violencia.map((t) => (
                            <View key={t} className={`px-2 py-0.5 rounded-full ${tipoColor[t] ?? 'bg-gray-100 text-gray-700'}`}>
                              <Text className="text-xs">{t}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="gap-2">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm">📄</Text>
                      <Text className="font-semibold text-text-main text-sm">Relato da Situação</Text>
                    </View>
                    <View className="bg-gray-50 rounded-xl p-3">
                      <Text className="text-text-main text-sm">{selectedCaso.relato || 'Nenhum relato registrado.'}</Text>
                    </View>
                  </View>

                  <View className="h-1 bg-primary rounded-full w-16" />
                </>
              ) : (
                <View className="flex-1 items-center justify-center py-16 gap-2">
                  <Text className="text-4xl text-gray-300">📄</Text>
                  <Text className="text-text-sub text-sm">Nenhum caso cadastrado ainda</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal nova ficha */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <ScrollView className="w-full" contentContainerClassName="items-center" keyboardShouldPersistTaps="handled">
            <View className="bg-white rounded-3xl p-6 w-full gap-4">
              <View className="flex-row items-start justify-between">
                <View>
                  <Text className="text-lg font-bold text-text-main">Nova Ficha de Atendimento</Text>
                  <Text className="text-text-sub text-sm">Preencha os dados da usuária e informações do caso</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text className="text-text-sub text-xl">✕</Text>
                </TouchableOpacity>
              </View>

              <View className="gap-3">
                <View>
                  <Text className="text-sm font-medium text-text-main mb-1">Nome Completo</Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-text-main"
                    placeholder="Nome completo da usuária"
                    placeholderTextColor="#9CA3AF"
                    value={nome}
                    onChangeText={setNome}
                  />
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-text-main mb-1">CPF</Text>
                    <TextInput
                      className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-text-main"
                      placeholder="000.000.000-00"
                      placeholderTextColor="#9CA3AF"
                      value={cpf}
                      onChangeText={setCpf}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-text-main mb-1">Telefone</Text>
                    <TextInput
                      className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-text-main"
                      placeholder="(00) 00000-0000"
                      placeholderTextColor="#9CA3AF"
                      value={telefone}
                      onChangeText={setTelefone}
                    />
                  </View>
                </View>
                <View>
                  <Text className="text-sm font-medium text-text-main mb-1">E-mail</Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-text-main"
                    placeholder="email@exemplo.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
                <View>
                  <Text className="text-sm font-medium text-text-main mb-1">Data do Incidente</Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-text-main"
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#9CA3AF"
                    value={dataIncidente}
                    onChangeText={setDataIncidente}
                  />
                </View>
                <View>
                  <Text className="text-sm font-medium text-text-main mb-1">Tipo(s) de Violência</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {tiposViolencia.map((t) => (
                      <TouchableOpacity
                        key={t}
                        className={`px-3 py-1.5 rounded-full ${novaFichaTypes.includes(t) ? 'bg-primary' : 'bg-gray-100'}`}
                        onPress={() =>
                          setNovaFichaTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
                        }
                      >
                        <Text className={`text-sm ${novaFichaTypes.includes(t) ? 'text-white' : 'text-text-main'}`}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View>
                  <Text className="text-sm font-medium text-text-main mb-1">Prioridade</Text>
                  <View className="flex-row gap-2">
                    {prioridades.map((p) => (
                      <TouchableOpacity
                        key={p}
                        className={`px-3 py-1.5 rounded-full ${novaFichaPrioridade === p ? 'bg-primary' : 'bg-gray-100'}`}
                        onPress={() => setNovaFichaPrioridade(p)}
                      >
                        <Text className={`text-sm ${novaFichaPrioridade === p ? 'text-white' : 'text-text-main'}`}>{prioridadeLabel[p]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View>
                  <Text className="text-sm font-medium text-text-main mb-1">Relato da Situação</Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-text-main"
                    placeholder="Descreva os detalhes do caso..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    value={relato}
                    onChangeText={setRelato}
                  />
                </View>
              </View>

              {formError && <Text className="text-emergency text-sm">{formError}</Text>}

              <View className="flex-row gap-3 justify-end">
                <TouchableOpacity
                  className="border border-gray-200 px-5 py-3 rounded-xl"
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text className="text-text-main text-sm">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`bg-primary px-5 py-3 rounded-xl ${saving ? 'opacity-50' : ''}`}
                  onPress={handleCriarFicha}
                  disabled={saving}
                >
                  <Text className="text-white text-sm font-medium">{saving ? 'Criando...' : 'Criar Ficha'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal atribuir aluno */}
      <Modal visible={assignModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <View className="bg-white rounded-3xl p-6 w-full gap-4">
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-lg font-bold text-text-main">Atribuir a Aluno</Text>
                <Text className="text-text-sub text-sm">
                  Selecione o aluno responsável pelo caso {selectedCaso?.codigo}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <Text className="text-text-sub text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            <View className="gap-2">
              {estudantes.length === 0 && (
                <Text className="text-text-sub text-sm">Nenhum estudante de direito cadastrado ainda.</Text>
              )}
              {estudantes.map((aluno) => (
                <TouchableOpacity
                  key={aluno.id}
                  className={`flex-row items-center gap-3 rounded-xl p-3 ${selectedCaso?.aluno_responsavel_id === aluno.id ? 'bg-muted border-2 border-primary' : 'bg-gray-50'} ${saving ? 'opacity-50' : ''}`}
                  onPress={() => handleAtribuirAluno(aluno.id)}
                  disabled={saving}
                >
                  <Text className="text-lg">👤</Text>
                  <Text className="text-text-main text-sm font-medium">{aluno.nome}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              className="border border-gray-200 px-5 py-3 rounded-xl items-center"
              onPress={() => setAssignModalVisible(false)}
            >
              <Text className="text-text-main text-sm">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
