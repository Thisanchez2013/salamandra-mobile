import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { COLORS } from '../../constants/theme';
import { VendaResumo } from '../../types/venda';
import { formatarMoedaBRL } from '../../utils/currency';

// Cor do selo de acordo com o status da venda.
export function corDoStatus(status: string): string {
  const normalizado = status.toLocaleLowerCase('pt-BR');

  if (normalizado.startsWith('conclu')) {
    return COLORS.gold;
  }

  if (normalizado.startsWith('cancel')) {
    return COLORS.error;
  }

  return COLORS.muted;
}

export function formatarDataHora(valor: string): string {
  return new Date(valor).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface VendaCardProps {
  venda: VendaResumo;
  onPress: () => void;
}

export function VendaCard({ venda, onPress }: VendaCardProps) {
  const cor = corDoStatus(venda.status);

  return (
    <Pressable
      className="mb-3 flex-row items-center rounded-2xl border border-salamandra-border bg-salamandra-card p-4 active:opacity-80"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Venda para ${venda.cliente}`}
    >
      {/* ÍCONE */}

      <View className="mr-3 h-12 w-12 items-center justify-center rounded-[14px] bg-salamandra-surface">
        <Ionicons
          name="receipt-outline"
          size={23}
          color={cor}
        />
      </View>

      {/* DADOS */}

      <View className="flex-1">
        <Text
          className="text-sm font-bold text-salamandra-textSecondary"
          numberOfLines={1}
        >
          {venda.cliente}
        </Text>

        <Text className="mt-1 text-xs text-salamandra-muted">
          {formatarDataHora(venda.data)}
        </Text>

        <Text className="mt-1 text-[11px] text-salamandra-subtle">
          {venda.quantidadeItens}{' '}
          {venda.quantidadeItens === 1 ? 'item' : 'itens'}
          {venda.vendedor ? ` · por ${venda.vendedor}` : ''}
        </Text>
      </View>

      {/* VALOR / STATUS */}

      <View className="ml-3 items-end">
        <Text className="text-sm font-bold text-salamandra-text">
          {formatarMoedaBRL(venda.valorTotal)}
        </Text>

        <Text
          className="mt-1 text-[10px] font-semibold"
          style={{ color: cor }}
        >
          {venda.status}
        </Text>
      </View>
    </Pressable>
  );
}
