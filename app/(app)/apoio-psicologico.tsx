import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/BackHeader';
import { EmergencyBar } from '../../components/EmergencyBar';
import { AnimatedTabs } from '../../components/AnimatedTabs';

type Tab = 'servicos' | 'autocuidado';

const servicos = [
  {
    nome: 'Centro de Valorização da Vida - CVV',
    desc: 'Apoio emocional e prevenção do suicídio através de voluntários',
    contato: '188',
    tipo: 'Telefone, chat e email',
    horario: '24 horas, todos os dias',
    site: 'cvv.org.br',
    pode_ligar: true,
  },
  {
    nome: 'Mapa da Saúde Mental',
    desc: 'Localize CAPS e serviços de saúde mental gratuitos na sua região',
    contato: 'Consulte online',
    tipo: 'Presencial',
    horario: 'Varia por unidade',
    site: 'mapadasaudemental.org.br',
    pode_ligar: false,
  },
  {
    nome: 'Ligue 180 - Apoio Psicológico',
    desc: 'Orientação psicológica para mulheres em situação de violência',
    contato: '180',
    tipo: 'Telefone',
    horario: '24 horas, todos os dias',
    site: 'gov.br/mdh',
    pode_ligar: true,
  },
  {
    nome: 'CAPS - Centro de Atenção Psicossocial',
    desc: 'Atendimento gratuito em saúde mental pelo SUS',
    contato: 'Consulte sua cidade',
    tipo: 'Presencial',
    horario: 'Segunda a sexta, horário comercial',
    site: '',
    pode_ligar: false,
  },
];

const autocuidado = [
  {
    icon: '🤍',
    titulo: 'Respiração Consciente',
    desc: 'Inspire pelo nariz contando até 4, segure por 4 segundos, expire pela boca contando até 6. Repita 5 vezes.',
  },
  {
    icon: '👥',
    titulo: 'Rede de Apoio',
    desc: 'Mantenha contato com pessoas de confiança. Compartilhar seus sentimentos pode aliviar a carga emocional.',
  },
  {
    icon: '🤍',
    titulo: 'Rotina de Autocuidado',
    desc: 'Reserve tempo para atividades que você gosta. Pequenos momentos de prazer fazem diferença.',
  },
];

const outrasPraticas = [
  'Mantenha uma rotina de sono regular',
  'Pratique atividades físicas, mesmo que leves',
  'Alimente-se de forma equilibrada',
  'Reserve tempo para hobbies e lazer',
  'Limite o consumo de notícias negativas',
  'Pratique a gratidão diariamente',
  'Estabeleça limites saudáveis',
];

const sinaisEmergencia = [
  'Pensamentos de autoagressão ou suicídio',
  'Crises de pânico frequentes',
  'Incapacidade de realizar atividades diárias',
  'Isolamento social extremo',
  'Alterações graves no sono ou apetite',
];

export default function ApoioPsicologico() {
  const [tab, setTab] = useState<Tab>('servicos');

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackHeader />
      <ScrollView className="flex-1 px-4">
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center">
            <Text className="text-lg">💬</Text>
          </View>
          <View>
            <Text className="font-bold text-text-main text-base">Apoio Psicológico</Text>
            <Text className="text-text-sub text-xs">Recursos de suporte emocional e saúde mental</Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="mb-4">
          <AnimatedTabs
            tabs={[
              { key: 'servicos', label: 'Serviços' },
              { key: 'autocuidado', label: 'Autocuidado' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>

        {tab === 'servicos' ? (
          <View className="gap-4">
            {servicos.map((s) => (
              <View key={s.nome} className="border border-gray-100 rounded-2xl p-4 gap-3">
                <Text className="font-semibold text-text-main text-sm">{s.nome}</Text>
                <Text className="text-text-sub text-xs">{s.desc}</Text>
                <View className="flex-row gap-6">
                  <View>
                    <Text className="text-text-sub text-xs">Contato</Text>
                    <Text className="text-text-main font-medium text-sm">{s.contato}</Text>
                  </View>
                  <View>
                    <Text className="text-text-sub text-xs">Tipo</Text>
                    <Text className="text-text-main text-sm">{s.tipo}</Text>
                  </View>
                </View>
                <View className="bg-muted rounded-xl px-3 py-2">
                  <Text className="text-xs text-text-main">
                    <Text className="font-semibold">Horário: </Text>{s.horario}
                    {s.site ? `\nSite: ${s.site}` : ''}
                  </Text>
                </View>
                {s.pode_ligar && (
                  <TouchableOpacity
                    className="border border-primary rounded-xl py-3 flex-row items-center justify-center gap-2"
                    onPress={() => Linking.openURL(`tel:${s.contato}`)}
                  >
                    <Text className="text-primary text-sm">📞</Text>
                    <Text className="text-primary font-medium text-sm">Ligar Agora</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Sinais de Emergência */}
            <View className="border-2 border-emergency/20 bg-red-50 rounded-2xl p-4 gap-3">
              <Text className="text-emergency font-bold text-sm">Sinais de Emergência</Text>
              <Text className="text-text-sub text-xs">Se você apresentar algum desses sinais, busque ajuda imediatamente:</Text>
              {sinaisEmergencia.map((s) => (
                <Text key={s} className="text-text-sub text-sm">• {s}</Text>
              ))}
              <TouchableOpacity
                className="bg-primary rounded-xl py-3 flex-row items-center justify-center gap-2"
                onPress={() => Linking.openURL('tel:188')}
              >
                <Text className="text-white text-sm">📞</Text>
                <Text className="text-white font-medium text-sm">CVV - 188 (24h)</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="gap-4">
            <View className="bg-muted rounded-2xl px-4 py-3">
              <Text className="text-text-sub text-sm">
                O autocuidado é fundamental para sua saúde mental e bem-estar. Aqui estão algumas práticas que podem ajudar:
              </Text>
            </View>

            {autocuidado.map((a) => (
              <View key={a.titulo} className="flex-row gap-3 border border-gray-100 rounded-2xl p-4">
                <View className="w-9 h-9 rounded-xl bg-primary items-center justify-center">
                  <Text>{a.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-text-main text-sm">{a.titulo}</Text>
                  <Text className="text-text-sub text-sm mt-1">{a.desc}</Text>
                </View>
              </View>
            ))}

            <View className="border border-gray-100 rounded-2xl p-4 gap-3">
              <Text className="font-semibold text-text-main text-sm">Outras Práticas de Autocuidado</Text>
              {outrasPraticas.map((p) => (
                <Text key={p} className="text-text-sub text-sm">• {p}</Text>
              ))}
            </View>

            <View className="bg-muted rounded-2xl p-4">
              <Text className="text-text-main text-sm">
                <Text className="font-bold">Lembre-se:</Text> Cuidar de si mesma não é egoísmo, é necessidade. Você merece ser feliz e estar bem.
              </Text>
            </View>
          </View>
        )}

        <View className="h-4" />
      </ScrollView>
      <EmergencyBar />
    </SafeAreaView>
  );
}
