import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClienteCard } from '../components/clientes/ClienteCard';
import { AppHeader } from '../components/ui/AppHeader';
import { COLORS } from '../constants/theme';
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
      <View className="flex-1 bg-salamandra-background">

        {/* ==================================================
                            CABEÇALHO
           ================================================== */}

        <AppHeader
          title="Clientes"
          subtitle="Gerencie seus clientes"
          onBack={() => router.back()}
          actionIcon="add"
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

          {/* ==================================================
                              PESQUISA
             ================================================== */}

          <View className="mt-5 h-[52px] flex-row items-center rounded-[14px] border border-salamandra-border bg-salamandra-card px-4">
            <Ionicons
              name="search-outline"
              size={20}
              color={COLORS.subtle}
            />

            <TextInput
              className="ml-3 h-full flex-1 text-sm text-salamandra-text"
              placeholder="Buscar por nome ou CPF"
              placeholderTextColor={COLORS.subtle}
              value={pesquisa}
              onChangeText={setPesquisa}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {pesquisa.length > 0 ? (
              <Pressable
                onPress={() => setPesquisa('')}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Limpar pesquisa"
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={COLORS.subtle}
                />
              </Pressable>
            ) : null}
          </View>

          {/* ==================================================
                          TÍTULO DA LISTA
             ================================================== */}

          <View className="mb-3 mt-7 flex-row items-center justify-between">
            <Text className="text-base font-bold text-salamandra-text">
              Todos os clientes
            </Text>

            <Text className="text-xs text-salamandra-muted">
              {clientesFiltrados.length}{' '}
              {clientesFiltrados.length === 1
                ? 'cliente'
                : 'clientes'}
            </Text>
          </View>

          {/* ==================================================
                              LOADING
             ================================================== */}

          {carregando ? (
            <View className="items-center py-10">
              <ActivityIndicator
                size="small"
                color={COLORS.gold}
              />

              <Text className="mt-3 text-xs text-salamandra-muted">
                Carregando clientes...
              </Text>
            </View>
          ) : erro ? (

            /* ==================================================
                                  ERRO
               ================================================== */

            <View className="items-center rounded-2xl border border-salamandra-border bg-salamandra-card px-5 py-10">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-salamandra-surface">
                <Ionicons
                  name="alert-circle-outline"
                  size={28}
                  color={COLORS.error}
                />
              </View>

              <Text className="mt-4 text-sm font-bold text-salamandra-textSoft">
                Não foi possível carregar
              </Text>

              <Text className="mt-1.5 text-center text-xs leading-5 text-salamandra-muted">
                {erro}
              </Text>

              <Pressable
                className="mt-5 flex-row items-center rounded-xl bg-salamandra-gold px-5 py-3 active:opacity-80"
                onPress={carregarClientes}
                accessibilityRole="button"
                accessibilityLabel="Tentar carregar clientes novamente"
              >
                <Ionicons
                  name="refresh-outline"
                  size={19}
                  color={COLORS.background}
                />

                <Text className="ml-2 text-xs font-extrabold text-salamandra-background">
                  TENTAR NOVAMENTE
                </Text>
              </Pressable>
            </View>
          ) : clientes.length === 0 ? (

            /* ==================================================
                              ESTADO VAZIO
               ================================================== */

            <View className="items-center rounded-2xl border border-salamandra-border bg-salamandra-card px-5 py-10">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-salamandra-surface">
                <Ionicons
                  name="people-outline"
                  size={28}
                  color={COLORS.subtle}
                />
              </View>

              <Text className="mt-4 text-sm font-bold text-salamandra-textSoft">
                Nenhum cliente cadastrado
              </Text>

              <Text className="mt-1.5 text-center text-xs leading-5 text-salamandra-muted">
                Os clientes cadastrados no sistema aparecerão aqui.
              </Text>

              <Pressable
                className="mt-5 flex-row items-center rounded-xl bg-salamandra-gold px-5 py-3 active:opacity-80"
                onPress={() => router.push('/novo-cliente')}
                accessibilityRole="button"
                accessibilityLabel="Cadastrar novo cliente"
              >
                <Ionicons
                  name="add"
                  size={19}
                  color={COLORS.background}
                />

                <Text className="ml-2 text-xs font-extrabold text-salamandra-background">
                  NOVO CLIENTE
                </Text>
              </Pressable>
            </View>
          ) : clientesFiltrados.length === 0 ? (

            /* ==================================================
                          PESQUISA SEM RESULTADO
               ================================================== */

            <View className="items-center rounded-2xl border border-salamandra-border bg-salamandra-card px-5 py-10">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-salamandra-surface">
                <Ionicons
                  name="search-outline"
                  size={28}
                  color={COLORS.subtle}
                />
              </View>

              <Text className="mt-4 text-sm font-bold text-salamandra-textSoft">
                Nenhum resultado encontrado
              </Text>

              <Text className="mt-1.5 text-center text-xs leading-5 text-salamandra-muted">
                Tente pesquisar por outro nome ou CPF.
              </Text>
            </View>
          ) : (

            /* ==================================================
                          CLIENTES CADASTRADOS
               ================================================== */

            <View>
              {clientesFiltrados.map((cliente) => (
                <ClienteCard
                  key={cliente.id}
                  cliente={cliente}
                />
              ))}
            </View>
          )}

          {/* ==================================================
                          ESPAÇAMENTO FINAL
             ================================================== */}

          <View className="h-8" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}