import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { COLORS } from '../../constants/theme';
import { LIMITE_ESTOQUE_BAIXO } from '../../constants/estoque';
import { Produto } from '../../types/produto';
import { formatarMoedaBRL } from '../../utils/currency';

export function ProdutoCard({ produto, onPress }: { produto: Produto; onPress: () => void }) {
  const semEstoque = produto.quantidadeDisponivel === 0;
  const estoqueBaixo = produto.quantidadeDisponivel > 0 && produto.quantidadeDisponivel <= LIMITE_ESTOQUE_BAIXO;
  return (
    <Pressable className="mb-3 flex-row items-center rounded-2xl border border-salamandra-border bg-salamandra-card p-4 active:opacity-80" onPress={onPress} accessibilityRole="button">
      <View className="mr-3 h-12 w-12 items-center justify-center rounded-[14px] bg-salamandra-surface">
        <Ionicons name="cube-outline" size={23} color={semEstoque || estoqueBaixo ? COLORS.error : COLORS.gold} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-salamandra-textSecondary" numberOfLines={1}>{produto.nome}</Text>
        <Text className="mt-1 text-xs text-salamandra-muted">Código {produto.codigo} · {formatarMoedaBRL(produto.preco_venda)}</Text>
        <Text className="mt-1 text-xs" style={{ color: semEstoque || estoqueBaixo ? COLORS.error : COLORS.muted }}>
          {semEstoque ? 'Sem estoque' : `${produto.quantidadeDisponivel} ${produto.quantidadeDisponivel === 1 ? 'unidade' : 'unidades'} disponíveis${estoqueBaixo ? ' · Estoque baixo' : ''}`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.subtle} />
    </Pressable>
  );
}
