import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BackHeader } from '../../components/BackHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmergencyBar } from '../../components/EmergencyBar';

const perguntas = [
  {
    id: 1,
    texto: 'Você já sofreu agressão física (tapas, empurrões, socos, chutes)?',
    opcoes: ['Sim, frequentemente', 'Sim, raramente', 'Não'],
  },
  {
    id: 2,
    texto: 'Você se sente constantemente humilhada, diminuída ou controlada?',
    opcoes: ['Sim, frequentemente', 'Sim, às vezes', 'Não'],
  },
  {
    id: 3,
    texto: 'Você já foi forçada a ter relações sexuais ou atos sexuais não desejados?',
    opcoes: ['Sim', 'Não', 'Prefiro não responder'],
  },
  {
    id: 4,
    texto: 'Alguém controla seu dinheiro, impede você de trabalhar ou destrói seus pertences?',
    opcoes: ['Sim, frequentemente', 'Sim, às vezes', 'Não'],
  },
  {
    id: 5,
    texto: 'Você já foi vítima de difamação, calúnia ou teve sua imagem exposta sem consentimento?',
    opcoes: ['Sim, frequentemente', 'Sim, às vezes', 'Não'],
  },
];

export default function Triagem() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, string>>({});

  const pergunta = perguntas[current];
  const progress = ((current + 1) / perguntas.length) * 100;
  const isLast = current === perguntas.length - 1;

  const progressWidth = useSharedValue(progress);
  useEffect(() => {
    progressWidth.value = withTiming(progress, { duration: 300 });
  }, [progress, progressWidth]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  function selecionar(opcao: string) {
    setRespostas((prev) => ({ ...prev, [current]: opcao }));
  }

  function avancar() {
    if (isLast) {
      router.push('/(app)/contato-juridico');
    } else {
      setCurrent((c) => c + 1);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackHeader />
      <ScrollView className="flex-1 px-4">
        <View className="bg-white rounded-3xl border border-gray-100 p-5 gap-4">
          {/* Title */}
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center">
              <Text className="text-lg">📋</Text>
            </View>
            <View>
              <Text className="font-bold text-text-main text-base">Triagem</Text>
              <Text className="text-text-sub text-xs">Responda às perguntas para identificar possíveis situações de violência</Text>
            </View>
          </View>

          {/* Progress */}
          <View className="flex-row items-center justify-between">
            <Text className="text-text-sub text-xs">Questão {current + 1} de {perguntas.length}</Text>
            <Text className="text-text-sub text-xs">{Math.round(progress)}%</Text>
          </View>
          <View className="h-1.5 bg-gray-100 rounded-full">
            <Animated.View style={[{ height: 6, backgroundColor: '#7C3AED', borderRadius: 9999 }, progressStyle]} />
          </View>

          {/* Confidentiality notice */}
          <View className="bg-muted rounded-2xl px-4 py-3">
            <Text className="text-text-sub text-sm">Suas respostas são confidenciais e não são armazenadas.</Text>
          </View>

          {/* Question */}
          <Animated.View key={current} entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} className="gap-4">
            <Text className="font-semibold text-text-main text-base leading-6">{pergunta.texto}</Text>

            {/* Options */}
            <View className="gap-2">
              {pergunta.opcoes.map((opcao) => {
                const selected = respostas[current] === opcao;
                return (
                  <TouchableOpacity
                    key={opcao}
                    className={`flex-row items-center gap-3 p-4 rounded-2xl border ${
                      selected ? 'border-primary bg-muted' : 'border-gray-100'
                    }`}
                    onPress={() => selecionar(opcao)}
                  >
                    <View className={`w-2.5 h-2.5 rounded-full ${selected ? 'bg-primary' : 'bg-gray-300'}`} />
                    <Text className="text-text-main text-sm">{opcao}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Navigation */}
          <View className="flex-row gap-3 pt-2">
            {current > 0 && (
              <PrimaryButton
                label="Anterior"
                variant="outline"
                onPress={() => setCurrent((c) => c - 1)}
                style={{ flex: 1 }}
              />
            )}
            <PrimaryButton
              label={isLast ? 'Ver Resultado' : 'Próxima'}
              onPress={avancar}
              disabled={!respostas[current]}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </ScrollView>
      <EmergencyBar />
    </SafeAreaView>
  );
}
