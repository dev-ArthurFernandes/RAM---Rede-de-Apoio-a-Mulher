import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmergencyBar } from '../../components/EmergencyBar';
import { supabase } from '../../lib/supabase';
import {
  CICLO_MAX,
  CICLO_MIN,
  MENSTRUACAO_MAX,
  MENSTRUACAO_MIN,
  CicloConfig,
  carregarCicloConfig,
  criarConfigPadrao,
  faseCalendarioCor,
  faseCalendarioTexto,
  formatDataBR,
  getDiasDoMes,
  getDiasParaProximaMenstruacao,
  getFaseAtual,
  getPrimeiroDiaSemana,
  parseDataBR,
  salvarCicloConfig,
} from '../../lib/ciclo';

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
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

  const [userId, setUserId] = useState<string | null>(null);
  const [config, setConfig] = useState<CicloConfig>(criarConfigPadrao);
  const [dataInput, setDataInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [infoVisible, setInfoVisible] = useState(false);
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id ?? null;
      setUserId(uid);

      const cfg = uid ? await carregarCicloConfig(uid) : criarConfigPadrao();
      setConfig(cfg);
      setDataInput(formatDataBR(cfg.ultimaMenstruacao));
      setLoading(false);
    })();
  }, []);

  function atualizarConfig(alteracoes: Partial<CicloConfig>) {
    const novaConfig = { ...config, ...alteracoes };
    setConfig(novaConfig);
    if (userId) salvarCicloConfig(userId, novaConfig);
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
  const diasDoMes = getDiasDoMes(config, anoAtual, mesAtual);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2 gap-3">
        <TouchableOpacity className="flex-row items-center gap-3 flex-1" onPress={() => router.back()}>
          <Text className="text-text-main text-lg">←</Text>
          <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center">
            <Text className="text-lg">🩸</Text>
          </View>
          <View className="flex-1">
            <Text className="font-bold text-text-main text-base">Calendário Menstrual</Text>
            <Text className="text-text-sub text-xs">Acompanhe seu ciclo</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-8 h-8 items-center justify-center"
          onPress={() => setInfoVisible(true)}
        >
          <Text className="text-text-sub text-lg">ⓘ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ gap: 16, paddingBottom: 16 }}>
        <View className="bg-primary-bg rounded-2xl p-4 flex-row">
          <View className="flex-1 items-center gap-1">
            <Text className="text-text-sub text-xs">Fase atual</Text>
            <Text className="text-primary font-semibold text-sm text-center">
              {faseAtual.icon} {faseAtual.label}
            </Text>
          </View>
          <View className="w-px bg-white" />
          <View className="flex-1 items-center gap-1">
            <Text className="text-text-sub text-xs">Próxima menstruação</Text>
            <Text className="text-primary font-semibold text-sm text-center">
              {formatarDiasRestantes(diasProximaMenstruacao)}
            </Text>
          </View>
        </View>

        <View className="border border-gray-100 rounded-2xl p-4 gap-4">
          <Text className="font-semibold text-text-main text-sm">Configurações do Ciclo</Text>

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
        </View>

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
            {diasSemana.map((dia) => (
              <View key={dia} style={{ width: '14.2857%' }} className="items-center py-1">
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
            <LegendaItem cor="bg-accent" label="Menstruação" />
            <LegendaItem cor="bg-primary" label="Ovulação" />
            <LegendaItem cor="bg-primary-light" label="Período fértil" />
            <LegendaItem cor="bg-accent/20" label="TPM (estimado)" />
          </View>
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
              🩸 Menstruação: dias previstos do seu sangramento.{'\n'}
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

      <EmergencyBar />
    </SafeAreaView>
  );
}
