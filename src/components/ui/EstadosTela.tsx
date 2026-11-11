import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { COLORS } from '../../constants/theme';

type NomeIcone = keyof typeof Ionicons.glyphMap;

// ==================================================
// CARREGANDO
// ==================================================

interface LoadingStateProps {
  mensagem: string;
}

export function LoadingState({ mensagem }: LoadingStateProps) {
  return (
    <View className="items-center py-12">
      <ActivityIndicator
        size="small"
        color={COLORS.gold}
      />

      <Text className="mt-3 text-xs text-salamandra-muted">
        {mensagem}
      </Text>
    </View>
  );
}

// ==================================================
// BOTÃO DOURADO (usado nos estados abaixo)
// ==================================================

interface BotaoEstadoProps {
  icon: NomeIcone;
  rotulo: string;
  onPress: () => void;
}

function BotaoEstado({ icon, rotulo, onPress }: BotaoEstadoProps) {
  return (
    <Pressable
      className="mt-5 flex-row items-center rounded-xl bg-salamandra-gold px-5 py-3 active:opacity-80"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
    >
      <Ionicons
        name={icon}
        size={19}
        color={COLORS.background}
      />

      <Text className="ml-2 text-xs font-extrabold text-salamandra-background">
        {rotulo.toUpperCase()}
      </Text>
    </Pressable>
  );
}

// ==================================================
// ERRO
// ==================================================

interface ErrorStateProps {
  mensagem: string;
  titulo?: string;
  onRetry?: () => void;
}

export function ErrorState({
  mensagem,
  titulo = 'Não foi possível carregar',
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="mt-6 items-center rounded-2xl border border-salamandra-border bg-salamandra-card px-5 py-10">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-salamandra-surface">
        <Ionicons
          name="alert-circle-outline"
          size={28}
          color={COLORS.error}
        />
      </View>

      <Text className="mt-4 text-sm font-bold text-salamandra-textSoft">
        {titulo}
      </Text>

      <Text className="mt-1.5 text-center text-xs leading-5 text-salamandra-muted">
        {mensagem}
      </Text>

      {onRetry ? (
        <BotaoEstado
          icon="refresh-outline"
          rotulo="Tentar novamente"
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}

// ==================================================
// VAZIO / SEM RESULTADO
// ==================================================

interface EmptyStateProps {
  icon: NomeIcone;
  titulo: string;
  descricao?: string;
  acao?: BotaoEstadoProps;
}

export function EmptyState({
  icon,
  titulo,
  descricao,
  acao,
}: EmptyStateProps) {
  return (
    <View className="items-center rounded-2xl border border-salamandra-border bg-salamandra-card px-5 py-10">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-salamandra-surface">
        <Ionicons
          name={icon}
          size={28}
          color={COLORS.subtle}
        />
      </View>

      <Text className="mt-4 text-sm font-bold text-salamandra-textSoft">
        {titulo}
      </Text>

      {descricao ? (
        <Text className="mt-1.5 text-center text-xs leading-5 text-salamandra-muted">
          {descricao}
        </Text>
      ) : null}

      {acao ? <BotaoEstado {...acao} /> : null}
    </View>
  );
}
