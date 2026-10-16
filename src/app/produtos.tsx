import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProdutoCard } from '../components/produtos/ProdutoCard';
import { AppHeader } from '../components/ui/AppHeader';
import { COLORS } from '../constants/theme';
import { useProdutos } from '../hooks/useProdutos';

export default function ProdutosScreen() {
  const router = useRouter();
  const { produtos, produtosFiltrados, pesquisa, setPesquisa, carregando, erro, carregarProdutos } = useProdutos();
  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <AppHeader title="Produtos e estoque" subtitle="Catálogo e saldo por lotes" onBack={() => router.back()} actionIcon="add" onActionPress={() => router.push('/produto-formulario')} />
      <ScrollView className="flex-1 px-[22px]" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="mt-5 h-[52px] flex-row items-center rounded-[14px] border border-salamandra-border bg-salamandra-card px-4">
          <Ionicons name="search-outline" size={20} color={COLORS.subtle} />
          <TextInput className="ml-3 h-full flex-1 text-sm text-salamandra-text" placeholder="Buscar por nome ou código" placeholderTextColor={COLORS.subtle} value={pesquisa} onChangeText={setPesquisa} autoCapitalize="none" autoCorrect={false} />
          {pesquisa ? <Pressable onPress={() => setPesquisa('')} accessibilityLabel="Limpar pesquisa"><Ionicons name="close-circle" size={20} color={COLORS.subtle} /></Pressable> : null}
        </View>
        <View className="mb-3 mt-7 flex-row items-center justify-between">
          <Text className="text-base font-bold text-salamandra-text">Produtos cadastrados</Text>
          <Text className="text-xs text-salamandra-muted">{produtosFiltrados.length} {produtosFiltrados.length === 1 ? 'produto' : 'produtos'}</Text>
        </View>
        {carregando ? <View className="items-center py-10"><ActivityIndicator color={COLORS.gold} /><Text className="mt-3 text-xs text-salamandra-muted">Carregando produtos...</Text></View> : erro ? (
          <View className="items-center rounded-2xl border border-salamandra-border bg-salamandra-card px-5 py-10"><Ionicons name="alert-circle-outline" size={28} color={COLORS.error} /><Text className="mt-3 text-center text-xs leading-5 text-salamandra-muted">{erro}</Text><Pressable className="mt-5 rounded-xl bg-salamandra-gold px-5 py-3" onPress={() => void carregarProdutos()}><Text className="text-xs font-extrabold text-salamandra-background">TENTAR NOVAMENTE</Text></Pressable></View>
        ) : produtos.length === 0 ? (
          <View className="items-center rounded-2xl border border-salamandra-border bg-salamandra-card px-5 py-10"><Ionicons name="cube-outline" size={28} color={COLORS.subtle} /><Text className="mt-4 text-sm font-bold text-salamandra-textSoft">Nenhum produto cadastrado</Text><Text className="mt-2 text-center text-xs leading-5 text-salamandra-muted">Cadastre um produto para começar a controlar o estoque.</Text><Pressable className="mt-5 rounded-xl bg-salamandra-gold px-5 py-3" onPress={() => router.push('/produto-formulario')}><Text className="text-xs font-extrabold text-salamandra-background">NOVO PRODUTO</Text></Pressable></View>
        ) : produtosFiltrados.length === 0 ? (
          <View className="items-center rounded-2xl border border-salamandra-border bg-salamandra-card px-5 py-10"><Ionicons name="search-outline" size={28} color={COLORS.subtle} /><Text className="mt-4 text-sm font-bold text-salamandra-textSoft">Nenhum resultado encontrado</Text><Text className="mt-2 text-center text-xs leading-5 text-salamandra-muted">Tente pesquisar por outro nome ou código.</Text></View>
        ) : produtosFiltrados.map((produto) => <ProdutoCard key={produto.id} produto={produto} onPress={() => router.push({ pathname: '/produto/[id]', params: { id: produto.id } })} />)}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
