import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { situacaoEstoque } from '../../constants/estoque';
import { COLORS } from '../../constants/theme';
import { Produto } from '../../types/produto';
import { formatarMoedaBRL } from '../../utils/currency';

interface ProdutoCardProps {
  produto: Produto;
  onPress: () => void;
}

export function ProdutoCard({ produto, onPress }: ProdutoCardProps) {
  const quantidade = produto.quantidadeDisponivel;
  const situacao = situacaoEstoque(quantidade);
  const alerta = situacao !== 'normal';

  const textoEstoque =
    situacao === 'sem-estoque'
      ? 'Sem estoque'
      : `${quantidade} ${quantidade === 1 ? 'unidade' : 'unidades'} disponíveis${
          situacao === 'baixo' ? ' · Estoque baixo' : ''
        }`;

  return (
    <Pressable
      className="mb-3 flex-row items-center rounded-2xl border border-salamandra-border bg-salamandra-card p-4 active:opacity-80"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Produto ${produto.nome}`}
    >
      <View className="mr-3 h-12 w-12 items-center justify-center rounded-[14px] bg-salamandra-surface">
        <Ionicons
          name="cube-outline"
          size={23}
          color={alerta ? COLORS.error : COLORS.gold}
        />
      </View>

      <View className="flex-1">
        <Text
          className="text-sm font-bold text-salamandra-textSecondary"
          numberOfLines={1}
        >
          {produto.nome}
        </Text>

        <Text className="mt-1 text-xs text-salamandra-muted">
          Código {produto.codigo} · {formatarMoedaBRL(produto.preco_venda)}
        </Text>

        <Text
          className="mt-1 text-xs"
          style={{ color: alerta ? COLORS.error : COLORS.muted }}
        >
          {textoEstoque}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={COLORS.subtle}
      />
    </Pressable>
  );
}
