import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import {
  buscarDadosDashboard,
  DashboardDados,
} from '../services/dashboardService';

const dadosIniciais: DashboardDados = {
  faturamento: 0,
  quantidadeVendas: 0,
  quantidadeProdutos: 0,
  quantidadeClientes: 0,
  estoqueBaixo: 0,
  ultimasVendas: [],
};

export default function HomeScreen() {
  const router = useRouter();

  const [nomeUsuario, setNomeUsuario] = useState('');

  const [dashboard, setDashboard] =
    useState<DashboardDados>(dadosIniciais);

  const [atualizando, setAtualizando] = useState(false);

  const [carregandoDashboard, setCarregandoDashboard] =
    useState(true);

  useEffect(() => {
    carregarHome();
  }, []);

  // ==================================================
  // CARREGAMENTO DA HOME
  // ==================================================

  async function carregarHome() {
    await Promise.all([
      carregarPerfil(),
      carregarDashboard(),
    ]);
  }

  async function atualizarDashboard() {
    try {
      setAtualizando(true);

      await carregarDashboard();
    } finally {
      setAtualizando(false);
    }
  }

  // ==================================================
  // PERFIL / SESSÃO
  // ==================================================

  async function carregarPerfil() {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.log(
          'Usuário sem sessão. Redirecionando para Login.'
        );

        router.replace('/');
        return;
      }

      const user = session.user;

      const { data: perfil, error: perfilError } =
        await supabase
          .from('perfis')
          .select('nome')
          .eq('id', user.id)
          .single();

      if (perfilError) {
        console.log(
          'Erro ao carregar perfil:',
          perfilError
        );

        return;
      }

      if (perfil?.nome) {
        const primeiroNome =
          perfil.nome.trim().split(' ')[0];

        setNomeUsuario(primeiroNome);
      }
    } catch (error) {
      console.log(
        'Erro inesperado ao carregar perfil:',
        error
      );
    }
  }

  // ==================================================
  // DASHBOARD
  // ==================================================

  async function carregarDashboard() {
    try {
      const dados = await buscarDadosDashboard();

      setDashboard(dados);

      console.log(
        'Dashboard carregado com sucesso:',
        dados
      );
    } catch (error) {
      console.log(
        'Erro ao carregar Dashboard:',
        error
      );

      Alert.alert(
        'Erro ao carregar dados',
        'Não foi possível atualizar o Dashboard. Tente novamente.'
      );
    } finally {
      setCarregandoDashboard(false);
    }
  }

  // ==================================================
  // FORMATAÇÃO
  // ==================================================

  function formatarMoeda(valor: number) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // ==================================================
  // LOGOUT
  // ==================================================

  function handleLogout() {
    Alert.alert(
      'Sair do sistema',
      'Deseja realmente sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',

          onPress: async () => {
            try {
              const { error } =
                await supabase.auth.signOut();

              if (error) {
                console.log(
                  'Erro ao sair:',
                  error
                );

                Alert.alert(
                  'Erro',
                  'Não foi possível sair da sua conta.'
                );

                return;
              }

              router.replace('/');
            } catch (error) {
              console.log(
                'Erro inesperado ao sair:',
                error
              );

              Alert.alert(
                'Erro',
                'Não foi possível sair da sua conta.'
              );
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <View className="flex-1 bg-salamandra-background">

        <ScrollView
          className="flex-1 bg-salamandra-background px-[22px] pt-5"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={atualizarDashboard}
              tintColor={COLORS.gold}
              colors={[COLORS.gold]}
            />
          }
        >

          {/* ==================================================
                              CABEÇALHO
             ================================================== */}

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[21px] font-extrabold tracking-[2.2px] text-salamandra-gold">
                SALAMANDRA
              </Text>

              <Text className="mt-[3px] text-[11px] text-salamandra-subtle">
                Sistema de Gestão
              </Text>
            </View>

            <Pressable
              className="h-11 w-11 items-center justify-center rounded-[14px] border border-salamandra-border bg-salamandra-card active:opacity-70"
              onPress={handleLogout}
            >
              <Ionicons
                name="person-outline"
                size={22}
                color={COLORS.gold}
              />
            </Pressable>
          </View>

          {/* ==================================================
                              BOAS-VINDAS
             ================================================== */}

          <View className="mb-6 mt-[34px]">
            <Text className="text-[25px] font-bold text-salamandra-text">
              Bom dia
              {nomeUsuario ? `, ${nomeUsuario}` : ''} 👋
            </Text>

            <Text className="mt-1.5 text-sm text-salamandra-muted">
              Aqui está o resumo do seu negócio.
            </Text>
          </View>

          {/* ==================================================
                              FATURAMENTO
             ================================================== */}

          <View className="rounded-[18px] border border-salamandra-border bg-salamandra-card p-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold tracking-[1.2px] text-salamandra-muted">
                  FATURAMENTO
                </Text>

                {carregandoDashboard ? (
                  <View className="mt-3 h-[36px] justify-center">
                    <ActivityIndicator
                      size="small"
                      color={COLORS.gold}
                    />
                  </View>
                ) : (
                  <Text className="mt-2 text-[30px] font-extrabold text-salamandra-text">
                    {formatarMoeda(
                      dashboard.faturamento
                    )}
                  </Text>
                )}
              </View>

              <View className="h-12 w-12 items-center justify-center rounded-[14px] bg-salamandra-surfaceLight">
                <Ionicons
                  name="cash-outline"
                  size={24}
                  color={COLORS.gold}
                />
              </View>
            </View>

            <View className="my-4 h-px bg-salamandra-border" />

            <Text className="text-xs text-salamandra-subtle">
              Vendas realizadas no período
            </Text>
          </View>

          {/* ==================================================
                              INDICADORES
             ================================================== */}

          <View className="mt-[14px] flex-row flex-wrap justify-between">

            {/* VENDAS */}

            <View className="mb-3 min-h-[135px] w-[48.5%] rounded-2xl border border-salamandra-border bg-salamandra-card p-4">
              <View className="flex-row items-center justify-between">
                <Ionicons
                  name="cart-outline"
                  size={22}
                  color={COLORS.gold}
                />

                <Text className="text-[25px] font-extrabold text-salamandra-text">
                  {dashboard.quantidadeVendas}
                </Text>
              </View>

              <Text className="mt-[18px] text-sm font-bold text-salamandra-textSecondary">
                Vendas
              </Text>

              <Text className="mt-1 text-[11px] text-salamandra-disabled">
                Realizadas
              </Text>
            </View>

            {/* PRODUTOS */}

            <View className="mb-3 min-h-[135px] w-[48.5%] rounded-2xl border border-salamandra-border bg-salamandra-card p-4">
              <View className="flex-row items-center justify-between">
                <Ionicons
                  name="cube-outline"
                  size={22}
                  color={COLORS.gold}
                />

                <Text className="text-[25px] font-extrabold text-salamandra-text">
                  {dashboard.quantidadeProdutos}
                </Text>
              </View>

              <Text className="mt-[18px] text-sm font-bold text-salamandra-textSecondary">
                Produtos
              </Text>

              <Text className="mt-1 text-[11px] text-salamandra-disabled">
                Cadastrados
              </Text>
            </View>

            {/* CLIENTES */}

            <View className="mb-3 min-h-[135px] w-[48.5%] rounded-2xl border border-salamandra-border bg-salamandra-card p-4">
              <View className="flex-row items-center justify-between">
                <Ionicons
                  name="people-outline"
                  size={22}
                  color={COLORS.gold}
                />

                <Text className="text-[25px] font-extrabold text-salamandra-text">
                  {dashboard.quantidadeClientes}
                </Text>
              </View>

              <Text className="mt-[18px] text-sm font-bold text-salamandra-textSecondary">
                Clientes
              </Text>

              <Text className="mt-1 text-[11px] text-salamandra-disabled">
                Cadastrados
              </Text>
            </View>

            {/* ESTOQUE BAIXO */}

            <View className="mb-3 min-h-[135px] w-[48.5%] rounded-2xl border border-salamandra-border bg-salamandra-card p-4">
              <View className="flex-row items-center justify-between">
                <Ionicons
                  name="warning-outline"
                  size={22}
                  color={COLORS.gold}
                />

                <Text className="text-[25px] font-extrabold text-salamandra-text">
                  {dashboard.estoqueBaixo}
                </Text>
              </View>

              <Text className="mt-[18px] text-sm font-bold text-salamandra-textSecondary">
                Estoque baixo
              </Text>

              <Text className="mt-1 text-[11px] text-salamandra-disabled">
                Produtos
              </Text>
            </View>
          </View>

          {/* ==================================================
                              AÇÕES RÁPIDAS
             ================================================== */}

          <View className="mt-7">
            <View className="mb-[14px]">
              <Text className="text-lg font-bold text-salamandra-text">
                Ações rápidas
              </Text>

              <Text className="mt-1 text-xs text-salamandra-subtle">
                Acesse as principais funções do sistema
              </Text>
            </View>

            <View className="flex-row flex-wrap justify-between">

              {/* NOVA VENDA */}

              <Pressable
                className="mb-3 h-16 w-[48.5%] flex-row items-center rounded-[15px] border border-salamandra-border bg-salamandra-card px-[14px] active:opacity-70"
                onPress={() => router.push('/clientes')}
              >
                <View className="mr-[11px] h-9 w-9 items-center justify-center rounded-[10px] bg-salamandra-gold">
                  <Ionicons
                    name="people-outline"
                    size={22}
                    color={COLORS.background}
                  />
                </View>

                <Text className="flex-shrink text-[13px] font-bold text-salamandra-textSecondary">
                  Clientes
                </Text>
              </Pressable>

              {/* PRODUTOS */}

              <Pressable className="mb-3 h-16 w-[48.5%] flex-row items-center rounded-[15px] border border-salamandra-border bg-salamandra-card px-[14px] active:opacity-70">
                <View className="mr-[11px] h-9 w-9 items-center justify-center rounded-[10px] bg-salamandra-gold">
                  <Ionicons
                    name="cube-outline"
                    size={22}
                    color={COLORS.background}
                  />
                </View>

                <Text className="flex-shrink text-[13px] font-bold text-salamandra-textSecondary">
                  Produtos
                </Text>
              </Pressable>

              {/* CLIENTES */}

              <Pressable className="mb-3 h-16 w-[48.5%] flex-row items-center rounded-[15px] border border-salamandra-border bg-salamandra-card px-[14px] active:opacity-70">
                <View className="mr-[11px] h-9 w-9 items-center justify-center rounded-[10px] bg-salamandra-gold">
                  <Ionicons
                    name="people-outline"
                    size={22}
                    color={COLORS.background}
                  />
                </View>

                <Text className="flex-shrink text-[13px] font-bold text-salamandra-textSecondary">
                  Clientes
                </Text>
              </Pressable>

              {/* ESTOQUE */}

              <Pressable className="mb-3 h-16 w-[48.5%] flex-row items-center rounded-[15px] border border-salamandra-border bg-salamandra-card px-[14px] active:opacity-70">
                <View className="mr-[11px] h-9 w-9 items-center justify-center rounded-[10px] bg-salamandra-gold">
                  <Ionicons
                    name="file-tray-stacked-outline"
                    size={22}
                    color={COLORS.background}
                  />
                </View>

                <Text className="flex-shrink text-[13px] font-bold text-salamandra-textSecondary">
                  Estoque
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ==================================================
                              ÚLTIMAS VENDAS
             ================================================== */}

          <View className="mt-7">
            <View className="mb-[14px]">
              <Text className="text-lg font-bold text-salamandra-text">
                Últimas vendas
              </Text>

              <Text className="mt-1 text-xs text-salamandra-subtle">
                Movimentações mais recentes
              </Text>
            </View>

            {dashboard.ultimasVendas.length === 0 ? (

              // ESTADO VAZIO

              <View className="items-center rounded-2xl border border-salamandra-border bg-salamandra-card px-5 py-[30px]">
                <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-salamandra-surface">
                  <Ionicons
                    name="receipt-outline"
                    size={28}
                    color={COLORS.subtle}
                  />
                </View>

                <Text className="mt-[14px] text-sm font-bold text-salamandra-textSoft">
                  Nenhuma venda registrada
                </Text>

                <Text className="mt-[5px] text-center text-xs text-salamandra-disabled">
                  As vendas mais recentes aparecerão aqui.
                </Text>
              </View>
            ) : (

              // LISTA DE VENDAS

              <View className="overflow-hidden rounded-2xl border border-salamandra-border bg-salamandra-card">
                {dashboard.ultimasVendas.map(
                  (venda, index) => (
                    <View
                      key={venda.id}
                      className={`flex-row items-center px-4 py-4 ${index <
                          dashboard.ultimasVendas.length - 1
                          ? 'border-b border-salamandra-border'
                          : ''
                        }`}
                    >

                      {/* ÍCONE */}

                      <View className="mr-3 h-11 w-11 items-center justify-center rounded-[13px] bg-salamandra-surface">
                        <Ionicons
                          name="receipt-outline"
                          size={22}
                          color={COLORS.gold}
                        />
                      </View>

                      {/* CLIENTE / DATA */}

                      <View className="flex-1">
                        <Text
                          className="text-sm font-bold text-salamandra-textSecondary"
                          numberOfLines={1}
                        >
                          {venda.cliente}
                        </Text>

                        <Text className="mt-1 text-[11px] text-salamandra-subtle">
                          {formatarData(venda.data)}
                        </Text>
                      </View>

                      {/* VALOR / STATUS */}

                      <View className="ml-3 items-end">
                        <Text className="text-sm font-bold text-salamandra-text">
                          {formatarMoeda(
                            venda.valorTotal
                          )}
                        </Text>

                        <Text className="mt-1 text-[10px] font-semibold text-salamandra-gold">
                          {venda.status}
                        </Text>
                      </View>
                    </View>
                  )
                )}
              </View>
            )}
          </View>

          <View className="h-5" />
        </ScrollView>

        {/* ==================================================
                            NAVEGAÇÃO INFERIOR
           ================================================== */}

        <View className="h-[72px] flex-row items-center justify-around border-t border-salamandra-borderSoft bg-salamandra-navigation">

          {/* INÍCIO */}

          <Pressable className="flex-1 items-center justify-center">
            <Ionicons
              name="home"
              size={23}
              color={COLORS.gold}
            />

            <Text className="mt-1 text-[10px] font-bold text-salamandra-gold">
              Início
            </Text>
          </Pressable>

          {/* RELATÓRIOS */}

          <Pressable className="flex-1 items-center justify-center">
            <Ionicons
              name="bar-chart-outline"
              size={23}
              color={COLORS.subtle}
            />

            <Text className="mt-1 text-[10px] font-semibold text-salamandra-subtle">
              Relatórios
            </Text>
          </Pressable>

          {/* MENU */}

          <Pressable className="flex-1 items-center justify-center">
            <Ionicons
              name="menu-outline"
              size={25}
              color={COLORS.subtle}
            />

            <Text className="mt-1 text-[10px] font-semibold text-salamandra-subtle">
              Menu
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}