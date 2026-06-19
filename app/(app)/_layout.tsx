import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="home" options={{ animation: 'fade' }} />
      <Stack.Screen name="cartilha" />
      <Stack.Screen name="triagem" />
      <Stack.Screen name="contato-juridico" />
      <Stack.Screen name="apoio-psicologico" />
      <Stack.Screen name="calendario-menstrual" />
      <Stack.Screen name="portal-npj" options={{ animation: 'fade' }} />
      <Stack.Screen name="portal-psicologia" options={{ animation: 'fade' }} />
    </Stack>
  );
}
