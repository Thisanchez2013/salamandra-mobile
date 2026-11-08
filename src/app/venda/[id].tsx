import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../../components/ui/AppHeader';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/ui/EstadosTela';
import {
  corDoStatus,
  formatarDataHora,
} from '../../components/vendas/VendaCard';
import { COLORS } from '../../constants/theme';
import { buscarVendaPorId } from '../../services/vendaService';
import { VendaDetalhe } from '../../types/venda';
import { formatarMoedaBRL } from '../../utils/currency';

// Linha "rótulo ........ valor" do cartão de informações.
function LinhaInfo({
  icon,
  rotulo,
  valor,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  rotulo: string;
  valor: string;
}) {
  return (
    <View className="mt-3 flex-row items-center">
      <Ionicons
        name={icon}
        size={17}
        color={COLORS.subtle}
      />

      <Text className="ml-2 text-xs text-salamandra-muted">
        {rotulo}
      </Text>

      <Text
        className="ml-3 flex-1 text-right text-xs font-semibold text-salamandra-textSoft"
        numberOfLines={1}
      >
        {valor}
      </Text>
    </View>
  );
}

export default function VendaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [venda, setVenda] = useState<VendaDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      setVenda(await buscarVendaPorId(id));
    } catch (error) {
      console.log('Erro ao carregar venda:', error);
      setErro(
        'Não foi possível carregar esta venda. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const cor = venda ? corDoStatus(venda.status) : COLORS.muted;

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <AppHeader
        title="Detalhes da venda"
        subtitle={venda?.cliente ?? 'Venda'}
        onBack={() => router.back()}
      />

      <ScrollView
        className="flex-1 px-[22px]"
        showsVerticalScrollIndicator={false}
      >
        {carregando ? (
          <LoadingState mensagem="Carregando venda..." />
        ) : erro ? (
          <ErrorState
            mensagem={erro}
            onRetry={carregar}
          />
        ) : !venda ? (
          <View className="mt-6">
            <EmptyState
              icon="receipt-outline"
              titulo="Venda não encontrada"
            />
          </View>
        ) : (
          <>

            {/* ==================================================
                                  RESUMO
               ================================================== */}

            <View className="mt-5 rounded-[18px] border border-salamandra-border bg-salamandra-card p-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] font-bold tracking-[1.2px] text-salamandra-muted">
                  VALOR TOTAL
                </Text>

                <View
                  className="rounded-lg border px-2.5 py-1"
                  style={{ borderColor: cor }}
                >
                  <Text
                    className="text-[10px] font-bold tracking-[0.8px]"
                    style={{ color: cor }}
                  >
                    {venda.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text className="mt-2 text-3xl font-extrabold text-salamandra-gold">
                {formatarMoedaBRL(venda.valorTotal)}
              </Text>

              <View className="mt-4 border-t border-salamandra-border pt-1">
                <LinhaInfo
                  icon="person-outline"
                  rotulo="Cliente"
                  valor={venda.cliente}
                />

                <LinhaInfo
                  icon="calendar-outline"
                  rotulo="Data"
                  valor={formatarDataHora(venda.data)}
                />

                <LinhaInfo
                  icon="id-card-outline"
                  rotulo="Vendedor"
                  valor={venda.vendedor ?? 'Não informado'}
                />
              </View>
            </View>

            {/* ==================================================
                                  ITENS
               ================================================== */}

            <View className="mb-3 mt-7 flex-row items-center justify-between">
              <Text className="text-base font-bold text-salamandra-text">
                Itens da venda
              </Text>

              <Text className="text-xs text-salamandra-muted">
                {venda.itens.length}{' '}
                {venda.itens.length === 1 ? 'item' : 'itens'}
              </Text>
            </View>

            {venda.itens.length === 0 ? (
              <View className="items-center rounded-2xl border border-salamandra-border bg-salamandra-card px-5 py-8">
                <Text className="text-sm text-salamandra-textSoft">
                  Nenhum item nesta venda.
                </Text>
              </View>
            ) : (
              venda.itens.map((item) => (
                <View
                  key={item.id}
                  className="mb-3 rounded-2xl border border-salamandra-border bg-salamandra-card p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="mr-3 flex-1 text-sm font-bold text-salamandra-textSecondary"
                      numberOfLines={1}
                    >
                      {item.produto}
                    </Text>

                    <Text className="text-sm font-bold text-salamandra-text">
                      {formatarMoedaBRL(item.subtotal)}
                    </Text>
                  </View>

                  <Text className="mt-1.5 text-xs text-salamandra-muted">
                    {item.codigoProduto !== null
                      ? `Código ${item.codigoProduto} · `
                      : ''}
                    {item.quantidade} × {formatarMoedaBRL(item.precoUnitario)}
                  </Text>
                </View>
              ))
            )}

            {/* ==================================================
                                OBSERVAÇÃO
               ================================================== */}

            {venda.observacao ? (
              <View className="mt-4 flex-row rounded-[14px] border border-salamandra-border bg-salamandra-card p-4">
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={20}
                  color={COLORS.gold}
                />

                <Text className="ml-3 flex-1 text-xs leading-5 text-salamandra-muted">
                  {venda.observacao}
                </Text>
              </View>
            ) : null}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
