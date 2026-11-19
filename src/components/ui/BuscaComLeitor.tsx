import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/theme';
import { SearchInput } from './SearchInput';

interface BuscaComLeitorProps {
  value: string;
  onChangeText: (texto: string) => void;
  placeholder: string;
}

export function BuscaComLeitor({ value, onChangeText, placeholder }: BuscaComLeitorProps) {
  const router = useRouter();
  const [permissaoCamera, solicitarPermissao] = useCameraPermissions();
  const [cameraAberta, setCameraAberta] = useState(false);

  async function abrirCamera() {
    if (!permissaoCamera?.granted) {
      const res = await solicitarPermissao();
      if (!res.granted) {
        Alert.alert('Permissão negada', 'Precisamos de permissão para usar a câmera.');
        return;
      }
    }
    setCameraAberta(true);
  }

  function handleCodigoLido({ data }: { data: string }) {
    if (!data) return;
    onChangeText(data.trim());
    setCameraAberta(false);
  }

  return (
    <>
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <SearchInput value={value} onChangeText={onChangeText} placeholder={placeholder} />
        </View>

        <Pressable
          className="mt-[18px] h-[52px] w-[52px] items-center justify-center self-center rounded-xl border border-salamandra-border bg-salamandra-card active:opacity-70"
          onPress={() => void abrirCamera()}
          accessibilityRole="button"
          accessibilityLabel="Ler código de barras"
        >
          <Ionicons name="barcode-outline" size={24} color={COLORS.gold} />
        </Pressable>

        <Pressable
          className="mt-[18px] h-[52px] w-[52px] items-center justify-center self-center rounded-xl border border-salamandra-border bg-salamandra-card active:opacity-70"
          onPress={() => router.push('/etiquetas')}
          accessibilityRole="button"
          accessibilityLabel="Gerar etiquetas"
        >
          <Ionicons name="print-outline" size={24} color={COLORS.gold} />
        </Pressable>
      </View>

      <Modal visible={cameraAberta} animationType="slide" onRequestClose={() => setCameraAberta(false)}>
        <View className="flex-1 bg-black">
          <CameraView
            style={{ flex: 1, width: '100%', height: '100%' }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'ean13', 'ean8'] }}
            onBarcodeScanned={cameraAberta ? handleCodigoLido : undefined}
          >
            <SafeAreaView className="flex-1 justify-between p-6">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-white">Aponte para o código do produto</Text>
                <Pressable
                  className="h-10 w-10 items-center justify-center rounded-full bg-black/60"
                  onPress={() => setCameraAberta(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar câmera"
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </Pressable>
              </View>

              <View className="h-48 w-72 self-center rounded-2xl border-2 border-dashed border-salamandra-gold opacity-80" />

              <View className="items-center pb-4">
                <Text className="text-xs text-white/75">A busca é preenchida ao ler o código.</Text>
              </View>
            </SafeAreaView>
          </CameraView>
        </View>
      </Modal>
    </>
  );
}
