import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/ui/AppHeader';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/ui/EstadosTela';
import { FiltroChips, OpcaoChip } from '../components/ui/FiltroChips';
import { SearchInput } from '../components/ui/SearchInput';
import { COLORS } from '../constants/theme';
import { FiltroStatus, useFornecedores } from '../hooks/useFornecedores';
import { usePermissoes } from '../hooks/usePermissoes';
import { Fornecedor } from '../types/fornecedor';
import { maskCpfCnpj, maskTelefone } from '../utils/masks';

const FILTROS: OpcaoChip<FiltroStatus>[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'Ativo', rotulo: 'Ativos' },
  { valor: 'Inativo', rotulo: 'Inativos' },
];

// ==================================================
// CARD DO FORNECEDOR
// ==================================================

function FornecedorCard({
  fornecedor,
  onPress,
}: {
  fornecedor: Fornecedor;
  onPress: () => void;
}) {
  const ativo = fornecedor.status === 'Ativo';

  return (
    <Pressable
      className="mb-3 flex-row items-center rounded-2xl border border-salamandra-border bg-salamandra-card p-4 active:opacity-80"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Fornecedor ${fornecedor.nome}`}
    >
      <View className="mr-3 h-12 w-12 items-center justify-center rounded-[14px] bg-salamandra-surface">
        <Ionicons
          name="business-outline"
          size={23}
          color={ativo ? COLORS.gold : COLORS.subtle}
        />
      </View>

      <View className="flex-1">
        <Text
          className="text-sm font-bold text-salamandra-textSecondary"
          numberOfLines={1}
        >
          {fornecedor.nome}
        </Text>

        {fornecedor.cnpjCpf ? (
          <Text className="mt-1 text-xs text-salamandra-muted">
            {maskCpfCnpj(fornecedor.cnpjCpf)}
          </Text>
        ) : null}

        {fornecedor.contato || fornecedor.email ? (
          <Text
            className="mt-1 text-[11px] text-salamandra-subtle"
            numberOfLines={1}
          >
            {[
              fornecedor.contato ? maskTelefone(fornecedor.contato) : null,
              fornecedor.email,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        ) : null}
      </View>

      <Text
        className="ml-3 text-[10px] font-bold"
        style={{ color: ativo ? COLORS.gold : COLORS.subtle }}
      >
        {fornecedor.status.toUpperCase()}
      </Text>
    </Pressable>
  );
}

// ==================================================
// TELA
// ==================================================

export default function FornecedoresScreen() {
  const router = useRouter();
  const { podeGerenciarFornecedores } = usePermissoes();

  const {
    fornecedores,
    fornecedoresFiltrados,
    pesquisa,
    setPesquisa,
    status,
    setStatus,
    carregando,
    atualizando,
    erro,
    atualizar,
    tentarNovamente,
  } = useFornecedores();

  const novoFornecedor = () => router.push('/fornecedor-formulario');

  const cabecalho = (
    <View>
      <SearchInput
        value={pesquisa}
        onChangeText={setPesquisa}
        placeholder="Buscar por nome, CNPJ ou CPF"
      />

      <FiltroChips
        opcoes={FILTROS}
        selecionado={status}
        onChange={setStatus}
      />

      <View className="mb-3 mt-7 flex-row items-center justify-between">
        <Text className="text-base font-bold text-salamandra-text">
          Fornecedores
        </Text>

        <Text className="text-xs text-salamandra-muted">
          {fornecedoresFiltrados.length}{' '}
          {fornecedoresFiltrados.length === 1 ? 'fornecedor' : 'fornecedores'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <AppHeader
        title="Fornecedores"
        subtitle="Parceiros de compra"
        onBack={() => router.back()}
        actionIcon={podeGerenciarFornecedores ? 'add' : undefined}
        actionLabel="Novo fornecedor"
        onActionPress={novoFornecedor}
      />

      {carregando ? (
        <LoadingState mensagem="Carregando fornecedores..." />
      ) : erro ? (
        <View className="px-[22px]">
          <ErrorState
            mensagem={erro}
            onRetry={tentarNovamente}
          />
        </View>
      ) : (
        <FlatList
          className="flex-1"
          contentContainerClassName="px-[22px] pb-8"
          data={fornecedoresFiltrados}
          keyExtractor={(fornecedor) => fornecedor.id}
          ListHeaderComponent={cabecalho}
          ListEmptyComponent={
            fornecedores.length === 0 ? (
              <EmptyState
                icon="business-outline"
                titulo="Nenhum fornecedor cadastrado"
                descricao="Os fornecedores cadastrados aparecerão aqui."
                acao={
                  podeGerenciarFornecedores
                    ? {
                        icon: 'add',
                        rotulo: 'Novo fornecedor',
                        onPress: novoFornecedor,
                      }
                    : undefined
                }
              />
            ) : (
              <EmptyState
                icon="search-outline"
                titulo="Nenhum fornecedor encontrado"
                descricao="Tente outro nome, documento ou status."
              />
            )
          }
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
          renderItem={({ item }) => (
            <FornecedorCard
              fornecedor={item}
              onPress={() =>
                router.push({
                  pathname: '/fornecedor-formulario',
                  params: { id: item.id },
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
