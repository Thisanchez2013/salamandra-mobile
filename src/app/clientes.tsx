import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClienteCard } from '../components/clientes/ClienteCard';
import { AppHeader } from '../components/ui/AppHeader';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/ui/EstadosTela';
import { SearchInput } from '../components/ui/SearchInput';
import { useClientes } from '../hooks/useClientes';

export default function ClientesScreen() {
  const router = useRouter();

  const {
    clientes,
    clientesFiltrados,
    pesquisa,
    setPesquisa,
    carregando,
    erro,
    carregarClientes,
  } = useClientes();

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">

      {/* ==================================================
                          CABEÇALHO
         ================================================== */}

      <AppHeader
        title="Clientes"
        subtitle="Gerencie seus clientes"
        onBack={() => router.back()}
        actionIcon="add"
        actionLabel="Novo cliente"
        onActionPress={() => router.push('/novo-cliente')}
      />

      {/* ==================================================
                          CONTEÚDO
         ================================================== */}

      <ScrollView
        className="flex-1 px-[22px]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SearchInput
          value={pesquisa}
          onChangeText={setPesquisa}
          placeholder="Buscar por nome ou CPF"
        />

        {/* TÍTULO DA LISTA */}

        <View className="mb-3 mt-7 flex-row items-center justify-between">
          <Text className="text-base font-bold text-salamandra-text">
            Todos os clientes
          </Text>

          <Text className="text-xs text-salamandra-muted">
            {clientesFiltrados.length}{' '}
            {clientesFiltrados.length === 1 ? 'cliente' : 'clientes'}
          </Text>
        </View>

        {/* LISTA E ESTADOS */}

        {carregando ? (
          <LoadingState mensagem="Carregando clientes..." />
        ) : erro ? (
          <ErrorState
            mensagem={erro}
            onRetry={carregarClientes}
          />
        ) : clientes.length === 0 ? (
          <EmptyState
            icon="people-outline"
            titulo="Nenhum cliente cadastrado"
            descricao="Os clientes cadastrados no sistema aparecerão aqui."
            acao={{
              icon: 'add',
              rotulo: 'Novo cliente',
              onPress: () => router.push('/novo-cliente'),
            }}
          />
        ) : clientesFiltrados.length === 0 ? (
          <EmptyState
            icon="search-outline"
            titulo="Nenhum resultado encontrado"
            descricao="Tente pesquisar por outro nome ou CPF."
          />
        ) : (
          <View>
            {clientesFiltrados.map((cliente) => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                onPress={() =>
                  router.push({
                    pathname: '/novo-cliente',
                    params: { id: cliente.id },
                  })
                }
              />
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
