import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmergencyBar } from '../../components/EmergencyBar';
import { GradientBackground } from '../../components/GradientBackground';
import { supabase } from '../../lib/supabase';
import {
  CICLO_MAX,
  CICLO_MIN,
  HUMORES,
  MENSTRUACAO_MAX,
  MENSTRUACAO_MIN,
  SINTOMAS,
  CicloConfig,
  RegistroDia,
  carregarCicloConfig,
  carregarRegistroDia,
  criarConfigPadrao,
  cycleDayDentroDaMenstruacao,
  faseCalendarioCor,
  faseCalendarioTexto,
  formatDataBR,
  getDiasDoMes,
  getDiasParaProximaMenstruacao,
  getFaseAtual,
  getPrevisoesCiclos,
  getPrimeiroDiaSemana,
  parseDataBR,
  salvarCicloConfig,
  salvarRegistroDia,
  toISODate,
} from '../../lib/ciclo';

const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const nomesMeses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatarDiasRestantes(dias: number): string {
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'em 1 dia';
  return `em ${dias} dias`;
}

function LegendaItem({ cor, label }: { cor: string; label: string }) {
  return (
    <View className="flex-row items-center gap-2" style={{ width: '47%' }}>
      <View className={`w-3 h-3 rounded-full ${cor || 'border border-gray-300'}`} />
      <Text className="text-text-sub text-xs">{label}</Text>
    </View>
  );
}

