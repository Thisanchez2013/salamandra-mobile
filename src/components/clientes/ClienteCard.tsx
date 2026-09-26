import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { COLORS } from '../../constants/theme';
import { Cliente } from '../../types/cliente';

interface ClienteCardProps {
  cliente: Cliente;
  onPress?: () => void;
}

export function ClienteCard({
  cliente,
  onPress,
}: ClienteCardProps) {
  return (
    <Pressable
      className="mb-3 flex-row items-center rounded-2xl border border-salamandra-border bg-salamandra-card p-4 active:opacity-80"
      onPress={onPress}
    >
      {/* ÍCONE */}

      <View className="mr-3 h-12 w-12 items-center justify-center rounded-[14px] bg-salamandra-surface">
        <Ionicons
          name="person-outline"
          size={23}
          color={COLORS.gold}
        />
      </View>

      {/* DADOS */}

      <View className="flex-1">
        <Text
          className="text-sm font-bold text-salamandra-textSecondary"
          numberOfLines={1}
        >
          {cliente.nome}
        </Text>

        <Text className="mt-1 text-xs text-salamandra-muted">
          CPF: {cliente.cpf}
        </Text>

        {cliente.email ? (
          <Text
            className="mt-1 text-[11px] text-salamandra-subtle"
            numberOfLines={1}
          >
            {cliente.email}
          </Text>
        ) : null}
      </View>

      {/* SETA */}

      <Ionicons
        name="chevron-forward"
        size={20}
        color={COLORS.subtle}
      />
    </Pressable>
  );
}