import '../global.css';
import { View } from 'react-native';
import { Stack, usePathname } from 'expo-router';

const PLATFORM_ROUTES = ['/portal-npj', '/portal-psicologia'];

export default function RootLayout() {
  const pathname = usePathname();
  const isPlatform = PLATFORM_ROUTES.includes(pathname);

  return (
    <View className={`flex-1 items-center bg-white ${isPlatform ? '' : 'md:bg-gray-100'}`}>
      <View className={`flex-1 w-full bg-white ${isPlatform ? '' : 'md:max-w-[480px] md:my-6 md:rounded-3xl md:overflow-hidden md:shadow-2xl'}`}>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="login" />
          <Stack.Screen name="login-profissional" />
          <Stack.Screen name="cadastro" />
          <Stack.Screen name="cadastro-form" />
          <Stack.Screen name="reconhecimento-facial" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
      </View>
    </View>
  );
}
