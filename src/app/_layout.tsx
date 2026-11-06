import '../../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { COLORS } from '../constants/theme';

export default function RootLayout() {
  return (
    <>
      {/* Ícones claros (hora, bateria) sobre o fundo escuro do app. */}
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          headerShown: false,
          // Evita o "flash" branco durante a troca de telas.
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      />
    </>
  );
}
