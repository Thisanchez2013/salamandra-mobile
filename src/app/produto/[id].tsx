import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../../components/ui/AppHeader';
import { BotaoExcluir } from '../../components/ui/BotaoExcluir';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/ui/EstadosTela';
import { COLORS } from '../../constants/theme';
import { usePermissoes } from '../../hooks/usePermissoes';
import {
  buscarProdutoPorId,
  excluirProduto,
} from '../../services/produtoService';
import { LoteProduto, Produto } from '../../types/produto';
import { formatarMoedaBRL } from '../../utils/currency';
import { mensagemErroExclusao } from '../../utils/erros';

function formatarDataHora(valor: string) {
  return new Date(valor).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function ProdutoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { podeGerenciarProdutos, podeExcluir } = usePermissoes();

  const [produto, setProduto] = useState<Produto | null>(null);
  const [lotes, setLotes] = useState<LoteProduto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ==================================================
  // CARREGAMENTO
  // ==================================================

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await buscarProdutoPorId(id);

      setProduto(dados?.produto ?? null);
      setLotes(dados?.lotes ?? []);
    } catch (error) {
      console.log('Erro ao carregar produto:', error);
      setErro(
        'Não foi possível carregar este produto. Verifique sua conexão e as permissões de acesso.'
      );
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <AppHeader
        title="Detalhes do produto"
        subtitle={produto?.nome ?? 'Produto e lotes'}
        onBack={() => router.back()}
        actionIcon={podeGerenciarProdutos ? 'create-outline' : undefined}
        actionLabel="Editar produto"
        onActionPress={() =>
          router.push({
            pathname: '/produto-formulario',
            params: { id },
          })
        }
      />

      <ScrollView
        className="flex-1 px-[22px]"
        showsVerticalScrollIndicator={false}
      >
        {carregando ? (
          <LoadingState mensagem="Carregando produto..." />
        ) : erro ? (
          <ErrorState
            mensagem={erro}
            onRetry={() => void carregar()}
          />
        ) : !produto ? (
          <View className="mt-6">
            <EmptyState
              icon="cube-outline"
              titulo="Produto não encontrado"
            />
          </View>
        ) : (
          <>

            {/* ==================================================
                              DADOS DO PRODUTO
               ================================================== */}

            <View className="mt-5 rounded-2xl border border-salamandra-border bg-salamandra-card p-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-salamandra-muted">
                  Código {produto.codigo}
                </Text>

                <Text className="text-sm font-bold text-salamandra-gold">
                  {formatarMoedaBRL(produto.preco_venda)}
                </Text>
              </View>

              <Text className="mt-3 text-xl font-bold text-salamandra-text">
                {produto.nome}
              </Text>

              {produto.descricao ? (
                <Text className="mt-2 text-sm leading-5 text-salamandra-muted">
                  {produto.descricao}
                </Text>
              ) : null}

              <View className="mt-5 rounded-xl bg-salamandra-surface p-4">
                <Text className="text-xs text-salamandra-muted">
                  SALDO DISPONÍVEL
                </Text>

                <Text className="mt-1 text-2xl font-extrabold text-salamandra-text">
                  {produto.quantidadeDisponivel} un.
                </Text>
              </View>

              {podeGerenciarProdutos ? (
                <Pressable
                  className="mt-4 h-[50px] flex-row items-center justify-center rounded-xl bg-salamandra-gold active:opacity-80"
                  onPress={() =>
                    router.push({
                      pathname: '/entrada-estoque',
                      params: { produtoId: produto.id },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Registrar entrada de estoque"
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={COLORS.background}
                  />

                  <Text className="ml-2 text-sm font-extrabold text-salamandra-background">
                    REGISTRAR ENTRADA
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {/* ==================================================
                              HISTÓRICO DE LOTES
               ================================================== */}

            <View className="mb-3 mt-7 flex-row items-center justify-between">
              <Text className="text-base font-bold text-salamandra-text">
                Histórico de lotes
              </Text>

              <Text className="text-xs text-salamandra-muted">
                Ordem FIFO
              </Text>
            </View>

            {lotes.length === 0 ? (
              <EmptyState
                icon="file-tray-outline"
                titulo="Nenhuma entrada registrada"
                descricao="As novas entradas aparecerão separadas por lote."
              />
            ) : (
              lotes.map((lote) => (
                <View
                  key={lote.id}
                  className="mb-3 rounded-2xl border border-salamandra-border bg-salamandra-card p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-salamandra-text">
                      Lote {lote.codigo_lote}
                    </Text>

                    <Text className="text-xs text-salamandra-muted">
                      {formatarDataHora(lote.data_entrada)}
                    </Text>
                  </View>

                  <View className="mt-3 flex-row justify-between">
                    <Text className="text-xs text-salamandra-muted">
                      {lote.quantidade}{' '}
                      {lote.quantidade === 1 ? 'unidade' : 'unidades'}{' '}
                      restantes
                    </Text>

                    <Text className="text-xs text-salamandra-gold">
                      Custo unitário{' '}
                      {formatarMoedaBRL(Number(lote.custo_unitario))}
                    </Text>
                  </View>
                </View>
              ))
            )}

            {podeExcluir ? (
              <View className="mt-4">
                <BotaoExcluir
                  entidade="produto"
                  nome={produto.nome}
                  onExcluir={async () => {
                    try {
                      await excluirProduto(produto.id, produto.nome);
                      return null;
                    } catch (error) {
                      console.log('Erro ao excluir produto:', error);
                      return mensagemErroExclusao(
                        error,
                        'Este produto possui lotes de estoque ou vendas registradas e não pode ser excluído.'
                      );
                    }
                  }}
                  onExcluido={() => router.back()}
                />
              </View>
            ) : null}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
