import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BackHeader } from '../../components/BackHeader';
import { EmergencyBar } from '../../components/EmergencyBar';

const tipos = [
  {
    id: 'fisica',
    title: 'Violência Física',
    desc: 'Qualquer conduta que ofenda a integridade ou saúde corporal da mulher.',
    exemplos: ['Empurrões, tapas, socos, chutes', 'Sufocamento ou estrangulamento', 'Queimaduras', 'Uso de armas ou objetos para causar lesões', 'Puxões de cabelo'],
    acao: 'Procure atendimento médico imediatamente e registre um Boletim de Ocorrência.',
  },
  {
    id: 'psicologica',
    title: 'Violência Psicológica',
    desc: 'Qualquer conduta que cause dano emocional, diminuição da autoestima ou controle.',
    exemplos: ['Humilhações e xingamentos constantes', 'Intimidação e ameaças', 'Isolamento de familiares e amigos', 'Manipulação emocional', 'Controle de vestimentas, comportamentos ou redes sociais', 'Chantagem emocional'],
    acao: 'Busque apoio psicológico e documente as situações com mensagens e testemunhas.',
  },
  {
    id: 'sexual',
    title: 'Violência Sexual',
    desc: 'Qualquer ação que constranja a mulher a presenciar, manter ou participar de relação sexual não desejada.',
    exemplos: ['Estupro ou tentativa de estupro', 'Forçar atos sexuais não desejados', 'Impedir o uso de métodos contraceptivos', 'Exposição não consentida a conteúdo sexual', 'Obrigar a mulher a engravidar ou abortar'],
    acao: 'Procure atendimento médico em até 72h para prevenção de DSTs e gravidez. Registre B.O.',
  },
  {
    id: 'patrimonial',
    title: 'Violência Patrimonial',
    desc: 'Qualquer conduta que configure retenção, subtração ou destruição de bens e valores.',
    exemplos: ['Controle do dinheiro da mulher', 'Destruição de documentos pessoais', 'Furto ou roubo de pertences', 'Destruição de objetos pessoais', 'Impedimento de trabalhar ou estudar'],
    acao: 'Documente os danos com fotos e testemunhas. Registre B.O. e busque orientação jurídica.',
  },
  {
    id: 'moral',
    title: 'Violência Moral',
    desc: 'Qualquer conduta que configure calúnia, difamação ou injúria.',
    exemplos: ['Acusações falsas', 'Difamação pública ou nas redes sociais', 'Exposição da intimidade', 'Críticas à reputação e honra', 'Compartilhamento de informações íntimas sem consentimento'],
    acao: 'Documente as ofensas com prints e testemunhas. Registre B.O.',
  },
];

function CartilhaItem({
  tipo,
  expanded,
  onToggle,
}: {
  tipo: (typeof tipos)[number];
  expanded: boolean;
  onToggle: () => void;
}) {
  const rotation = useSharedValue(expanded ? 180 : 0);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 180 : 0, { duration: 200 });
  }, [expanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View layout={LinearTransition} className="border-b border-gray-100 py-3">
      <TouchableOpacity className="flex-row items-center justify-between" onPress={onToggle}>
        <Text className="font-semibold text-text-main text-sm">{tipo.title}</Text>
        <Animated.Text style={[{ color: '#6B7280' }, chevronStyle]}>⌄</Animated.Text>
      </TouchableOpacity>
      {expanded && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} className="mt-3 gap-3">
          <Text className="text-text-sub text-sm">{tipo.desc}</Text>
          <Text className="font-semibold text-text-main text-sm">Exemplos:</Text>
          {tipo.exemplos.map((e) => (
            <Text key={e} className="text-text-sub text-sm">• {e}</Text>
          ))}
          <View className="bg-muted rounded-xl p-3">
            <Text className="font-semibold text-text-main text-sm">O que fazer:</Text>
            <Text className="text-text-sub text-sm mt-1">{tipo.acao}</Text>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function Cartilha() {
  const [expanded, setExpanded] = useState<string | null>('fisica');

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackHeader />
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center">
            <Text className="text-lg">📖</Text>
          </View>
          <View>
            <Text className="font-bold text-text-main text-base">Cartilha sobre Violência</Text>
            <Text className="text-text-sub text-xs">Conheça os tipos de violência contra a mulher reconhecidos pela Lei Maria da Penha</Text>
          </View>
        </View>

        <Text className="text-text-sub text-sm mb-4">
          A Lei Maria da Penha (Lei 11.340/2006) reconhece cinco tipos de violência doméstica e familiar contra a mulher. Conheça cada uma delas:
        </Text>

        {tipos.map((tipo) => (
          <CartilhaItem
            key={tipo.id}
            tipo={tipo}
            expanded={expanded === tipo.id}
            onToggle={() => setExpanded(expanded === tipo.id ? null : tipo.id)}
          />
        ))}

        <View className="bg-primary-bg rounded-2xl p-4 my-6 gap-1">
          <Text className="text-text-main text-sm font-semibold">Lembre-se:</Text>
          {[
            'Você não está sozinha',
            'A violência não é sua culpa',
            'Existem leis que protegem você',
            'Buscar ajuda é um ato de coragem',
          ].map((i) => (
            <Text key={i} className="text-text-sub text-sm">• {i}</Text>
          ))}
        </View>
      </ScrollView>
      <EmergencyBar />
    </SafeAreaView>
  );
}
