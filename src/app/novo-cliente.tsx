import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/ui/AppHeader';
import { FormInput } from '../components/ui/FormInput';
import { COLORS } from '../constants/theme';
import { useClienteForm } from '../hooks/useClienteForm';
import { useNovoCliente } from '../hooks/useNovoCliente';
import { buscarClientePorId } from '../services/clienteService';
import { maskCEP, maskCPF } from '../utils/masks';

export default function NovoClienteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = Boolean(id);

  const [carregandoCliente, setCarregandoCliente] = useState(editando);
  const [erroBuscaCliente, setErroBuscaCliente] = useState<string | null>(
    null
  );

  const {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
    preencherForm,
  } = useClienteForm();

  const {
    salvarCliente,
    salvando,
    erroCadastro,
  } = useNovoCliente();

  const carregarCliente = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      setCarregandoCliente(true);
      setErroBuscaCliente(null);

      const cliente = await buscarClientePorId(id);

      if (!cliente) {
        setErroBuscaCliente('O cliente não foi encontrado.');
        return;
      }

      preencherForm({
        nome: cliente.nome ?? '',
        cpf: maskCPF(cliente.cpf ?? ''),
        email: cliente.email ?? '',
        rua: cliente.rua ?? '',
        numero: cliente.numero ?? '',
        bairro: cliente.bairro ?? '',
        cidade: cliente.cidade ?? '',
        estado: cliente.estado ?? '',
        cep: maskCEP(cliente.cep ?? ''),
      });
    } catch (error) {
      console.log('Erro ao carregar cliente para edição:', error);
      setErroBuscaCliente(
        'Não foi possível carregar os dados deste cliente. Tente novamente.'
      );
    } finally {
      setCarregandoCliente(false);
    }
  }, [id, preencherForm]);

  useEffect(() => {
    if (id) {
      void carregarCliente();
    } else {
      setCarregandoCliente(false);
      setErroBuscaCliente(null);
      resetForm();
    }
  }, [id, carregarCliente, resetForm]);

  async function handleSubmit() {
    const isValid = validateForm();

    if (!isValid || salvando || carregandoCliente || erroBuscaCliente) {
      return;
    }

    const sucesso = await salvarCliente(formData, id);

    if (!sucesso) {
      return;
    }

    if (!editando) {
      resetForm();
    }

    Alert.alert(
      editando ? 'Cliente atualizado' : 'Cliente cadastrado',
      editando
        ? 'Os dados do cliente foram atualizados com sucesso.'
        : 'O cliente foi cadastrado com sucesso.',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AppHeader
          title={editando ? 'Editar cliente' : 'Novo cliente'}
          subtitle={
            editando
              ? 'Atualize os dados do cliente'
              : 'Cadastre um novo cliente'
          }
          onBack={() => router.back()}
        />

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-[22px] pb-10"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {carregandoCliente ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={COLORS.gold} />
              <Text className="mt-3 text-xs text-salamandra-muted">
                Carregando dados do cliente...
              </Text>
            </View>
          ) : erroBuscaCliente ? (
            <View className="mt-6 items-center rounded-2xl border border-salamandra-border bg-salamandra-card px-5 py-10">
              <Ionicons
                name="alert-circle-outline"
                size={30}
                color={COLORS.error}
              />
              <Text className="mt-3 text-center text-sm text-salamandra-muted">
                {erroBuscaCliente}
              </Text>
              <Pressable
                className="mt-5 rounded-xl bg-salamandra-gold px-5 py-3 active:opacity-80"
                onPress={() => void carregarCliente()}
                accessibilityRole="button"
                accessibilityLabel="Tentar carregar cliente novamente"
              >
                <Text className="text-xs font-extrabold text-salamandra-background">
                  TENTAR NOVAMENTE
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View className="mb-4 mt-6">
                <View className="mb-1 flex-row items-center">
                  <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-salamandra-surface">
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={COLORS.gold}
                    />
                  </View>
                  <Text className="text-base font-bold text-salamandra-text">
                    Dados pessoais
                  </Text>
                </View>
                <Text className="ml-12 text-xs text-salamandra-muted">
                  Informações principais do cliente
                </Text>
              </View>

              <FormInput
                label="Nome completo"
                required
                placeholder="Digite o nome completo"
                value={formData.nome}
                onChangeText={(value) => updateField('nome', value)}
                error={errors.nome}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />

              <FormInput
                label="CPF"
                required
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChangeText={(value) => updateField('cpf', maskCPF(value))}
                error={errors.cpf}
                keyboardType="numeric"
                maxLength={14}
                returnKeyType="next"
              />

              <FormInput
                label="E-mail"
                placeholder="cliente@email.com"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />

              <View className="mb-4 mt-4">
                <View className="mb-1 flex-row items-center">
                  <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-salamandra-surface">
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={COLORS.gold}
                    />
                  </View>
                  <Text className="text-base font-bold text-salamandra-text">
                    Endereço
                  </Text>
                </View>
                <Text className="ml-12 text-xs text-salamandra-muted">
                  Informações de localização do cliente
                </Text>
              </View>

              <FormInput
                label="CEP"
                placeholder="00000-000"
                value={formData.cep}
                onChangeText={(value) => updateField('cep', maskCEP(value))}
                error={errors.cep}
                keyboardType="numeric"
                maxLength={9}
                returnKeyType="next"
              />

              <FormInput
                label="Rua"
                placeholder="Digite o nome da rua"
                value={formData.rua}
                onChangeText={(value) => updateField('rua', value)}
                error={errors.rua}
                autoCapitalize="words"
                returnKeyType="next"
              />

              <View className="flex-row gap-3">
                <View className="w-[32%]">
                  <FormInput
                    label="Número"
                    placeholder="Nº"
                    value={formData.numero}
                    onChangeText={(value) => updateField('numero', value)}
                    error={errors.numero}
                    returnKeyType="next"
                  />
                </View>

                <View className="flex-1">
                  <FormInput
                    label="Bairro"
                    placeholder="Digite o bairro"
                    value={formData.bairro}
                    onChangeText={(value) => updateField('bairro', value)}
                    error={errors.bairro}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <FormInput
                    label="Cidade"
                    placeholder="Digite a cidade"
                    value={formData.cidade}
                    onChangeText={(value) => updateField('cidade', value)}
                    error={errors.cidade}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                <View className="w-[30%]">
                  <FormInput
                    label="UF"
                    placeholder="SP"
                    value={formData.estado}
                    onChangeText={(value) =>
                      updateField('estado', value.toUpperCase())
                    }
                    error={errors.estado}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={2}
                    returnKeyType="done"
                  />
                </View>
              </View>

              <View className="mt-2 flex-row rounded-[14px] border border-salamandra-border bg-salamandra-card p-4">
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={COLORS.gold}
                />
                <Text className="ml-3 flex-1 text-xs leading-5 text-salamandra-muted">
                  Os campos marcados com * são obrigatórios.
                </Text>
              </View>

              {erroCadastro ? (
                <View className="mt-4 flex-row rounded-[14px] border border-salamandra-errorBorder bg-salamandra-card p-4">
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color={COLORS.error}
                  />
                  <Text
                    className="ml-3 flex-1 text-xs leading-5"
                    style={{ color: COLORS.error }}
                  >
                    {erroCadastro}
                  </Text>
                </View>
              ) : null}

              <Pressable
                className={`mt-6 h-[54px] flex-row items-center justify-center rounded-[14px] bg-salamandra-gold ${
                  salvando ? 'opacity-60' : 'active:opacity-80'
                }`}
                onPress={handleSubmit}
                disabled={salvando}
                accessibilityRole="button"
                accessibilityLabel={
                  editando ? 'Atualizar cliente' : 'Salvar cliente'
                }
              >
                {salvando ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color={COLORS.background}
                    />
                    <Text className="ml-2 text-sm font-extrabold text-salamandra-background">
                      {editando ? 'ATUALIZANDO...' : 'SALVANDO...'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-outline"
                      size={21}
                      color={COLORS.background}
                    />
                    <Text className="ml-2 text-sm font-extrabold text-salamandra-background">
                      {editando ? 'ATUALIZAR CLIENTE' : 'SALVAR CLIENTE'}
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}