import { TouchableOpacity, Text, Linking } from 'react-native';

export function EmergencyBar() {
  return (
    <TouchableOpacity
      className="bg-emergency mx-4 mb-4 rounded-xl py-4 items-center"
      onPress={() => Linking.openURL('tel:180')}
    >
      <Text className="text-white font-semibold tracking-widest text-sm">
        EMERGÊNCIA - 180
      </Text>
    </TouchableOpacity>
  );
}
