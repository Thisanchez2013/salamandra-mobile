import '../../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { COLORS } from '../constants/theme';
import { SessaoProvider, useSessao } from '../contexts/SessaoContext';

// ==================================================
// NAVEGAÇÃO
// As telas internas só existem para quem está logado.
// Sem sessão, qualquer acesso volta para o login; com sessão,
// o login some e o app abre direto na Home.
// ==================================================

function Navegacao() {
  const { sessao, carregando } = useSessao();

  if (carregando) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator color={COLORS.gold} />
      </View>
    );
  }

  const logado = !!sessao;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Evita o "flash" branco durante a troca de telas.
        contentStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <Stack.Protected guard={logado}>
        <Stack.Screen name="home" />
        <Stack.Screen name="menu" />
        <Stack.Screen name="clientes" />
        <Stack.Screen name="novo-cliente" />
        <Stack.Screen name="produtos" />
        <Stack.Screen name="produto-formulario" />
        <Stack.Screen name="produto/[id]" />
        <Stack.Screen name="entrada-estoque" />
        <Stack.Screen name="fornecedores" />
        <Stack.Screen name="fornecedor-formulario" />
        <Stack.Screen name="vendas" />
        <Stack.Screen name="venda/[id]" />
        <Stack.Screen name="relatorios" />
        <Stack.Screen name="auditoria" />
      </Stack.Protected>

      <Stack.Protected guard={!logado}>
        <Stack.Screen name="index" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SessaoProvider>
      {/* Ícones claros (hora, bateria) sobre o fundo escuro do app. */}
      <StatusBar style="light" />

      <Navegacao />
    </SessaoProvider>
  );
}
