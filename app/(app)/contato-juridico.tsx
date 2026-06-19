import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/BackHeader';
import { EmergencyBar } from '../../components/EmergencyBar';

const servicos = [
  {
    nome: 'Defensoria Pública da União - Núcleo de Defesa da Mulher',
    desc: 'Assistência jurídica gratuita para mulheres em situação de vulnerabilidade',
    telefone: '0800 729 0088',
    email: 'atendimento@dpu.def.br',
    local: 'Disponível em todo território nacional',
    horario: 'Segunda à sexta, 8h às 18h',
    pode_ligar: true,
  },
  {
    nome: 'NPJ - Núcleo de Prática Jurídica (Faculdades)',
    desc: 'Assistência jurídica gratuita prestada por estudantes de Direito sob supervisão de professores',
    telefone: 'Consulte sua faculdade local',
    email: 'Varia por instituição',
    local: 'Disponível em universidades públicas e privadas',
    horario: 'Segunda a sexta, horário comercial (varia por instituição)',
    pode_ligar: false,
  },
  {
    nome: 'Central de Atendimento à Mulher - Ligue 180',
    desc: 'Orientação sobre direitos e serviços disponíveis para mulheres',
    telefone: '180',
    email: 'ligue180@mdh.gov.br',
    local: 'Atendimento nacional 24h',
    horario: '24 horas, todos os dias',
    pode_ligar: true,
  },
  {
    nome: 'Delegacia da Mulher',
    desc: 'Registro de ocorrências e investigação de crimes contra mulheres',
    telefone: '190',
    email: 'Consulte sua delegacia local',
    local: 'Localize a delegacia mais próxima',
    horario: 'Varia por localidade - Algumas funcionam 24h',
    pode_ligar: true,
  },
  {
    nome: 'Ministério Público - Promotoria da Mulher',
    desc: 'Acompanhamento de processos e fiscalização de medidas protetivas',
    telefone: 'Consulte seu estado',
    email: 'Consulte seu estado',
    local: 'Disponível em cada estado',
    horario: 'Segunda a sexta, horário comercial',
    pode_ligar: false,
  },
];

const infos = [
  {
    titulo: 'Medidas Protetivas de Urgência',
    texto: 'Podem ser solicitadas em até 48 horas após o registro do B.O. Incluem afastamento do agressor, proibição de contato e aproximação.',
  },
  {
    titulo: 'Assistência Judiciária Gratuita',
    texto: 'Se você não pode pagar advogado, a Defensoria Pública oferece assistência jurídica gratuita.',
  },
  {
    titulo: 'Lei Maria da Penha',
    texto: 'A Lei 11.340/2006 protege mulheres contra violência doméstica e familiar, garantindo medidas de proteção e punição aos agressores.',
  },
];

export default function ContatoJuridico() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackHeader />
      <ScrollView className="flex-1 px-4">
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center">
            <Text className="text-lg">⚖️</Text>
          </View>
          <View>
            <Text className="font-bold text-text-main text-base">Contato Jurídico</Text>
            <Text className="text-text-sub text-xs">Serviços de assistência jurídica e orientação legal</Text>
          </View>
        </View>

        {servicos.map((s) => (
          <View key={s.nome} className="border-b border-gray-100 py-4 gap-2">
            <Text className="font-semibold text-text-main text-sm">{s.nome}</Text>
            <Text className="text-text-sub text-xs">{s.desc}</Text>
            <View className="flex-row gap-6">
              <View>
                <Text className="text-text-sub text-xs">Contato</Text>
                <Text className={`text-sm ${s.pode_ligar ? 'text-primary' : 'text-text-main'} font-medium`}>
                  {s.telefone}
                </Text>
              </View>
              <View>
                <Text className="text-text-sub text-xs">E-mail</Text>
                <Text className="text-text-main text-sm">{s.email}</Text>
              </View>
            </View>
            <View>
              <Text className="text-text-sub text-xs">Localização</Text>
              <Text className="text-text-main text-sm">{s.local}</Text>
            </View>
            <View className="bg-muted rounded-xl px-3 py-2">
              <Text className="text-text-main text-xs">
                <Text className="font-semibold">Horário: </Text>{s.horario}
              </Text>
            </View>
            {s.pode_ligar && (
              <TouchableOpacity
                className="border border-primary rounded-xl py-3 items-center flex-row justify-center gap-2"
                onPress={() => Linking.openURL(`tel:${s.telefone.replace(/\D/g, '')}`)}
              >
                <Text className="text-primary text-sm">📞</Text>
                <Text className="text-primary font-medium text-sm">Ligar Agora</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View className="py-4 gap-3">
          <Text className="font-bold text-text-main text-sm">Informações Importantes</Text>
          {infos.map((info) => (
            <View key={info.titulo} className="bg-muted rounded-2xl p-4 gap-1">
              <Text className="font-semibold text-text-main text-sm">{info.titulo}</Text>
              <Text className="text-text-sub text-sm">{info.texto}</Text>
            </View>
          ))}
        </View>

        <View className="pb-4 gap-2">
          <Text className="font-semibold text-text-main text-sm">Links Úteis</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.gov.br/mulheres')}>
            <Text className="text-primary text-sm">↗ Portal do Governo Federal - Mulheres</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.dpu.def.br')}>
            <Text className="text-primary text-sm">↗ Defensoria Pública - Núcleo da Mulher</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <EmergencyBar />
    </SafeAreaView>
  );
}
