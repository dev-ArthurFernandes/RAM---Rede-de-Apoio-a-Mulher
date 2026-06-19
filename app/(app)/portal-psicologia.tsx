import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import {
  FilaPsicologia,
  MensagemChat,
  PrioridadeNivel,
  criarSolicitacaoPsicologia,
  enviarMensagem,
  fetchFilaPsicologia,
  fetchMensagens,
  formatDataHora,
  prioridadeColor,
  prioridadeLabel,
  prioridades,
  tiposViolencia,
} from '../../lib/casos';
import { maskNome } from '../../lib/mask';

export default function PortalPsicologia() {
  const router = useRouter();
  const [fila, setFila] = useState<FilaPsicologia[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revelado, setRevelado] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [mensagensLoading, setMensagensLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoTipo, setNovoTipo] = useState<string | null>(tiposViolencia[0]);
  const [novaPrioridade, setNovaPrioridade] = useState<PrioridadeNivel>('media');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = fila.find((f) => f.id === selectedId) ?? null;

  async function carregar() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFilaPsicologia();
      setFila(data);
      setSelectedId((prev) => prev ?? data[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar fila de espera.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMensagens([]);
      return;
    }
    setMensagensLoading(true);
    fetchMensagens(selectedId)
      .then(setMensagens)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar mensagens.'))
      .finally(() => setMensagensLoading(false));
  }, [selectedId]);

  async function enviar() {
    if (!mensagem.trim() || !selected || !userId) return;
    setEnviando(true);
    try {
      const nova = await enviarMensagem(selected.id, userId, mensagem.trim());
      setMensagens((prev) => [...prev, nova]);
      setMensagem('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar mensagem.');
    } finally {
      setEnviando(false);
    }
  }

  function resetForm() {
    setNovoNome('');
    setNovoTipo(tiposViolencia[0]);
    setNovaPrioridade('media');
    setFormError(null);
  }

  async function handleCriarSolicitacao() {
    if (!novoNome.trim()) {
      setFormError('Informe o nome completo da usuária.');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const nova = await criarSolicitacaoPsicologia({
        nome_completo: novoNome.trim(),
        tipo_violencia: novoTipo,
        prioridade: novaPrioridade,
      });
      setFila((prev) => [nova, ...prev]);
      setSelectedId(nova.id);
      setModalVisible(false);
      resetForm();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erro ao criar solicitação.');
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
            <Text className="font-bold text-text-main">Portal de Psicologia</Text>
            <Text className="text-text-sub text-xs">Rede de Apoio à Mulher - RAM</Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="bg-primary flex-row items-center gap-1 px-3 py-2 rounded-xl"
            onPress={() => setModalVisible(true)}
          >
            <Text className="text-white text-lg font-light">+</Text>
            <Text className="text-white text-sm font-medium">Nova Solicitação</Text>
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
            <Text className="text-blue-600 text-sm font-semibold">💬 Solicitações Automáticas</Text>
            <Text className="text-blue-500 text-xs">As solicitações de apoio psicológico são criadas automaticamente quando usuárias completam a triagem e identificam situações de violência.</Text>
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
            {/* Fila */}
            <View className="w-full md:w-80 bg-white rounded-2xl border border-gray-100 p-3 md:p-4 gap-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm">🕐</Text>
                <View>
                  <Text className="font-semibold text-text-main text-xs">Fila de Espera</Text>
                  <Text className="text-text-sub text-xs">{fila.length} mulheres aguardando</Text>
                </View>
              </View>
              {fila.length === 0 && <Text className="text-text-sub text-xs">Nenhuma solicitação na fila.</Text>}
              {fila.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  className={`rounded-xl p-3 gap-2 border-2 ${selectedId === f.id ? 'border-primary bg-muted' : 'border-transparent bg-gray-50'}`}
                  onPress={() => setSelectedId(f.id)}
                >
                  {f.origem === 'triagem_automatica' && (
                    <View className="bg-primary-light rounded-full px-2 py-0.5 self-start">
                      <Text className="text-primary text-xs">✦ Triagem Automática</Text>
                    </View>
                  )}
                  <View className={`rounded-full px-2 py-0.5 self-start ${prioridadeColor[f.prioridade]}`}>
                    <Text className="text-xs">🕐 {prioridadeLabel[f.prioridade]} Prioridade</Text>
                  </View>
                  <Text className="font-semibold text-text-main text-xs">{revelado ? f.nome_completo : maskNome(f.nome_completo)} 👁</Text>
                  <Text className="text-text-sub text-xs">🕐 Solicitação: {formatDataHora(f.created_at)}</Text>
                  <Text className="text-text-sub text-xs">Tipo: {f.tipo_violencia ?? '—'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chat */}
            <View className="w-full md:flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {selected ? (
                <>
                  <View className="p-4 border-b border-gray-100">
                    <Text className="font-bold text-text-main text-sm">Chat de Acolhimento</Text>
                    <Text className="text-text-sub text-xs">
                      Atendimento para {revelado ? selected.nome_completo : maskNome(selected.nome_completo)}
                    </Text>
                  </View>

                  {/* Info do caso */}
                  <View className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <View className="flex-row gap-4">
                      <View className="flex-1">
                        <Text className="text-text-sub text-xs">Nome:</Text>
                        <Text className="font-medium text-text-main text-sm">
                          {revelado ? selected.nome_completo : maskNome(selected.nome_completo)} 👁
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-text-sub text-xs">Data da Solicitação:</Text>
                        <Text className="text-text-main text-sm">{formatDataHora(selected.created_at)}</Text>
                      </View>
                    </View>
                    <View className="flex-row gap-4 mt-2">
                      <View className="flex-1">
                        <Text className="text-text-sub text-xs">Tipo de Violência:</Text>
                        <Text className="text-text-main text-sm">{selected.tipo_violencia ?? '—'}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-text-sub text-xs">Prioridade:</Text>
                        <View className={`rounded-full px-2 py-0.5 self-start mt-1 ${prioridadeColor[selected.prioridade]}`}>
                          <Text className="text-xs">{prioridadeLabel[selected.prioridade]} Prioridade</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Messages */}
                  <ScrollView className="flex-1 px-4 py-3 min-h-32">
                    {mensagensLoading ? (
                      <View className="flex-1 items-center justify-center py-8">
                        <ActivityIndicator color="#7C3AED" />
                      </View>
                    ) : mensagens.length === 0 ? (
                      <View className="flex-1 items-center justify-center py-8 gap-2">
                        <Text className="text-4xl text-gray-300">💬</Text>
                        <Text className="text-text-sub text-sm">Inicie o acolhimento enviando uma mensagem</Text>
                        <Text className="text-text-sub text-xs">Lembre-se: este é um espaço seguro e confidencial</Text>
                      </View>
                    ) : (
                      <View className="gap-2">
                        {mensagens.map((m) => (
                          <View
                            key={m.id}
                            className={`rounded-2xl px-3 py-2 max-w-xs ${
                              m.autor_tipo === 'profissional'
                                ? 'bg-primary rounded-br-sm self-end'
                                : 'bg-gray-100 rounded-bl-sm self-start'
                            }`}
                          >
                            <Text className={m.autor_tipo === 'profissional' ? 'text-white text-sm' : 'text-text-main text-sm'}>
                              {m.conteudo}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </ScrollView>

                  {/* Input */}
                  <View className="flex-row items-center gap-2 px-4 py-3 border-t border-gray-100">
                    <TextInput
                      className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 text-sm text-text-main"
                      placeholder="Digite sua mensagem de acolhimento..."
                      placeholderTextColor="#9CA3AF"
                      value={mensagem}
                      onChangeText={setMensagem}
                      onSubmitEditing={enviar}
                      editable={!enviando}
                    />
                    <TouchableOpacity
                      className={`w-10 h-10 rounded-full items-center justify-center ${mensagem.trim() && !enviando ? 'bg-primary' : 'bg-gray-100'}`}
                      onPress={enviar}
                      disabled={!mensagem.trim() || enviando}
                    >
                      <Text className={mensagem.trim() && !enviando ? 'text-white' : 'text-gray-400'}>➤</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View className="flex-1 items-center justify-center py-16 gap-2">
                  <Text className="text-4xl text-gray-300">💬</Text>
                  <Text className="text-text-sub text-sm">Nenhuma solicitação na fila</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal nova solicitação */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <View className="bg-white rounded-3xl p-6 w-full gap-4">
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-lg font-bold text-text-main">Nova Solicitação</Text>
                <Text className="text-text-sub text-sm">Adicione uma usuária à fila de acolhimento</Text>
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
                  value={novoNome}
                  onChangeText={setNovoNome}
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-text-main mb-1">Tipo de Violência</Text>
                <View className="flex-row flex-wrap gap-2">
                  {tiposViolencia.map((t) => (
                    <TouchableOpacity
                      key={t}
                      className={`px-3 py-1.5 rounded-full ${novoTipo === t ? 'bg-primary' : 'bg-gray-100'}`}
                      onPress={() => setNovoTipo(t)}
                    >
                      <Text className={`text-sm ${novoTipo === t ? 'text-white' : 'text-text-main'}`}>{t}</Text>
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
                      className={`px-3 py-1.5 rounded-full ${novaPrioridade === p ? 'bg-primary' : 'bg-gray-100'}`}
                      onPress={() => setNovaPrioridade(p)}
                    >
                      <Text className={`text-sm ${novaPrioridade === p ? 'text-white' : 'text-text-main'}`}>{prioridadeLabel[p]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                onPress={handleCriarSolicitacao}
                disabled={saving}
              >
                <Text className="text-white text-sm font-medium">{saving ? 'Criando...' : 'Criar Solicitação'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
