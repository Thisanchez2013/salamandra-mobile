import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/ui/AppHeader';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/ui/EstadosTela';
import { FiltroChips, OpcaoChip } from '../components/ui/FiltroChips';
import { COLORS } from '../constants/theme';
import {
  ItemRanking,
  PeriodoRelatorio,
  useRelatorios,
} from '../hooks/useRelatorios';
import { formatarMoedaBRL } from '../utils/currency';

const PERIODOS: OpcaoChip<PeriodoRelatorio>[] = [
  { valor: '7dias', rotulo: '7 dias' },
  { valor: '30dias', rotulo: '30 dias' },
  { valor: 'mes', rotulo: 'Este mês' },
  { valor: 'todos', rotulo: 'Tudo' },
];

type NomeIcone = keyof typeof Ionicons.glyphMap;

// ==================================================
// CARTÃO DE INDICADOR
// ==================================================

function Indicador({
  icon,
  titulo,
  valor,
  destaque = false,
}: {
  icon: NomeIcone;
  titulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <View className="mb-3 w-[48.5%] rounded-[16px] border border-salamandra-border bg-salamandra-card p-4">
      <View className="h-9 w-9 items-center justify-center rounded-[10px] bg-salamandra-surface">
        <Ionicons
          name={icon}
          size={19}
          color={COLORS.gold}
        />
      </View>

      <Text className="mt-3 text-[11px] font-bold tracking-[1px] text-salamandra-muted">
        {titulo}
      </Text>

      <Text
        className={`mt-1 text-lg font-extrabold ${
          destaque ? 'text-salamandra-gold' : 'text-salamandra-text'
        }`}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {valor}
      </Text>
    </View>
  );
}

// ==================================================
// TÍTULO DE SEÇÃO
// ==================================================

function TituloSecao({
  titulo,
  subtitulo,
}: {
  titulo: string;
  subtitulo: string;
}) {
  return (
    <View className="mb-3 mt-7">
      <Text className="text-lg font-bold text-salamandra-text">
        {titulo}
      </Text>

      <Text className="mt-1 text-xs text-salamandra-subtle">
        {subtitulo}
      </Text>
    </View>
  );
}

// ==================================================
// RANKING COM BARRAS
// ==================================================

