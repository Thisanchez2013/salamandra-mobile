import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/ui/AppHeader';
import { ErrorState, LoadingState } from '../components/ui/EstadosTela';
import { FormInput } from '../components/ui/FormInput';
import { COLORS } from '../constants/theme';
import { useSalvarProduto } from '../hooks/useProduto';
import { useProdutoForm } from '../hooks/useProdutoForm';
import { buscarProdutoPorId } from '../services/produtoService';
import { mascararMoeda } from '../utils/currency';

export default function ProdutoFormularioScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = Boolean(id);

  const [carregandoProduto, setCarregandoProduto] = useState(editando);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  const { formData, errors, updateField, preencherForm, validar } =
    useProdutoForm();
  const { salvar, salvando, erro } = useSalvarProduto();

  // ==================================================
  // CARREGA O PRODUTO (MODO EDIÇÃO)
  // ==================================================

  const carregarProduto = useCallback(async () => {
    if (!id) return;

    try {
      setCarregandoProduto(true);
      setErroBusca(null);

      const dados = await buscarProdutoPorId(id);

      if (!dados) {
        setErroBusca('O produto não foi encontrado.');
        return;
      }

      preencherForm({
        codigo: String(dados.produto.codigo),
        nome: dados.produto.nome,
        descricao: dados.produto.descricao ?? '',
        precoVenda: dados.produto.preco_venda.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
        }),
      });
    } catch (error) {
      console.log('Erro ao carregar produto para edição:', error);
      setErroBusca('Não foi possível carregar os dados deste produto.');
    } finally {
      setCarregandoProduto(false);
    }
  }, [id, preencherForm]);

  useEffect(() => {
    if (id) void carregarProduto();
  }, [id, carregarProduto]);

  // ==================================================
  // SALVAR
  // ==================================================

  async function handleSubmit() {
    if (!validar() || salvando || carregandoProduto || erroBusca) return;

    if (await salvar(formData, id)) {
      router.back();
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AppHeader
          title={editando ? 'Editar produto' : 'Novo produto'}
          subtitle={
            editando ? 'Atualize os dados do produto' : 'Cadastre um produto'
          }
          onBack={() => router.back()}
        />

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-[22px] pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {carregandoProduto ? (
            <LoadingState mensagem="Carregando produto..." />
          ) : erroBusca ? (
            <ErrorState
              mensagem={erroBusca}
              onRetry={() => void carregarProduto()}
            />
          ) : (
            <>
              <View className="mb-4 mt-6">
                <Text className="text-base font-bold text-salamandra-text">
                  Dados do produto
                </Text>

                <Text className="mt-1 text-xs text-salamandra-muted">
                  O saldo de estoque é calculado pelos lotes.
                </Text>
              </View>

              <FormInput
                label="Código"
                required
                placeholder="Ex.: 1001"
                value={formData.codigo}
                onChangeText={(value) =>
                  updateField('codigo', value.replace(/\D/g, ''))
                }
                error={errors.codigo}
                keyboardType="number-pad"
              />

              <FormInput
                label="Nome"
                required
                placeholder="Nome do produto"
                value={formData.nome}
                onChangeText={(value) => updateField('nome', value)}
                error={errors.nome}
                autoCapitalize="sentences"
                maxLength={120}
              />

              <FormInput
                label="Descrição"
                placeholder="Descrição opcional"
                value={formData.descricao}
                onChangeText={(value) => updateField('descricao', value)}
                multiline
                numberOfLines={3}
                style={{ height: 90, paddingTop: 14 }}
              />

              <FormInput
                label="Preço de venda (R$)"
                required
                placeholder="0,00"
                value={formData.precoVenda}
                onChangeText={(value) =>
                  updateField('precoVenda', mascararMoeda(value))
                }
                error={errors.precoVenda}
                keyboardType="decimal-pad"
              />

              {/* AVISO */}

              <View className="mt-1 flex-row rounded-[14px] border border-salamandra-border bg-salamandra-card p-4">
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={COLORS.gold}
                />

                <Text className="ml-3 flex-1 text-xs leading-5 text-salamandra-muted">
                  Uma nova entrada deve ser registrada separadamente para
                  preservar a quantidade e o custo de cada lote.
                </Text>
              </View>

              {/* ERRO AO SALVAR */}

              {erro ? (
                <View className="mt-4 flex-row rounded-[14px] border border-salamandra-errorBorder bg-salamandra-card p-4">
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color={COLORS.error}
                  />

                  <Text className="ml-3 flex-1 text-xs leading-5 text-salamandra-error">
                    {erro}
                  </Text>
                </View>
              ) : null}

              {/* BOTÃO SALVAR */}

              <Pressable
                className={`mt-6 h-[54px] flex-row items-center justify-center rounded-[14px] bg-salamandra-gold ${
                  salvando ? 'opacity-60' : 'active:opacity-80'
                }`}
                onPress={() => void handleSubmit()}
                disabled={salvando}
                accessibilityRole="button"
                accessibilityLabel={
                  editando ? 'Atualizar produto' : 'Salvar produto'
                }
              >
                <Ionicons
                  name="checkmark-outline"
                  size={21}
                  color={COLORS.background}
                />

                <Text className="ml-2 text-sm font-extrabold text-salamandra-background">
                  {salvando
                    ? 'SALVANDO...'
                    : editando
                      ? 'ATUALIZAR PRODUTO'
                      : 'SALVAR PRODUTO'}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