export default function CalendarioMenstrual() {
  const router = useRouter();
  const hoje = useMemo(() => new Date(), []);
  const hojeISO = useMemo(() => toISODate(hoje), [hoje]);

  const [userId, setUserId] = useState<string | null>(null);
  const [config, setConfig] = useState<CicloConfig>(criarConfigPadrao);
  const [dataInput, setDataInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [infoVisible, setInfoVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [registro, setRegistro] = useState<RegistroDia>({ menstruada: false, humor: null, sintomas: [] });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id ?? null;
      setUserId(uid);

      const cfg = uid ? await carregarCicloConfig(uid) : criarConfigPadrao();
      setConfig(cfg);
      setDataInput(formatDataBR(cfg.ultimaMenstruacao));

      if (uid) setRegistro(await carregarRegistroDia(uid, hojeISO));
      setLoading(false);
    })();
  }, [hojeISO]);

  function atualizarConfig(alteracoes: Partial<CicloConfig>) {
    const novaConfig = { ...config, ...alteracoes };
    setConfig(novaConfig);
    if (userId) salvarCicloConfig(userId, novaConfig);
  }

  function atualizarRegistro(alteracoes: Partial<RegistroDia>) {
    const novoRegistro = { ...registro, ...alteracoes };
    setRegistro(novoRegistro);
    if (userId) salvarRegistroDia(userId, hojeISO, novoRegistro);
  }

  function registrarMenstruacaoHoje() {
    if (!cycleDayDentroDaMenstruacao(config, hoje)) {
      atualizarConfig({ ultimaMenstruacao: hojeISO });
    }
    atualizarRegistro({ menstruada: true });
  }

  function alternarSintoma(key: string) {
    const ativos = registro.sintomas.includes(key)
      ? registro.sintomas.filter((s) => s !== key)
      : [...registro.sintomas, key];
    atualizarRegistro({ sintomas: ativos });
  }

  function confirmarData() {
    const iso = parseDataBR(dataInput);
    if (iso) {
      atualizarConfig({ ultimaMenstruacao: iso });
    } else {
      setDataInput(formatDataBR(config.ultimaMenstruacao));
    }
  }

  function mesAnterior() {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual(anoAtual - 1);
    } else {
      setMesAtual(mesAtual - 1);
    }
  }

  function mesProximo() {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(mesAtual + 1);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#7C3AED" />
      </SafeAreaView>
    );
  }

  const faseAtual = getFaseAtual(config, hoje);
  const diasProximaMenstruacao = getDiasParaProximaMenstruacao(config, hoje);
  const offsetInicial = getPrimeiroDiaSemana(anoAtual, mesAtual);
  const diasDoMes = getDiasDoMes(config, anoAtual, mesAtual, hoje);
  const previsoes = getPrevisoesCiclos(config, 3);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 16 }}>
        <GradientBackground className="rounded-b-3xl px-4 pt-4 pb-6 gap-4" style={{ overflow: 'hidden' }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
                <Text className="text-lg">🩸</Text>
              </View>
              <Text className="font-bold text-white text-base">Ciclo Menstrual</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity className="w-8 h-8 items-center justify-center" onPress={() => setSettingsVisible(true)}>
                <Text className="text-white text-lg">⚙️</Text>
              </TouchableOpacity>
              <TouchableOpacity className="w-8 h-8 items-center justify-center" onPress={() => setInfoVisible(true)}>
                <Text className="text-white text-lg">ⓘ</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="gap-1">
            <Text className="text-white/70 text-xs">Fase atual</Text>
            <Text className="text-white font-bold text-xl">
              {faseAtual.icon} {faseAtual.label}
            </Text>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 bg-white/20 rounded-2xl py-3 items-center">
              <Text className="text-white font-bold text-base">{diasProximaMenstruacao}d</Text>
              <Text className="text-white/70 text-xs text-center">Próxima mens.</Text>
            </View>
            <View className="flex-1 bg-white/20 rounded-2xl py-3 items-center">
              <Text className="text-white font-bold text-base">{config.duracaoCiclo}d</Text>
              <Text className="text-white/70 text-xs text-center">Ciclo</Text>
            </View>
            <View className="flex-1 bg-white/20 rounded-2xl py-3 items-center">
              <Text className="text-white font-bold text-base">{config.duracaoMenstruacao}d</Text>
              <Text className="text-white/70 text-xs text-center">Duração</Text>
            </View>
          </View>
        </GradientBackground>

        <View className="px-4 gap-4 mt-4">
          <View className="border border-gray-100 rounded-2xl p-4 gap-3">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                className="w-8 h-8 rounded-lg border border-gray-200 items-center justify-center"
                onPress={mesAnterior}
              >
                <Text className="text-text-main text-base">‹</Text>
              </TouchableOpacity>
              <Text className="font-semibold text-text-main text-sm">
                {nomesMeses[mesAtual]} {anoAtual}
              </Text>
              <TouchableOpacity
                className="w-8 h-8 rounded-lg border border-gray-200 items-center justify-center"
                onPress={mesProximo}
              >
                <Text className="text-text-main text-base">›</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row">
              {diasSemana.map((dia, i) => (
                <View key={i} style={{ width: '14.2857%' }} className="items-center py-1">
                  <Text className="text-text-sub text-xs font-medium">{dia}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {Array.from({ length: offsetInicial }).map((_, i) => (
                <View key={`vazio-${i}`} style={{ width: '14.2857%' }} className="aspect-square" />
              ))}
              {diasDoMes.map(({ dia, fase }) => {
                const ehHoje =
                  dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();
                return (
                  <View key={dia} style={{ width: '14.2857%' }} className="aspect-square items-center justify-center p-0.5">
                    <View
                      className={`w-full h-full items-center justify-center rounded-full ${faseCalendarioCor[fase]} ${ehHoje ? 'border-2 border-primary' : ''}`}
                    >
                      <Text className={`text-xs font-medium ${faseCalendarioTexto[fase]}`}>{dia}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View className="flex-row flex-wrap gap-y-2 pt-3 border-t border-gray-100">
              <LegendaItem cor="bg-accent-dark" label="Menstruação registrada" />
              <LegendaItem cor="bg-primary" label="Ovulação" />
              <LegendaItem cor="bg-rose-100" label="TPM estimada" />
              <LegendaItem cor="bg-accent/30" label="Menstruação prevista" />
              <LegendaItem cor="bg-primary-light" label="Período fértil" />
            </View>
          </View>

          <View className="border border-gray-100 rounded-2xl p-4 gap-4">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">☀️</Text>
              <Text className="font-semibold text-text-main text-sm">Registrar hoje</Text>
            </View>

            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <View className="flex-row items-center gap-2">
                <Text className="text-base">🩸</Text>
                <Text className="text-text-main text-sm">Estou menstruada hoje</Text>
              </View>
              <TouchableOpacity
                className={`rounded-xl px-4 py-2 ${registro.menstruada ? 'bg-muted' : 'border border-primary'}`}
                onPress={registrarMenstruacaoHoje}
                disabled={registro.menstruada}
              >
                <Text className={`text-sm font-medium ${registro.menstruada ? 'text-text-sub' : 'text-primary'}`}>
                  {registro.menstruada ? 'Registrado ✓' : 'Registrar'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="gap-2 pb-3 border-b border-gray-100">
              <Text className="text-text-sub text-sm">Como você está hoje?</Text>
              <View className="flex-row gap-2">
                {HUMORES.map((h) => {
                  const selecionado = registro.humor === h.key;
                  return (
                    <TouchableOpacity
                      key={h.key}
                      className={`flex-1 items-center gap-1 rounded-xl py-2 ${selecionado ? 'border-2 border-primary bg-primary-bg' : 'border border-gray-200'}`}
                      onPress={() => atualizarRegistro({ humor: selecionado ? null : h.key })}
                    >
                      <Text className={`text-lg ${h.color}`}>{h.icon}</Text>
                      <Text className="text-text-sub text-xs">{h.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-text-sub text-sm">Sintomas de hoje (opcional)</Text>
              <View className="flex-row flex-wrap gap-2">
                {SINTOMAS.map((s) => {
                  const selecionado = registro.sintomas.includes(s.key);
                  return (
                    <TouchableOpacity
                      key={s.key}
                      className={`flex-row items-center gap-1 rounded-full px-3 py-2 ${selecionado ? 'border border-primary bg-primary-bg' : 'border border-gray-200'}`}
                      onPress={() => alternarSintoma(s.key)}
                    >
                      <Text className="text-sm">{s.icon}</Text>
                      <Text className={`text-xs ${selecionado ? 'text-primary' : 'text-text-sub'}`}>{s.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View className="border border-gray-100 rounded-2xl p-4 gap-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">📅</Text>
              <Text className="font-semibold text-text-main text-sm">Previsão do próximo ciclo</Text>
            </View>

            {previsoes.map((p, i) => (
              <View key={p.inicio} className="bg-accent/10 rounded-2xl p-4 gap-1">
                <View className="flex-row items-center justify-between">
                  <Text className="font-semibold text-text-main text-sm">Ciclo {i + 1}</Text>
                  <View className="bg-white rounded-full px-2 py-1">
                    <Text className="text-accent-dark text-xs font-medium">{p.duracaoMenstruacao} dias</Text>
                  </View>
                </View>
                <Text className="text-text-main text-sm">
                  <Text className="font-semibold">Menstruação: </Text>
                  {formatDataBR(p.inicio)} – {formatDataBR(p.fim)}
                </Text>
                <Text className="text-primary text-sm">
                  <Text className="font-semibold">Ovulação est.: </Text>
                  {formatDataBR(p.ovulacao)}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={() => router.push('/(app)/home')}>
            <GradientBackground className="rounded-2xl py-4 items-center flex-row justify-center gap-2" style={{ overflow: 'hidden' }}>
              <Text className="text-white text-base">♡</Text>
              <Text className="text-white font-semibold text-sm">Acessar Rede de Apoio →</Text>
            </GradientBackground>
            <Text className="text-text-sub text-xs text-center mt-2">
              Acesse recursos jurídicos, triagem e apoio psicológico
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={infoVisible} transparent animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <View className="bg-white rounded-3xl p-6 w-full gap-3" style={{ maxWidth: 400 }}>
            <View className="flex-row items-start justify-between">
              <Text className="text-lg font-bold text-text-main flex-1">Como funciona o calendário</Text>
              <TouchableOpacity onPress={() => setInfoVisible(false)}>
                <Text className="text-text-sub text-xl">✕</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-text-sub text-sm">
              As previsões são calculadas a partir da data de início da sua última menstruação e da duração média
              do seu ciclo e do seu período.
            </Text>
            <Text className="text-text-sub text-sm">
              🩸 Menstruação registrada: dias já confirmados do seu sangramento.{'\n'}
              🌷 Menstruação prevista: dias futuros estimados do seu sangramento.{'\n'}
              ✨ Ovulação: dia mais provável da ovulação.{'\n'}
              ☀️ Período fértil: dias com maior chance de gravidez.{'\n'}
              🌸 TPM (estimado): dias antes da menstruação em que os sintomas costumam aparecer.
            </Text>
            <Text className="text-text-sub text-xs">
              Esses cálculos são estimativas e podem variar de pessoa para pessoa. Em caso de dúvidas, converse com
              um profissional de saúde.
            </Text>
            <TouchableOpacity className="bg-primary rounded-xl py-3 items-center" onPress={() => setInfoVisible(false)}>
              <Text className="text-white text-sm font-medium">Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={settingsVisible} transparent animationType="fade" onRequestClose={() => setSettingsVisible(false)}>
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <View className="bg-white rounded-3xl p-6 w-full gap-4" style={{ maxWidth: 400 }}>
            <View className="flex-row items-start justify-between">
              <Text className="text-lg font-bold text-text-main flex-1">Configurações do Ciclo</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Text className="text-text-sub text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-text-sub text-sm flex-1">Duração do ciclo</Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  className="w-8 h-8 rounded-lg border border-gray-200 items-center justify-center"
                  disabled={config.duracaoCiclo <= CICLO_MIN}
                  onPress={() => atualizarConfig({ duracaoCiclo: Math.max(CICLO_MIN, config.duracaoCiclo - 1) })}
                >
                  <Text className="text-text-main text-base">‹</Text>
                </TouchableOpacity>
                <Text className="text-text-main text-sm w-16 text-center">{config.duracaoCiclo} dias</Text>
                <TouchableOpacity
                  className="w-8 h-8 rounded-lg border border-gray-200 items-center justify-center"
                  disabled={config.duracaoCiclo >= CICLO_MAX}
                  onPress={() => atualizarConfig({ duracaoCiclo: Math.min(CICLO_MAX, config.duracaoCiclo + 1) })}
                >
                  <Text className="text-text-main text-base">›</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-text-sub text-sm flex-1">Duração da menstruação</Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  className="w-8 h-8 rounded-lg border border-gray-200 items-center justify-center"
                  disabled={config.duracaoMenstruacao <= MENSTRUACAO_MIN}
                  onPress={() => atualizarConfig({ duracaoMenstruacao: Math.max(MENSTRUACAO_MIN, config.duracaoMenstruacao - 1) })}
                >
                  <Text className="text-text-main text-base">‹</Text>
                </TouchableOpacity>
                <Text className="text-text-main text-sm w-16 text-center">{config.duracaoMenstruacao} dias</Text>
                <TouchableOpacity
                  className="w-8 h-8 rounded-lg border border-gray-200 items-center justify-center"
                  disabled={config.duracaoMenstruacao >= MENSTRUACAO_MAX}
                  onPress={() => atualizarConfig({ duracaoMenstruacao: Math.min(MENSTRUACAO_MAX, config.duracaoMenstruacao + 1) })}
                >
                  <Text className="text-text-main text-base">›</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-text-sub text-sm flex-1">Início da última menstruação</Text>
              <TextInput
                className="bg-muted rounded-xl px-3 py-2 text-sm text-text-main w-32 text-center"
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#9CA3AF"
                value={dataInput}
                onChangeText={setDataInput}
                onBlur={confirmarData}
                onSubmitEditing={confirmarData}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            <TouchableOpacity className="bg-primary rounded-xl py-3 items-center" onPress={() => setSettingsVisible(false)}>
              <Text className="text-white text-sm font-medium">Concluído</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <EmergencyBar />
    </SafeAreaView>
  );
}