function Ranking({
  itens,
  descricao,
}: {
  itens: ItemRanking[];
  descricao: (item: ItemRanking) => string;
}) {
  const maior = Math.max(...itens.map((item) => item.valor), 1);

  return (
    <View className="rounded-2xl border border-salamandra-border bg-salamandra-card p-4">
      {itens.map((item, index) => (
        <View
          key={item.nome}
          className={index > 0 ? 'mt-4' : ''}
        >
          <View className="flex-row items-center justify-between">
            <Text
              className="mr-3 flex-1 text-sm font-bold text-salamandra-textSecondary"
              numberOfLines={1}
            >
              {index + 1}. {item.nome}
            </Text>

            <Text className="text-sm font-bold text-salamandra-text">
              {formatarMoedaBRL(item.valor)}
            </Text>
          </View>

          <View className="mt-2 h-2 overflow-hidden rounded-full bg-salamandra-surface">
            <View
              className="h-full rounded-full bg-salamandra-gold"
              style={{ width: `${(item.valor / maior) * 100}%` }}
            />
          </View>

          <Text className="mt-1.5 text-[11px] text-salamandra-subtle">
            {descricao(item)}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ==================================================
// TELA
// ==================================================

export default function RelatoriosScreen() {
  const router = useRouter();

  const {
    relatorio,
    periodo,
    setPeriodo,
    carregando,
    atualizando,
    erro,
    atualizar,
    tentarNovamente,
  } = useRelatorios();

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <AppHeader
        title="Relatórios"
        subtitle="Desempenho do negócio"
        onBack={() => router.back()}
      />

      <ScrollView
        className="flex-1 px-[22px]"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizar}
            tintColor={COLORS.gold}
            colors={[COLORS.gold]}
          />
        }
      >
        {carregando ? (
          <LoadingState mensagem="Carregando relatórios..." />
        ) : erro ? (
          <ErrorState
            mensagem={erro}
            onRetry={tentarNovamente}
          />
        ) : (
          <>

            {/* ==================================================
                                  PERÍODO
               ================================================== */}

            <View className="mt-2">
              <FiltroChips
                opcoes={PERIODOS}
                selecionado={periodo}
                onChange={setPeriodo}
              />
            </View>

            {/* ==================================================
                                INDICADORES
               ================================================== */}

            <View className="mt-5 flex-row flex-wrap justify-between">
              <Indicador
                icon="cash-outline"
                titulo="FATURAMENTO"
                valor={formatarMoedaBRL(relatorio.faturamento)}
                destaque
              />

              <Indicador
                icon="receipt-outline"
                titulo="VENDAS"
                valor={String(relatorio.quantidadeVendas)}
              />

              <Indicador
                icon="trending-up-outline"
                titulo="TICKET MÉDIO"
                valor={formatarMoedaBRL(relatorio.ticketMedio)}
              />

              <Indicador
                icon="cube-outline"
                titulo="ITENS VENDIDOS"
                valor={String(relatorio.itensVendidos)}
              />
            </View>

            {relatorio.canceladas > 0 ? (
              <View className="mt-1 flex-row items-center rounded-[14px] border border-salamandra-border bg-salamandra-card p-4">
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color={COLORS.error}
                />

                <Text className="ml-3 flex-1 text-xs leading-5 text-salamandra-muted">
                  {relatorio.canceladas}{' '}
                  {relatorio.canceladas === 1
                    ? 'venda cancelada'
                    : 'vendas canceladas'}{' '}
                  no período (fora dos totais).
                </Text>
              </View>
            ) : null}

            {/* ==================================================
                              MAIS VENDIDOS
               ================================================== */}

            <TituloSecao
              titulo="Produtos mais vendidos"
              subtitulo="Por valor vendido no período"
            />

            {relatorio.maisVendidos.length === 0 ? (
              <EmptyState
                icon="bar-chart-outline"
                titulo="Sem vendas no período"
                descricao="Escolha outro período para ver o ranking."
              />
            ) : (
              <Ranking
                itens={relatorio.maisVendidos}
                descricao={(item) =>
                  `${item.quantidade} ${item.quantidade === 1 ? 'unidade' : 'unidades'}`
                }
              />
            )}

            {/* ==================================================
                            MELHORES CLIENTES
               ================================================== */}

            <TituloSecao
              titulo="Melhores clientes"
              subtitulo="Quem mais comprou no período"
            />

            {relatorio.melhoresClientes.length === 0 ? (
              <EmptyState
                icon="people-outline"
                titulo="Sem compras no período"
              />
            ) : (
              <Ranking
                itens={relatorio.melhoresClientes}
                descricao={(item) =>
                  `${item.quantidade} ${item.quantidade === 1 ? 'compra' : 'compras'}`
                }
              />
            )}

            {/* ==================================================
                              ESTOQUE BAIXO
               ================================================== */}

            <TituloSecao
              titulo="Estoque baixo"
              subtitulo="Produtos com 10 unidades ou menos"
            />

            {relatorio.estoqueBaixo.length === 0 ? (
              <EmptyState
                icon="checkmark-circle-outline"
                titulo="Estoque em dia"
                descricao="Nenhum produto com estoque baixo."
              />
            ) : (
              <View className="rounded-2xl border border-salamandra-border bg-salamandra-card">
                {relatorio.estoqueBaixo.map((produto, index) => (
                  <View
                    key={produto.id}
                    className={`flex-row items-center px-4 py-3.5 ${
                      index > 0 ? 'border-t border-salamandra-border' : ''
                    }`}
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={20}
                      color={COLORS.error}
                    />

                    <Text
                      className="ml-3 flex-1 text-sm text-salamandra-textSecondary"
                      numberOfLines={1}
                    >
                      {produto.nome}
                    </Text>

                    <Text className="text-xs font-bold text-salamandra-error">
                      {produto.quantidadeDisponivel === 0
                        ? 'Sem estoque'
                        : `${produto.quantidadeDisponivel} un.`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
