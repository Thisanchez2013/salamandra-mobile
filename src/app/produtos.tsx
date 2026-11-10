import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, Text, View, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

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

  const [permissaoCamera, solicitarPermissao] = useCameraPermissions();
  const [cameraAberta, setCameraAberta] = useState(false);

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

          /* ==================================================
                Função para ler o QRCODE e inserir na busca
           ================================================== */
  async function handleBarCodeScanned({ data }: { data: string }) {
    if (!data) return;
    setPesquisa(data.trim());
    setCameraAberta(false);
  }

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
        
        {/* ENVOLVE O SEARCHINPUT E ADICIONA O BOTÃO AO LADO */}
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <SearchInput
              value={pesquisa}
              onChangeText={setPesquisa}
              placeholder="Buscar por nome ou código"
            />
          </View>

          {/* --- BOTÃO DO LEITOR --- */}
          <Pressable
            className="h-[52px] w-[52px] mt-[18] self-center items-center justify-center rounded-xl bg-salamandra-card border border-salamandra-border active:opacity-70"
            onPress={async () => {
              if (!permissaoCamera?.granted) {
                const res = await solicitarPermissao();
                if (!res.granted) {
                  alert('Precisamos de permissão para usar a câmara.');
                  return;
                }
              }
              setCameraAberta(true);
            }}
          >
            <Ionicons name="barcode-outline" size={24} color={COLORS.gold} />
          </Pressable>

          {/* BOTÃO PARA A TELA DE ETIQUETAS */}
          <Pressable
            className="h-[52px] w-[52px] mt-[18px] self-center items-center justify-center rounded-xl bg-salamandra-card border border-salamandra-border active:opacity-70"
            onPress={() => router.push('/etiquetas' as any)}
          >
            <Ionicons name="print-outline" size={24} color={COLORS.gold} />
          </Pressable>
          {/* --------------------------------- */}
        </View>

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
      {/* MODAL DA CÂMARA PARA BUSCA POR CÓDIGO DE BARRAS */}
      <Modal visible={cameraAberta} animationType="slide" transparent={false}>
        <View className="flex-1 bg-black">
          <CameraView
            style={{ flex: 1, width: '100%', height: '100%' }}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "code128", "ean13", "ean8"],
            }}
            onBarcodeScanned={handleBarCodeScanned}
          >
            <SafeAreaView className="flex-1 justify-between p-6">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-white">
                  Aponte para o código do produto
                </Text>
                <Pressable
                  className="h-10 w-10 items-center justify-center rounded-full bg-black/60"
                  onPress={() => setCameraAberta(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </Pressable>
              </View>

              {/* Mira visual no centro */}
              <View className="self-center h-48 w-72 rounded-2xl border-2 border-dashed border-salamandra-gold opacity-80" />

              <View className="items-center pb-4">
                <Text className="text-xs text-white/75">
                  A lista será filtrada automaticamente ao focar.
                </Text>
              </View>
            </SafeAreaView>
          </CameraView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
