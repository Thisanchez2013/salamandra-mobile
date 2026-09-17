import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <View className="flex-1 bg-salamandra-background">

        <ScrollView
          className="flex-1 bg-salamandra-background px-[22px] pt-5"
          showsVerticalScrollIndicator={false}
        >
          {/* ==================================================
              CABEÇALHO
          ================================================== */}

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[21px] font-extrabold tracking-[2.2px] text-salamandra-gold">
                SALAMANDRA
              </Text>

              <Text className="mt-[3px] text-[11px] text-[#777777]">
                Sistema de Gestão
              </Text>
            </View>

            <Pressable className="h-11 w-11 items-center justify-center rounded-[14px] border border-salamandra-border bg-salamandra-card active:opacity-70">
              <Ionicons
                name="person-outline"
                size={22}
                color="#D4AF37"
              />
            </Pressable>
          </View>

          {/* ==================================================
              BOAS-VINDAS
          ================================================== */}

          <View className="mb-6 mt-[34px]">
            <Text className="text-[25px] font-bold text-white">
              Bom dia, Thiago 👋
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

                <Text className="mt-2 text-[30px] font-extrabold text-white">
                  R$ 0,00
                </Text>
              </View>

              <View className="h-12 w-12 items-center justify-center rounded-[14px] bg-[#272727]">
                <Ionicons
                  name="cash-outline"
                  size={24}
                  color="#D4AF37"
                />
              </View>
            </View>

            <View className="my-4 h-px bg-[#303030]" />

            <Text className="text-xs text-[#777777]">
              Vendas realizadas no período
            </Text>
          </View>

          {/* ==================================================
              INDICADORES
          ================================================== */}

          <View className="mt-[14px] flex-row flex-wrap justify-between">

            {/* VENDAS */}

            <View className="mb-3 min-h-[135px] w-[48.5%] rounded-2xl border border-[#303030] bg-[#1A1A1A] p-4">
              <View className="flex-row items-center justify-between">
                <Ionicons
                  name="cart-outline"
                  size={22}
                  color="#D4AF37"
                />

                <Text className="text-[25px] font-extrabold text-white">
                  0
                </Text>
              </View>

              <Text className="mt-[18px] text-sm font-bold text-[#E8E8E8]">
                Vendas
              </Text>

              <Text className="mt-1 text-[11px] text-[#707070]">
                Realizadas
              </Text>
            </View>

            {/* PRODUTOS */}

            <View className="mb-3 min-h-[135px] w-[48.5%] rounded-2xl border border-[#303030] bg-[#1A1A1A] p-4">
              <View className="flex-row items-center justify-between">
                <Ionicons
                  name="cube-outline"
                  size={22}
                  color="#D4AF37"
                />

                <Text className="text-[25px] font-extrabold text-white">
                  0
                </Text>
              </View>

              <Text className="mt-[18px] text-sm font-bold text-[#E8E8E8]">
                Produtos
              </Text>

              <Text className="mt-1 text-[11px] text-[#707070]">
                Cadastrados
              </Text>
            </View>

            {/* CLIENTES */}

            <View className="mb-3 min-h-[135px] w-[48.5%] rounded-2xl border border-[#303030] bg-[#1A1A1A] p-4">
              <View className="flex-row items-center justify-between">
                <Ionicons
                  name="people-outline"
                  size={22}
                  color="#D4AF37"
                />

                <Text className="text-[25px] font-extrabold text-white">
                  0
                </Text>
              </View>

              <Text className="mt-[18px] text-sm font-bold text-[#E8E8E8]">
                Clientes
              </Text>

              <Text className="mt-1 text-[11px] text-[#707070]">
                Cadastrados
              </Text>
            </View>

            {/* ESTOQUE BAIXO */}

            <View className="mb-3 min-h-[135px] w-[48.5%] rounded-2xl border border-[#303030] bg-[#1A1A1A] p-4">
              <View className="flex-row items-center justify-between">
                <Ionicons
                  name="warning-outline"
                  size={22}
                  color="#D4AF37"
                />

                <Text className="text-[25px] font-extrabold text-white">
                  0
                </Text>
              </View>

              <Text className="mt-[18px] text-sm font-bold text-[#E8E8E8]">
                Estoque baixo
              </Text>

              <Text className="mt-1 text-[11px] text-[#707070]">
                Produtos
              </Text>
            </View>
          </View>

          {/* ==================================================
              AÇÕES RÁPIDAS
          ================================================== */}

          <View className="mt-7">
            <View className="mb-[14px]">
              <Text className="text-lg font-bold text-white">
                Ações rápidas
              </Text>

              <Text className="mt-1 text-xs text-[#777777]">
                Acesse as principais funções
              </Text>
            </View>

            <View className="flex-row flex-wrap justify-between">

              {/* NOVA VENDA */}

              <Pressable className="mb-3 h-16 w-[48.5%] flex-row items-center rounded-[15px] border border-salamandra-border bg-salamandra-card px-[14px] active:opacity-70">
                <View className="mr-[11px] h-9 w-9 items-center justify-center rounded-[10px] bg-salamandra-gold">
                  <Ionicons
                    name="add-outline"
                    size={24}
                    color="#121212"
                  />
                </View>

                <Text className="flex-shrink text-[13px] font-bold text-[#E8E8E8]">
                  Nova venda
                </Text>
              </Pressable>

              {/* PRODUTOS */}

              <Pressable className="mb-3 h-16 w-[48.5%] flex-row items-center rounded-[15px] border border-salamandra-border bg-salamandra-card px-[14px] active:opacity-70">
                <View className="mr-[11px] h-9 w-9 items-center justify-center rounded-[10px] bg-salamandra-gold">
                  <Ionicons
                    name="cube-outline"
                    size={22}
                    color="#121212"
                  />
                </View>

                <Text className="flex-shrink text-[13px] font-bold text-[#E8E8E8]">
                  Produtos
                </Text>
              </Pressable>

              {/* CLIENTES */}

              <Pressable className="mb-3 h-16 w-[48.5%] flex-row items-center rounded-[15px] border border-salamandra-border bg-salamandra-card px-[14px] active:opacity-70">
                <View className="mr-[11px] h-9 w-9 items-center justify-center rounded-[10px] bg-salamandra-gold">
                  <Ionicons
                    name="people-outline"
                    size={22}
                    color="#121212"
                  />
                </View>

                <Text className="flex-shrink text-[13px] font-bold text-[#E8E8E8]">
                  Clientes
                </Text>
              </Pressable>

              {/* ESTOQUE */}

              <Pressable className="mb-3 h-16 w-[48.5%] flex-row items-center rounded-[15px] border border-salamandra-border bg-salamandra-card px-[14px] active:opacity-70">
                <View className="mr-[11px] h-9 w-9 items-center justify-center rounded-[10px] bg-salamandra-gold">
                  <Ionicons
                    name="file-tray-stacked-outline"
                    size={22}
                    color="#121212"
                  />
                </View>

                <Text className="flex-shrink text-[13px] font-bold text-[#E8E8E8]">
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
              <Text className="text-lg font-bold text-white">
                Últimas vendas
              </Text>

              <Text className="mt-1 text-xs text-[#777777]">
                Movimentações mais recentes
              </Text>
            </View>

            <View className="items-center rounded-2xl border border-[#303030] bg-[#1A1A1A] px-5 py-[30px]">
              <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#242424]">
                <Ionicons
                  name="receipt-outline"
                  size={28}
                  color="#777777"
                />
              </View>

              <Text className="mt-[14px] text-sm font-bold text-[#D6D6D6]">
                Nenhuma venda registrada
              </Text>

              <Text className="mt-[5px] text-center text-xs text-[#707070]">
                As vendas mais recentes aparecerão aqui.
              </Text>
            </View>
          </View>

          {/* Espaço para não ficar atrás da navegação */}
          <View className="h-5" />
        </ScrollView>

        {/* ==================================================
            NAVEGAÇÃO INFERIOR
        ================================================== */}

        <View className="h-[72px] flex-row items-center justify-around border-t border-[#292929] bg-[#181818]">

          {/* INÍCIO */}

          <Pressable className="flex-1 items-center justify-center">
            <Ionicons
              name="home"
              size={23}
              color="#D4AF37"
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
              color="#777777"
            />

            <Text className="mt-1 text-[10px] font-semibold text-[#777777]">
              Relatórios
            </Text>
          </Pressable>

          {/* MENU */}

          <Pressable className="flex-1 items-center justify-center">
            <Ionicons
              name="menu-outline"
              size={25}
              color="#777777"
            />

            <Text className="mt-1 text-[10px] font-semibold text-[#777777]">
              Menu
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}