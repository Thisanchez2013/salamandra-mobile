import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProdutoCard } from '../components/produtos/ProdutoCard';
import { AppHeader } from '../components/ui/AppHeader';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/ui/EstadosTela';
import { SearchInput } from '../components/ui/SearchInput';
import { COLORS } from '../constants/theme';
import { usePermissoes } from '../hooks/usePermissoes';
import { useProdutos } from '../hooks/useProdutos';

export default function ProdutosScreen() {
  const router = useRouter();
  const { podeGerenciarProdutos } = usePermissoes();

  const {
    produtos,
    produtosFiltrados,
    pesquisa,
    setPesquisa,
    carregando,
    atualizando,
    erro,
    atualizar,
    carregarProdutos,
  } = useProdutos();

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <AppHeader
        title="Produtos e estoque"
        subtitle="Catálogo e saldo por lotes"
        onBack={() => router.back()}
        actionIcon={podeGerenciarProdutos ? 'add' : undefined}
        actionLabel="Novo produto"
        onActionPress={() => router.push('/produto-formulario')}
      />

      <ScrollView
        className="flex-1 px-[22px]"
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
      >
        <SearchInput
          value={pesquisa}
          onChangeText={setPesquisa}
          placeholder="Buscar por nome ou código"
        />

        {/* ==================================================
                            TÍTULO DA LISTA
           ================================================== */}

        <View className="mb-3 mt-7 flex-row items-center justify-between">
          <Text className="text-base font-bold text-salamandra-text">
            Produtos cadastrados
          </Text>

          <Text className="text-xs text-salamandra-muted">
            {produtosFiltrados.length}{' '}
            {produtosFiltrados.length === 1 ? 'produto' : 'produtos'}
          </Text>
        </View>

        {/* ==================================================
                                LISTA
           ================================================== */}

        {carregando ? (
          <LoadingState mensagem="Carregando produtos..." />
        ) : erro ? (
          <ErrorState
            mensagem={erro}
            onRetry={() => void carregarProdutos()}
          />
        ) : produtos.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            titulo="Nenhum produto cadastrado"
            descricao="Cadastre um produto para começar a controlar o estoque."
            acao={
              podeGerenciarProdutos
                ? {
                    icon: 'add',
                    rotulo: 'Novo produto',
                    onPress: () => router.push('/produto-formulario'),
                  }
                : undefined
            }
          />
        ) : produtosFiltrados.length === 0 ? (
          <EmptyState
            icon="search-outline"
            titulo="Nenhum resultado encontrado"
            descricao="Tente pesquisar por outro nome ou código."
          />
        ) : (
          produtosFiltrados.map((produto) => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              onPress={() =>
                router.push({
                  pathname: '/produto/[id]',
                  params: { id: produto.id },
                })
              }
            />
          ))
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
