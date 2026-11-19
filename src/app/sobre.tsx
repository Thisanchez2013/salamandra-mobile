import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/ui/AppHeader';
import { INSTITUICAO, INTEGRANTES } from '../constants/equipe';
import { COLORS } from '../constants/theme';

export default function SobreScreen() {
  const router = useRouter();
  const versao = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <AppHeader
        title="Sobre o app"
        subtitle="Informações do Salamandra"
        onBack={() => router.back()}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-[22px] pb-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-8 items-center">
          <Image
            source={require('../../assets/images/logo-glow.png')}
            style={{ width: 120, height: 120 }}
            contentFit="contain"
          />

          <Text className="mt-4 text-2xl font-extrabold text-salamandra-text">
            Salamandra Mobile
          </Text>

          <Text className="mt-1 text-xs text-salamandra-muted">
            Versão {versao}
          </Text>

          <Text className="mt-4 text-center text-sm leading-6 text-salamandra-textSoft">
            Sistema de gestão de clientes, produtos, estoque por lotes e vendas
            de uma incensaria.
          </Text>
        </View>

        <Text className="mb-3 mt-8 text-[11px] font-bold tracking-[1.2px] text-salamandra-muted">
          EQUIPE
        </Text>

        <View className="rounded-2xl border border-salamandra-border bg-salamandra-card">
          {INTEGRANTES.map((integrante, index) => (
            <View
              key={integrante.nome}
              className={`flex-row items-center px-4 py-3.5 ${
                index > 0 ? 'border-t border-salamandra-border' : ''
              }`}
            >
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-salamandra-surface">
                <Ionicons name="person-outline" size={18} color={COLORS.gold} />
              </View>

              <Text className="flex-1 text-sm font-bold text-salamandra-textSecondary">
                {integrante.nome}
              </Text>

              {integrante.ra ? (
                <Text className="text-xs text-salamandra-muted">RA {integrante.ra}</Text>
              ) : null}
            </View>
          ))}
        </View>

        <View className="mt-6 flex-row rounded-[14px] border border-salamandra-border bg-salamandra-card p-4">
          <Ionicons name="school-outline" size={20} color={COLORS.gold} />
          <Text className="ml-3 flex-1 text-xs leading-5 text-salamandra-muted">
            Projeto Integrador · {INSTITUICAO}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
