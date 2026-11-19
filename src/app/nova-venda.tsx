import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/ui/AppHeader';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/ui/EstadosTela';
import { SearchInput } from '../components/ui/SearchInput';
import { COLORS } from '../constants/theme';
import { useNovaVenda } from '../hooks/useNovaVenda';
import { Produto } from '../types/produto';
import { formatarMoedaBRL } from '../utils/currency';

const MAX_RESULTADOS = 6;

function TituloSecao({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
  return (
    <View className="mb-3 mt-7">
      <Text className="text-base font-bold text-salamandra-text">{titulo}</Text>
      {subtitulo ? (
        <Text className="mt-1 text-xs text-salamandra-muted">{subtitulo}</Text>
      ) : null}
    </View>
  );
}

// ==================================================
// BOTÕES - / +
// ==================================================

function Contador({
  quantidade,
  maximo,
  onMenos,
  onMais,
}: {
  quantidade: number;
  maximo: number;
  onMenos: () => void;
  onMais: () => void;
}) {
  const podeAumentar = quantidade < maximo;

  return (
    <View className="flex-row items-center">
      {quantidade > 0 ? (
        <>
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-[10px] bg-salamandra-surface active:opacity-70"
            onPress={onMenos}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Diminuir quantidade"
          >
            <Ionicons name="remove" size={18} color={COLORS.gold} />
          </Pressable>

          <Text className="w-9 text-center text-sm font-bold text-salamandra-text">
            {quantidade}
          </Text>
        </>
      ) : null}

      <Pressable
        className={`h-9 w-9 items-center justify-center rounded-[10px] ${
          podeAumentar ? 'bg-salamandra-gold active:opacity-80' : 'bg-salamandra-surface'
        }`}
        onPress={onMais}
        disabled={!podeAumentar}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Aumentar quantidade"
      >
        <Ionicons
          name="add"
          size={18}
          color={podeAumentar ? COLORS.background : COLORS.disabled}
        />
      </Pressable>
    </View>
  );
}

// ==================================================
// TELA
// ==================================================

export default function NovaVendaScreen() {
  const router = useRouter();

  const {
    clientes,
    produtos,
    carregando,
    erroCarga,
    carregar,
    cliente,
    setCliente,
    carrinho,
    quantidadeNoCarrinho,
    alterarQuantidade,
    observacao,
    setObservacao,
    total,
    salvando,
    erro,
    finalizar,
  } = useNovaVenda();

  const [buscaCliente, setBuscaCliente] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');

  const clientesEncontrados = useMemo(() => {
    const termo = buscaCliente.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return [];
    const termoCpf = termo.replace(/\D/g, '');
    return clientes
      .filter(
        (c) =>
          c.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
          (termoCpf.length > 0 && (c.cpf ?? '').includes(termoCpf))
      )
      .slice(0, MAX_RESULTADOS);
  }, [clientes, buscaCliente]);

  const produtosEncontrados = useMemo(() => {
    const termo = buscaProduto.trim().toLocaleLowerCase('pt-BR');
    const lista = termo
      ? produtos.filter(
          (p) =>
            p.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
            String(p.codigo).includes(termo)
        )
      : produtos.filter((p) => p.quantidadeDisponivel > 0);
    return lista.slice(0, MAX_RESULTADOS);
  }, [produtos, buscaProduto]);

  async function handleFinalizar() {
    const idVenda = await finalizar();
    if (idVenda) {
      router.replace({ pathname: '/venda/[id]', params: { id: idVenda } });
    }
  }

  function linhaProduto(produto: Produto, index: number) {
    const quantidade = quantidadeNoCarrinho(produto.id);
    const semEstoque = produto.quantidadeDisponivel <= 0;

    return (
      <View
        key={produto.id}
        className={`flex-row items-center px-4 py-3 ${
          index > 0 ? 'border-t border-salamandra-border' : ''
        }`}
      >
        <View className="mr-3 flex-1">
          <Text
            className="text-sm font-bold text-salamandra-textSecondary"
            numberOfLines={1}
          >
            {produto.nome}
          </Text>
          <Text
            className={`mt-0.5 text-[11px] ${
              semEstoque ? 'text-salamandra-error' : 'text-salamandra-subtle'
            }`}
          >
            {formatarMoedaBRL(produto.preco_venda)} ·{' '}
            {semEstoque ? 'Sem estoque' : `${produto.quantidadeDisponivel} em estoque`}
          </Text>
        </View>

        <Contador
          quantidade={quantidade}
          maximo={produto.quantidadeDisponivel}
          onMenos={() => alterarQuantidade(produto, -1)}
          onMais={() => alterarQuantidade(produto, 1)}
        />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AppHeader
          title="Nova venda"
          subtitle="Baixa automática do estoque (FIFO)"
          onBack={() => router.back()}
        />

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-[22px] pb-10"
          keyboardShouldPersistTaps="handled"
        >
          {carregando ? (
            <LoadingState mensagem="Carregando clientes e produtos..." />
          ) : erroCarga ? (
            <ErrorState mensagem={erroCarga} onRetry={() => void carregar()} />
          ) : (
            <>
              {/* ==================== CLIENTE ==================== */}

              <TituloSecao titulo="Cliente" />

              {cliente ? (
                <View className="flex-row items-center rounded-2xl border border-salamandra-gold bg-salamandra-card p-4">
                  <Ionicons name="person-circle-outline" size={26} color={COLORS.gold} />
                  <Text
                    className="ml-3 flex-1 text-sm font-bold text-salamandra-text"
                    numberOfLines={1}
                  >
                    {cliente.nome}
                  </Text>
                  <Pressable
                    onPress={() => setCliente(null)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Trocar cliente"
                  >
                    <Text className="text-xs font-bold text-salamandra-gold">TROCAR</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View className="-mt-5">
                    <SearchInput
                      value={buscaCliente}
                      onChangeText={setBuscaCliente}
                      placeholder="Buscar cliente por nome ou CPF"
                    />
                  </View>

                  {clientesEncontrados.length > 0 ? (
                    <View className="mt-2 rounded-2xl border border-salamandra-border bg-salamandra-card">
                      {clientesEncontrados.map((c, index) => (
                        <Pressable
                          key={c.id}
                          className={`px-4 py-3.5 active:opacity-70 ${
                            index > 0 ? 'border-t border-salamandra-border' : ''
                          }`}
                          onPress={() => {
                            setCliente(c);
                            setBuscaCliente('');
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Escolher ${c.nome}`}
                        >
                          <Text className="text-sm text-salamandra-textSecondary">{c.nome}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : buscaCliente.trim() ? (
                    <Text className="mt-2 text-xs text-salamandra-muted">
                      Nenhum cliente encontrado.
                    </Text>
                  ) : null}
                </>
              )}

              {/* ==================== PRODUTOS ==================== */}

              <TituloSecao
                titulo="Produtos"
                subtitulo="Toque em + para adicionar ao carrinho"
              />

              <View className="-mt-5">
                <SearchInput
                  value={buscaProduto}
                  onChangeText={setBuscaProduto}
                  placeholder="Buscar produto por nome ou código"
                />
              </View>

              {produtosEncontrados.length === 0 ? (
                <View className="mt-3">
                  <EmptyState
                    icon="cube-outline"
                    titulo="Nenhum produto encontrado"
                  />
                </View>
              ) : (
                <View className="mt-3 rounded-2xl border border-salamandra-border bg-salamandra-card">
                  {produtosEncontrados.map(linhaProduto)}
                </View>
              )}

              {/* ==================== CARRINHO ==================== */}

              <TituloSecao titulo="Carrinho" />

              {carrinho.length === 0 ? (
                <EmptyState
                  icon="cart-outline"
                  titulo="Carrinho vazio"
                  descricao="Os produtos adicionados aparecem aqui."
                />
              ) : (
                <View className="rounded-2xl border border-salamandra-border bg-salamandra-card">
                  {carrinho.map((item, index) => (
                    <View
                      key={item.produto.id}
                      className={`flex-row items-center px-4 py-3 ${
                        index > 0 ? 'border-t border-salamandra-border' : ''
                      }`}
                    >
                      <View className="mr-3 flex-1">
                        <Text
                          className="text-sm font-bold text-salamandra-textSecondary"
                          numberOfLines={1}
                        >
                          {item.produto.nome}
                        </Text>
                        <Text className="mt-0.5 text-[11px] text-salamandra-subtle">
                          {item.quantidade} × {formatarMoedaBRL(item.produto.preco_venda)} ={' '}
                          {formatarMoedaBRL(item.quantidade * item.produto.preco_venda)}
                        </Text>
                      </View>

                      <Contador
                        quantidade={item.quantidade}
                        maximo={item.produto.quantidadeDisponivel}
                        onMenos={() => alterarQuantidade(item.produto, -1)}
                        onMais={() => alterarQuantidade(item.produto, 1)}
                      />
                    </View>
                  ))}
                </View>
              )}

              {/* ==================== OBSERVAÇÃO ==================== */}

              <TituloSecao titulo="Observação" subtitulo="Opcional" />

              <TextInput
                className="min-h-[80px] rounded-[14px] border border-salamandra-border bg-salamandra-card px-4 py-3 text-sm text-salamandra-text"
                placeholder="Ex.: pagamento no PIX"
                placeholderTextColor={COLORS.subtle}
                selectionColor={COLORS.gold}
                value={observacao}
                onChangeText={setObservacao}
                multiline
                textAlignVertical="top"
                maxLength={300}
              />

              {/* ==================== TOTAL ==================== */}

              <View className="mt-6 flex-row items-center rounded-[18px] border border-salamandra-border bg-salamandra-card p-5">
                <Text className="flex-1 text-[11px] font-bold tracking-[1.2px] text-salamandra-muted">
                  TOTAL DA VENDA
                </Text>
                <Text className="text-2xl font-extrabold text-salamandra-gold">
                  {formatarMoedaBRL(total)}
                </Text>
              </View>

              {erro ? (
                <View className="mt-4 flex-row rounded-[14px] border border-salamandra-errorBorder bg-salamandra-card p-4">
                  <Ionicons name="alert-circle-outline" size={20} color={COLORS.error} />
                  <Text className="ml-3 flex-1 text-xs leading-5 text-salamandra-error">
                    {erro}
                  </Text>
                </View>
              ) : null}

              <Pressable
                className={`mt-6 h-[54px] flex-row items-center justify-center rounded-[14px] bg-salamandra-gold ${
                  salvando ? 'opacity-60' : 'active:opacity-80'
                }`}
                onPress={() => void handleFinalizar()}
                disabled={salvando}
                accessibilityRole="button"
                accessibilityLabel="Finalizar venda"
              >
                <Ionicons name="checkmark-circle-outline" size={21} color={COLORS.background} />
                <Text className="ml-2 text-sm font-extrabold text-salamandra-background">
                  {salvando ? 'REGISTRANDO...' : 'FINALIZAR VENDA'}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
