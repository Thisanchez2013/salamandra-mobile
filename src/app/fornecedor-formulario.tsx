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
import { BotaoExcluir } from '../components/ui/BotaoExcluir';
import { ErrorState, LoadingState } from '../components/ui/EstadosTela';
import { FiltroChips, OpcaoChip } from '../components/ui/FiltroChips';
import { FormInput } from '../components/ui/FormInput';
import { COLORS } from '../constants/theme';
import { usePermissoes } from '../hooks/usePermissoes';
import {
  buscarFornecedorPorId,
  excluirFornecedor,
  salvarFornecedor,
} from '../services/fornecedorService';
import {
  FornecedorFormData,
  FornecedorFormErrors,
  StatusFornecedor,
} from '../types/fornecedor';
import { mensagemErroExclusao } from '../utils/erros';
import { maskCpfCnpj, maskTelefone } from '../utils/masks';
import {
  somenteNumeros,
  validarCPF,
  validarEmail,
} from '../utils/validators';

const FORM_INICIAL: FornecedorFormData = {
  nome: '',
  cnpjCpf: '',
  contato: '',
  email: '',
  endereco: '',
  status: 'Ativo',
};

const OPCOES_STATUS: OpcaoChip<StatusFornecedor>[] = [
  { valor: 'Ativo', rotulo: 'Ativo' },
  { valor: 'Inativo', rotulo: 'Inativo' },
];

function validar(form: FornecedorFormData): FornecedorFormErrors {
  const erros: FornecedorFormErrors = {};
  const documento = somenteNumeros(form.cnpjCpf);
  const telefone = somenteNumeros(form.contato);

  if (!form.nome.trim()) {
    erros.nome = 'Informe o nome do fornecedor.';
  }

  if (documento && documento.length !== 11 && documento.length !== 14) {
    erros.cnpjCpf = 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).';
  } else if (documento.length === 11 && !validarCPF(documento)) {
    erros.cnpjCpf = 'CPF inválido.';
  }

  if (telefone && telefone.length < 10) {
    erros.contato = 'Informe o telefone com DDD.';
  }

  if (!validarEmail(form.email)) {
    erros.email = 'E-mail inválido.';
  }

  return erros;
}

