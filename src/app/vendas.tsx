import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/ui/AppHeader';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/ui/EstadosTela';
import { FiltroChips, OpcaoChip } from '../components/ui/FiltroChips';
import { SearchInput } from '../components/ui/SearchInput';
import { VendaCard } from '../components/vendas/VendaCard';
import { COLORS } from '../constants/theme';
import { useVendas } from '../hooks/useVendas';
import { PeriodoVenda } from '../types/venda';
import { formatarMoedaBRL } from '../utils/currency';

const PERIODOS: OpcaoChip<PeriodoVenda>[] = [
  { valor: 'todos', rotulo: 'Todas' },
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: '7dias', rotulo: '7 dias' },
  { valor: '30dias', rotulo: '30 dias' },
];

export default function VendasScreen() {
  const router = useRouter();

  const {
    vendas,
    vendasFiltradas,
    resumo,
    pesquisa,
    setPesquisa,
    periodo,
    setPeriodo,
    carregando,
    atualizando,
    erro,
    atualizar,
    tentarNovamente,
  } = useVendas();

  const filtrando = pesquisa.trim().length > 0 || periodo !== 'todos';

  // ==================================================
  // CABEÇALHO DA LISTA (busca, filtros e resumo)
  // ==================================================

  const cabecalho = (
    <View>
      <SearchInput
        value={pesquisa}
        onChangeText={setPesquisa}
        placeholder="Buscar por cliente"
      />

      <FiltroChips
        opcoes={PERIODOS}
        selecionado={periodo}
        onChange={setPeriodo}
      />

      {/* RESUMO */}

      <View className="mt-5 flex-row rounded-[18px] border border-salamandra-border bg-salamandra-card p-5">
        <View className="flex-1">
          <Text className="text-[11px] font-bold tracking-[1.2px] text-salamandra-muted">
            TOTAL VENDIDO
          </Text>

          <Text className="mt-2 text-2xl font-extrabold text-salamandra-gold">
            {formatarMoedaBRL(resumo.total)}
          </Text>
        </View>

        <View className="items-end justify-center">
          <Text className="text-[11px] font-bold tracking-[1.2px] text-salamandra-muted">
            CONCLUÍDAS
          </Text>

          <Text className="mt-2 text-2xl font-extrabold text-salamandra-text">
            {resumo.quantidade}
          </Text>
        </View>
      </View>

      {/* TÍTULO DA LISTA */}

      <View className="mb-3 mt-7 flex-row items-center justify-between">
        <Text className="text-base font-bold text-salamandra-text">
          {filtrando ? 'Vendas filtradas' : 'Todas as vendas'}
        </Text>

        <Text className="text-xs text-salamandra-muted">
          {vendasFiltradas.length}{' '}
          {vendasFiltradas.length === 1 ? 'venda' : 'vendas'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <AppHeader
        title="Histórico de vendas"
        subtitle="Vendas realizadas"
        onBack={() => router.back()}
      />

      {carregando ? (
        <LoadingState mensagem="Carregando vendas..." />
      ) : erro ? (
        <View className="px-[22px]">
          <ErrorState
            mensagem={erro}
            onRetry={tentarNovamente}
          />
        </View>
      ) : (
        <FlatList
          className="flex-1"
          contentContainerClassName="px-[22px] pb-8"
          data={vendasFiltradas}
          keyExtractor={(venda) => venda.id}
          ListHeaderComponent={cabecalho}
          ListEmptyComponent={
            vendas.length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                titulo="Nenhuma venda registrada"
                descricao="As vendas realizadas aparecerão aqui."
              />
            ) : (
              <EmptyState
                icon="search-outline"
                titulo="Nenhuma venda encontrada"
                descricao="Tente outro cliente ou outro período."
              />
            )
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={atualizar}
              tintColor={COLORS.gold}
              colors={[COLORS.gold]}
            />
          }
          renderItem={({ item }) => (
            <VendaCard
              venda={item}
              onPress={() =>
                router.push({
                  pathname: '/venda/[id]',
                  params: { id: item.id },
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
