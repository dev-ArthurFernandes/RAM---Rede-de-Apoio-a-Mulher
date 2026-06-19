import { View, Text, TouchableOpacity, Modal } from 'react-native';
import * as Linking from 'expo-linking';
import QRCode from 'react-native-qrcode-svg';
import { PrimaryButton } from './PrimaryButton';

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
}

export function QRCodeModal({ visible, onClose }: QRCodeModalProps) {
  const appUrl = Linking.createURL('/');

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-3xl p-6 w-full gap-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 gap-1">
              <Text className="text-lg font-bold text-text-main">QR Code do Aplicativo</Text>
              <Text className="text-text-sub text-sm">
                Compartilhe este QR code de forma discreta para ajudar outras pessoas a acessarem o RAM
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-text-sub text-xl font-light">✕</Text>
            </TouchableOpacity>
          </View>
          <View className="items-center py-4">
            <View className="w-40 h-40 bg-primary-bg rounded-2xl items-center justify-center">
              <QRCode value={appUrl} size={144} color="#7C3AED" backgroundColor="#EDE9FE" />
            </View>
          </View>
          <Text className="text-center text-text-sub text-sm">Escaneie este código para acessar o aplicativo</Text>
          <PrimaryButton label="⬇  Baixar QR Code" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
