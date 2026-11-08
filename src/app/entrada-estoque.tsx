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
import { useRegistrarEntrada } from '../hooks/useProduto';
import { useEntradaEstoqueForm } from '../hooks/useProdutoForm';
import { buscarProdutoPorId } from '../services/produtoService';
import { Produto } from '../types/produto';
import { mascararMoeda } from '../utils/currency';

export default function EntradaEstoqueScreen() {
  const router = useRouter();
  const { produtoId } = useLocalSearchParams<{ produtoId: string }>();

  const [produto, setProduto] = useState<Produto | null>(null);
  const [carregandoProduto, setCarregandoProduto] = useState(true);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  const { formData, errors, updateField, validar } = useEntradaEstoqueForm();
  const { registrar, salvando, erro } = useRegistrarEntrada(produtoId);

  // ==================================================
  // CARREGA O PRODUTO
  // ==================================================

  const carregarProduto = useCallback(async () => {
    try {
      setCarregandoProduto(true);
      setErroBusca(null);

      const dados = await buscarProdutoPorId(produtoId);

      setProduto(dados?.produto ?? null);

      if (!dados) {
        setErroBusca('O produto não foi encontrado.');
      }
    } catch (error) {
      console.log('Erro ao carregar produto:', error);
      setErroBusca('Não foi possível carregar o produto.');
    } finally {
      setCarregandoProduto(false);
    }
  }, [produtoId]);

  useEffect(() => {
    void carregarProduto();
  }, [carregarProduto]);

  // ==================================================
  // REGISTRAR
  // ==================================================

  async function handleSubmit() {
    if (!validar() || salvando || !produto) return;

    if (await registrar(formData)) {
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
          title="Entrada de estoque"
          subtitle={produto?.nome ?? 'Novo lote'}
          onBack={() => router.back()}
        />

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-[22px] pb-10"
          keyboardShouldPersistTaps="handled"
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

              {/* SALDO ATUAL */}

              <View className="mt-6 rounded-2xl border border-salamandra-border bg-salamandra-card p-4">
                <Text className="text-xs text-salamandra-muted">
                  SALDO ATUAL POR LOTES
                </Text>

                <Text className="mt-1 text-lg font-bold text-salamandra-text">
                  {produto?.quantidadeDisponivel ?? 0} unidades
                </Text>
              </View>

              <View className="mb-4 mt-6">
                <Text className="text-base font-bold text-salamandra-text">
                  Dados da entrada
                </Text>

                <Text className="mt-1 text-xs leading-5 text-salamandra-muted">
                  Esta operação cria um lote separado e mantém seu custo de
                  aquisição.
                </Text>
              </View>

              <FormInput
                label="Código do lote"
                required
                placeholder="Até 5 caracteres"
                value={formData.codigoLote}
                onChangeText={(value) =>
                  updateField('codigoLote', value.slice(0, 5))
                }
                error={errors.codigoLote}
                autoCapitalize="characters"
                maxLength={5}
              />

              <FormInput
                label="Quantidade"
                required
                placeholder="Ex.: 12"
                value={formData.quantidade}
                onChangeText={(value) =>
                  updateField('quantidade', value.replace(/\D/g, ''))
                }
                error={errors.quantidade}
                keyboardType="number-pad"
              />

              <FormInput
                label="Custo unitário (R$)"
                required
                placeholder="0,00"
                value={formData.custoUnitario}
                onChangeText={(value) =>
                  updateField('custoUnitario', mascararMoeda(value))
                }
                error={errors.custoUnitario}
                keyboardType="decimal-pad"
              />

              {/* AVISO */}

              <View className="flex-row rounded-[14px] border border-salamandra-border bg-salamandra-card p-4">
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={COLORS.gold}
                />

                <Text className="ml-3 flex-1 text-xs leading-5 text-salamandra-muted">
                  A data e hora da entrada serão registradas automaticamente
                  pelo banco.
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

              {/* BOTÃO REGISTRAR */}

              <Pressable
                className={`mt-6 h-[54px] flex-row items-center justify-center rounded-[14px] bg-salamandra-gold ${
                  salvando ? 'opacity-60' : 'active:opacity-80'
                }`}
                onPress={() => void handleSubmit()}
                disabled={salvando || !produto}
                accessibilityRole="button"
                accessibilityLabel="Registrar lote"
              >
                <Ionicons
                  name="add-circle-outline"
                  size={21}
                  color={COLORS.background}
                />

                <Text className="ml-2 text-sm font-extrabold text-salamandra-background">
                  {salvando ? 'REGISTRANDO...' : 'REGISTRAR LOTE'}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
