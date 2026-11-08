import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/ui/AppHeader';
import { COLORS } from '../constants/theme';
import { supabase } from '../lib/supabase';

interface PerfilUsuario {
  nome: string;
  usuario: string;
  perfil: string;
}

interface ItemMenuProps {
  icon: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao: string;
  onPress: () => void;
  emBreve?: boolean;
  destrutivo?: boolean;
}

// ==================================================
// ITEM DO MENU
// ==================================================

function ItemMenu({
  icon,
  titulo,
  descricao,
  onPress,
  emBreve = false,
  destrutivo = false,
}: ItemMenuProps) {
  const corIcone = destrutivo
    ? COLORS.error
    : emBreve
      ? COLORS.subtle
      : COLORS.gold;

  return (
    <Pressable
      className="mb-3 flex-row items-center rounded-2xl border border-salamandra-border bg-salamandra-card p-4 active:opacity-80"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={titulo}
    >
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-[13px] bg-salamandra-surface">
        <Ionicons
          name={icon}
          size={22}
          color={corIcone}
        />
      </View>

      <View className="flex-1">
        <Text
          className={`text-sm font-bold ${
            destrutivo
              ? 'text-salamandra-error'
              : emBreve
                ? 'text-salamandra-muted'
                : 'text-salamandra-textSecondary'
          }`}
        >
          {titulo}
        </Text>

        <Text className="mt-1 text-xs text-salamandra-muted">
          {descricao}
        </Text>
      </View>

      {emBreve ? (
        <View className="rounded-lg bg-salamandra-surface px-2 py-1">
          <Text className="text-[10px] font-bold text-salamandra-gold">
            EM BREVE
          </Text>
        </View>
      ) : destrutivo ? null : (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.subtle}
        />
      )}
    </Pressable>
  );
}

// ==================================================
// TÍTULO DE SEÇÃO
// ==================================================

function TituloSecao({ titulo }: { titulo: string }) {
  return (
    <Text className="mb-3 mt-6 text-[11px] font-bold tracking-[1.2px] text-salamandra-muted">
      {titulo}
    </Text>
  );
}

// ==================================================
// TELA
// ==================================================

export default function MenuScreen() {
  const router = useRouter();

  const [perfil, setPerfil] =
    useState<PerfilUsuario | null>(null);
  const [carregandoPerfil, setCarregandoPerfil] =
    useState(true);

  const carregarPerfil = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/');
        return;
      }

      const { data, error } = await supabase
        .from('perfis')
        .select('nome, usuario, perfil')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.log('Erro ao carregar perfil:', error);
        return;
      }

      setPerfil(data);
    } catch (error) {
      console.log(
        'Erro inesperado ao carregar perfil:',
        error
      );
    } finally {
      setCarregandoPerfil(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      carregarPerfil();
    }, [carregarPerfil])
  );

  // ==================================================
  // AÇÕES
  // ==================================================

  function avisarEmBreve(funcionalidade: string) {
    Alert.alert(
      'Em breve',
      `${funcionalidade} ainda está em desenvolvimento.`
    );
  }

  function mostrarSobre() {
    Alert.alert(
      'Salamandra Mobile',
      'Sistema de gestão de clientes, produtos, estoque e vendas.\n\nProjeto Integrador.'
    );
  }

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
                console.log('Erro ao sair:', error);

                Alert.alert(
                  'Erro',
                  'Não foi possível sair da sua conta.'
                );

                return;
              }

              // Limpa o histórico de telas para o botão
              // "voltar" não retornar para dentro do sistema.
              if (router.canDismiss()) {
                router.dismissAll();
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

  const inicial =
    perfil?.nome.trim().charAt(0).toUpperCase() ?? '?';

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <AppHeader
        title="Menu"
        subtitle="Navegação e conta"
        onBack={() => router.back()}
      />

      <ScrollView
        className="flex-1 px-[22px]"
        showsVerticalScrollIndicator={false}
      >

        {/* ==================================================
                            CARTÃO DO USUÁRIO
           ================================================== */}

        <View className="mt-5 flex-row items-center rounded-[18px] border border-salamandra-border bg-salamandra-card p-5">
          {carregandoPerfil ? (
            <View className="h-14 flex-1 items-center justify-center">
              <ActivityIndicator
                size="small"
                color={COLORS.gold}
              />
            </View>
          ) : (
            <>
              <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-salamandra-gold">
                <Text className="text-xl font-extrabold text-salamandra-background">
                  {inicial}
                </Text>
              </View>

              <View className="flex-1">
                <Text
                  className="text-base font-bold text-salamandra-text"
                  numberOfLines={1}
                >
                  {perfil?.nome ?? 'Usuário'}
                </Text>

                {perfil ? (
                  <Text className="mt-1 text-xs text-salamandra-muted">
                    @{perfil.usuario}
                  </Text>
                ) : null}
              </View>

              {perfil?.perfil ? (
                <View className="rounded-lg border border-salamandra-gold px-2.5 py-1">
                  <Text className="text-[10px] font-bold tracking-[1px] text-salamandra-gold">
                    {perfil.perfil}
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </View>

        {/* ==================================================
                              CADASTROS
           ================================================== */}

        <TituloSecao titulo="CADASTROS" />

        <ItemMenu
          icon="people-outline"
          titulo="Clientes"
          descricao="Cadastre e consulte clientes"
          onPress={() => router.push('/clientes')}
        />

        <ItemMenu
          icon="cube-outline"
          titulo="Produtos"
          descricao="Catálogo e preços de venda"
          onPress={() => router.push('/produtos')}
        />

        <ItemMenu
          icon="file-tray-stacked-outline"
          titulo="Estoque"
          descricao="Saldo e entradas por lote"
          onPress={() => router.push('/produtos')}
        />

        {/* ==================================================
                                VENDAS
           ================================================== */}

        <TituloSecao titulo="VENDAS" />

        <ItemMenu
          icon="cart-outline"
          titulo="Nova venda"
          descricao="Registrar uma venda"
          onPress={() => avisarEmBreve('O módulo de vendas')}
          emBreve
        />

        <ItemMenu
          icon="receipt-outline"
          titulo="Histórico de vendas"
          descricao="Consultar vendas realizadas"
          onPress={() => router.push('/vendas')}
        />

        {/* ==================================================
                                CONTA
           ================================================== */}

        <TituloSecao titulo="CONTA" />

        <ItemMenu
          icon="information-circle-outline"
          titulo="Sobre o app"
          descricao="Informações do Salamandra"
          onPress={mostrarSobre}
        />

        <ItemMenu
          icon="log-out-outline"
          titulo="Sair"
          descricao="Encerrar a sessão neste aparelho"
          onPress={handleLogout}
          destrutivo
        />

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
