import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { maskCEP, maskCPF } from '../utils/masks';

export default function NovoClienteScreen() {
  const router = useRouter();

  // ==================================================
  // FORMULÁRIO
  // ==================================================

  const {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
  } = useClienteForm();

  // ==================================================
  // CADASTRO
  // ==================================================

  const {
    salvarCliente,
    salvando,
    erroCadastro,
  } = useNovoCliente();

  // ==================================================
  // SALVAR CLIENTE
  // ==================================================

  async function handleSubmit() {
    const isValid = validateForm();

    if (!isValid || salvando) {
      return;
    }

    const sucesso = await salvarCliente(formData);

    if (!sucesso) {
      return;
    }

    resetForm();

    Alert.alert(
      'Cliente cadastrado',
      'O cliente foi cadastrado com sucesso.',
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
        {/* ==================================================
                            CABEÇALHO
           ================================================== */}

        <AppHeader
          title="Novo cliente"
          subtitle="Cadastre um novo cliente"
          onBack={() => router.back()}
        />

        {/* ==================================================
                            CONTEÚDO
           ================================================== */}

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-[22px] pb-10"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ==================================================
                        DADOS PESSOAIS
             ================================================== */}

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

          {/* NOME */}

          <FormInput
            label="Nome completo"
            required
            placeholder="Digite o nome completo"
            value={formData.nome}
            onChangeText={(value) =>
              updateField('nome', value)
            }
            error={errors.nome}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
          />

          {/* CPF */}

          <FormInput
            label="CPF"
            required
            placeholder="000.000.000-00"
            value={formData.cpf}
            onChangeText={(value) =>
              updateField('cpf', maskCPF(value))
            }
            error={errors.cpf}
            keyboardType="numeric"
            maxLength={14}
            returnKeyType="next"
          />

          {/* E-MAIL */}

          <FormInput
            label="E-mail"
            placeholder="cliente@email.com"
            value={formData.email}
            onChangeText={(value) =>
              updateField('email', value)
            }
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          {/* ==================================================
                            ENDEREÇO
             ================================================== */}

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

          {/* CEP */}

          <FormInput
            label="CEP"
            placeholder="00000-000"
            value={formData.cep}
            onChangeText={(value) =>
              updateField('cep', maskCEP(value))
            }
            error={errors.cep}
            keyboardType="numeric"
            maxLength={9}
            returnKeyType="next"
          />

          {/* RUA */}

          <FormInput
            label="Rua"
            placeholder="Digite o nome da rua"
            value={formData.rua}
            onChangeText={(value) =>
              updateField('rua', value)
            }
            error={errors.rua}
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* ==================================================
                          NÚMERO E BAIRRO
             ================================================== */}

          <View className="flex-row gap-3">
            <View className="w-[32%]">
              <FormInput
                label="Número"
                placeholder="Nº"
                value={formData.numero}
                onChangeText={(value) =>
                  updateField('numero', value)
                }
                error={errors.numero}
                returnKeyType="next"
              />
            </View>

            <View className="flex-1">
              <FormInput
                label="Bairro"
                placeholder="Digite o bairro"
                value={formData.bairro}
                onChangeText={(value) =>
                  updateField('bairro', value)
                }
                error={errors.bairro}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* ==================================================
                          CIDADE E ESTADO
             ================================================== */}

          <View className="flex-row gap-3">
            <View className="flex-1">
              <FormInput
                label="Cidade"
                placeholder="Digite a cidade"
                value={formData.cidade}
                onChangeText={(value) =>
                  updateField('cidade', value)
                }
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
                  updateField(
                    'estado',
                    value.toUpperCase()
                  )
                }
                error={errors.estado}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={2}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* ==================================================
                          INFORMAÇÃO
             ================================================== */}

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

          {/* ==================================================
                      ERRO NO CADASTRO
             ================================================== */}

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

          {/* ==================================================
                        BOTÃO SALVAR
             ================================================== */}

          <Pressable
            className={`mt-6 h-[54px] flex-row items-center justify-center rounded-[14px] bg-salamandra-gold ${
              salvando
                ? 'opacity-60'
                : 'active:opacity-80'
            }`}
            onPress={handleSubmit}
            disabled={salvando}
            accessibilityRole="button"
            accessibilityLabel="Salvar cliente"
          >
            {salvando ? (
              <>
                <ActivityIndicator
                  size="small"
                  color={COLORS.background}
                />

                <Text className="ml-2 text-sm font-extrabold text-salamandra-background">
                  SALVANDO...
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
                  SALVAR CLIENTE
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}