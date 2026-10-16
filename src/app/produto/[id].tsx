import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../../components/ui/AppHeader';
import { COLORS } from '../../constants/theme';
import { buscarProdutoPorId } from '../../services/produtoService';
import { formatarMoedaBRL } from '../../utils/currency';
import { LoteProduto, Produto } from '../../types/produto';

export default function ProdutoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [lotes, setLotes] = useState<LoteProduto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true); setErro(null);
      const dados = await buscarProdutoPorId(id);
      setProduto(dados?.produto ?? null); setLotes(dados?.lotes ?? []);
    } catch (error) {
      console.log('Erro ao carregar produto:', error);
      setErro('Não foi possível carregar este produto. Verifique sua conexão e as permissões de acesso.');
    } finally { setCarregando(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));
  const data = (valor: string) => new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <AppHeader title="Detalhes do produto" subtitle={produto?.nome ?? 'Produto e lotes'} onBack={() => router.back()} actionIcon="create-outline" onActionPress={() => router.push({ pathname: '/produto-formulario', params: { id } })} />
      <ScrollView className="flex-1 px-[22px]" showsVerticalScrollIndicator={false}>
        {carregando ? <View className="items-center py-12"><ActivityIndicator color={COLORS.gold} /><Text className="mt-3 text-xs text-salamandra-muted">Carregando produto...</Text></View> : erro ? (
          <View className="mt-6 items-center rounded-2xl border border-salamandra-border bg-salamandra-card px-5 py-10"><Ionicons name="alert-circle-outline" size={30} color={COLORS.error} /><Text className="mt-3 text-center text-xs text-salamandra-muted">{erro}</Text><Pressable className="mt-5 rounded-xl bg-salamandra-gold px-5 py-3" onPress={() => void carregar()}><Text className="text-xs font-extrabold text-salamandra-background">TENTAR NOVAMENTE</Text></Pressable></View>
        ) : !produto ? <View className="mt-6 items-center rounded-2xl border border-salamandra-border bg-salamandra-card px-5 py-10"><Text className="text-sm text-salamandra-text">Produto não encontrado.</Text></View> : <>
          <View className="mt-5 rounded-2xl border border-salamandra-border bg-salamandra-card p-5">
            <View className="flex-row items-center justify-between"><Text className="text-xs text-salamandra-muted">Código {produto.codigo}</Text><Text className="text-sm font-bold text-salamandra-gold">{formatarMoedaBRL(produto.preco_venda)}</Text></View>
            <Text className="mt-3 text-xl font-bold text-salamandra-text">{produto.nome}</Text>
            {produto.descricao ? <Text className="mt-2 text-sm leading-5 text-salamandra-muted">{produto.descricao}</Text> : null}
            <View className="mt-5 rounded-xl bg-salamandra-surface p-4"><Text className="text-xs text-salamandra-muted">SALDO DISPONÍVEL</Text><Text className="mt-1 text-2xl font-extrabold text-salamandra-text">{produto.quantidadeDisponivel} un.</Text></View>
            <Pressable className="mt-4 h-[50px] flex-row items-center justify-center rounded-xl bg-salamandra-gold" onPress={() => router.push({ pathname: '/entrada-estoque', params: { produtoId: produto.id } })}><Ionicons name="add-circle-outline" size={20} color={COLORS.background} /><Text className="ml-2 text-sm font-extrabold text-salamandra-background">REGISTRAR ENTRADA</Text></Pressable>
          </View>
          <View className="mb-3 mt-7 flex-row items-center justify-between"><Text className="text-base font-bold text-salamandra-text">Histórico de lotes</Text><Text className="text-xs text-salamandra-muted">Ordem FIFO</Text></View>
          {lotes.length === 0 ? <View className="items-center rounded-2xl border border-salamandra-border bg-salamandra-card px-5 py-8"><Text className="text-sm text-salamandra-textSoft">Nenhuma entrada registrada</Text><Text className="mt-2 text-center text-xs text-salamandra-muted">As novas entradas aparecerão separadas por lote.</Text></View> : lotes.map((lote) => <View key={lote.id} className="mb-3 rounded-2xl border border-salamandra-border bg-salamandra-card p-4"><View className="flex-row items-center justify-between"><Text className="font-bold text-salamandra-text">Lote {lote.codigo_lote}</Text><Text className="text-xs text-salamandra-muted">{data(lote.data_entrada)}</Text></View><View className="mt-3 flex-row justify-between"><Text className="text-xs text-salamandra-muted">{lote.quantidade} {lote.quantidade === 1 ? 'unidade' : 'unidades'} restantes</Text><Text className="text-xs text-salamandra-gold">Custo unitário {formatarMoedaBRL(Number(lote.custo_unitario))}</Text></View></View>)}
        </>}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