export default function FornecedorFormularioScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = Boolean(id);
  const { podeGerenciarFornecedores, podeExcluir } = usePermissoes();

  // Sem permissão de gerenciar, a tela vira somente leitura.
  const somenteLeitura = !podeGerenciarFornecedores;

  const [form, setForm] = useState<FornecedorFormData>(FORM_INICIAL);
  const [erros, setErros] = useState<FornecedorFormErrors>({});
  const [carregando, setCarregando] = useState(editando);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  // ==================================================
  // CARREGA (MODO EDIÇÃO)
  // ==================================================

  const carregar = useCallback(async () => {
    if (!id) return;

    try {
      setCarregando(true);
      setErroBusca(null);

      const fornecedor = await buscarFornecedorPorId(id);

      if (!fornecedor) {
        setErroBusca('O fornecedor não foi encontrado.');
        return;
      }

      setForm({
        nome: fornecedor.nome,
        cnpjCpf: maskCpfCnpj(fornecedor.cnpjCpf ?? ''),
        contato: maskTelefone(fornecedor.contato ?? ''),
        email: fornecedor.email ?? '',
        endereco: fornecedor.endereco ?? '',
        status: fornecedor.status,
      });
    } catch (error) {
      console.log('Erro ao carregar fornecedor:', error);
      setErroBusca('Não foi possível carregar os dados deste fornecedor.');
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) void carregar();
  }, [id, carregar]);

  function atualizarCampo<K extends keyof FornecedorFormData>(
    campo: K,
    valor: FornecedorFormData[K]
  ) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  // ==================================================
  // SALVAR
  // ==================================================

  async function handleSubmit() {
    if (salvando || somenteLeitura) return;

    const novosErros = validar(form);
    setErros(novosErros);

    if (Object.keys(novosErros).length > 0) return;

    try {
      setSalvando(true);
      setErroSalvar(null);
      await salvarFornecedor(form, id);
      router.back();
    } catch (error) {
      console.log('Erro ao salvar fornecedor:', error);
      setErroSalvar(
        'Não foi possível salvar o fornecedor. Verifique suas permissões e tente novamente.'
      );
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(): Promise<string | null> {
    try {
      await excluirFornecedor(id!, form.nome);
      return null;
    } catch (error) {
      console.log('Erro ao excluir fornecedor:', error);
      return mensagemErroExclusao(
        error,
        'Este fornecedor está ligado a outros registros do sistema.'
      );
    }
  }

  const titulo = !editando
    ? 'Novo fornecedor'
    : somenteLeitura
      ? 'Fornecedor'
      : 'Editar fornecedor';

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AppHeader
          title={titulo}
          subtitle={editando ? form.nome || 'Dados do fornecedor' : 'Cadastre um fornecedor'}
          onBack={() => router.back()}
        />

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-[22px] pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {carregando ? (
            <LoadingState mensagem="Carregando fornecedor..." />
          ) : erroBusca ? (
            <ErrorState
              mensagem={erroBusca}
              onRetry={() => void carregar()}
            />
          ) : (
            <>
              <View className="mb-4 mt-6">
                <Text className="text-base font-bold text-salamandra-text">
                  Dados do fornecedor
                </Text>

                <Text className="mt-1 text-xs text-salamandra-muted">
                  {somenteLeitura
                    ? 'Seu perfil pode apenas consultar fornecedores.'
                    : 'Os campos marcados com * são obrigatórios.'}
                </Text>
              </View>

              <FormInput
                label="Nome / Razão social"
                required
                placeholder="Nome do fornecedor"
                value={form.nome}
                onChangeText={(valor) => atualizarCampo('nome', valor)}
                error={erros.nome}
                editable={!somenteLeitura}
                autoCapitalize="words"
                maxLength={120}
              />

              <FormInput
                label="CNPJ ou CPF"
                placeholder="00.000.000/0000-00"
                value={form.cnpjCpf}
                onChangeText={(valor) =>
                  atualizarCampo('cnpjCpf', maskCpfCnpj(valor))
                }
                error={erros.cnpjCpf}
                editable={!somenteLeitura}
                keyboardType="number-pad"
              />

              <FormInput
                label="Telefone"
                placeholder="(00) 00000-0000"
                value={form.contato}
                onChangeText={(valor) =>
                  atualizarCampo('contato', maskTelefone(valor))
                }
                error={erros.contato}
                editable={!somenteLeitura}
                keyboardType="phone-pad"
              />

              <FormInput
                label="E-mail"
                placeholder="contato@fornecedor.com"
                value={form.email}
                onChangeText={(valor) => atualizarCampo('email', valor)}
                error={erros.email}
                editable={!somenteLeitura}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <FormInput
                label="Endereço"
                placeholder="Rua, número, bairro, cidade"
                value={form.endereco}
                onChangeText={(valor) => atualizarCampo('endereco', valor)}
                editable={!somenteLeitura}
                multiline
                numberOfLines={2}
                style={{ height: 76, paddingTop: 14 }}
              />

              <Text className="mb-2 text-xs font-semibold text-salamandra-textSoft">
                Situação
              </Text>

              {somenteLeitura ? (
                <Text className="text-sm font-bold text-salamandra-gold">
                  {form.status}
                </Text>
              ) : (
                <View className="-mt-3">
                  <FiltroChips
                    opcoes={OPCOES_STATUS}
                    selecionado={form.status}
                    onChange={(valor) => atualizarCampo('status', valor)}
                  />
                </View>
              )}

              {erroSalvar ? (
                <View className="mt-5 flex-row rounded-[14px] border border-salamandra-errorBorder bg-salamandra-card p-4">
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color={COLORS.error}
                  />

                  <Text className="ml-3 flex-1 text-xs leading-5 text-salamandra-error">
                    {erroSalvar}
                  </Text>
                </View>
              ) : null}

              {somenteLeitura ? null : (
                <Pressable
                  className={`mt-6 h-[54px] flex-row items-center justify-center rounded-[14px] bg-salamandra-gold ${
                    salvando ? 'opacity-60' : 'active:opacity-80'
                  }`}
                  onPress={() => void handleSubmit()}
                  disabled={salvando}
                  accessibilityRole="button"
                  accessibilityLabel={
                    editando ? 'Atualizar fornecedor' : 'Salvar fornecedor'
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
                        ? 'ATUALIZAR FORNECEDOR'
                        : 'SALVAR FORNECEDOR'}
                  </Text>
                </Pressable>
              )}

              {editando && podeExcluir ? (
                <BotaoExcluir
                  entidade="fornecedor"
                  nome={form.nome}
                  onExcluir={handleExcluir}
                  onExcluido={() => router.back()}
                />
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
