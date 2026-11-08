import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/ui/AppHeader';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/ui/EstadosTela';
import { FiltroChips, OpcaoChip } from '../components/ui/FiltroChips';
import { COLORS } from '../constants/theme';
import { usePermissoes } from '../hooks/usePermissoes';
import {
  buscarAuditoria,
  RegistroAuditoria,
} from '../services/auditoriaService';

type FiltroAcao = 'todas' | 'CRIAR' | 'EDITAR' | 'EXCLUIR' | 'ENTRADA_ESTOQUE';

const FILTROS: OpcaoChip<FiltroAcao>[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'CRIAR', rotulo: 'Cadastros' },
  { valor: 'EDITAR', rotulo: 'Edições' },
  { valor: 'EXCLUIR', rotulo: 'Exclusões' },
  { valor: 'ENTRADA_ESTOQUE', rotulo: 'Estoque' },
];

// Ícone, cor e texto de cada tipo de ação.
const ESTILO_ACAO: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; cor: string; rotulo: string }
> = {
  CRIAR: { icon: 'add-circle-outline', cor: COLORS.gold, rotulo: 'Cadastro' },
  EDITAR: { icon: 'create-outline', cor: COLORS.textSoft, rotulo: 'Edição' },
  EXCLUIR: { icon: 'trash-outline', cor: COLORS.error, rotulo: 'Exclusão' },
  ENTRADA_ESTOQUE: {
    icon: 'file-tray-stacked-outline',
    cor: COLORS.gold,
    rotulo: 'Entrada de estoque',
  },
};

function formatarDataHora(valor: string) {
  return new Date(valor).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ItemAuditoria({ registro }: { registro: RegistroAuditoria }) {
  const estilo = ESTILO_ACAO[registro.acao] ?? {
    icon: 'ellipse-outline',
    cor: COLORS.muted,
    rotulo: registro.acao,
  };

  return (
    <View className="mb-3 flex-row rounded-2xl border border-salamandra-border bg-salamandra-card p-4">
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-[13px] bg-salamandra-surface">
        <Ionicons
          name={estilo.icon}
          size={21}
          color={estilo.cor}
        />
      </View>

      <View className="flex-1">
        <Text
          className="text-[11px] font-bold tracking-[0.8px]"
          style={{ color: estilo.cor }}
        >
          {estilo.rotulo.toUpperCase()}
        </Text>

        <Text className="mt-1 text-sm font-bold text-salamandra-textSecondary">
          {registro.descricao ?? '—'}
        </Text>

        <Text className="mt-1 text-[11px] text-salamandra-subtle">
          {registro.usuario} · {formatarDataHora(registro.dataHora)}
        </Text>
      </View>
    </View>
  );
}

export default function AuditoriaScreen() {
  const router = useRouter();
  const { podeVerAuditoria } = usePermissoes();

  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [filtro, setFiltro] = useState<FiltroAcao>('todas');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setRegistros(await buscarAuditoria());
    } catch (error) {
      console.log('Erro ao carregar auditoria:', error);
      setErro(
        'Não foi possível carregar a auditoria. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (podeVerAuditoria) carregar();
    }, [carregar, podeVerAuditoria])
  );

  async function atualizar() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  const filtrados = useMemo(
    () =>
      filtro === 'todas'
        ? registros
        : registros.filter((registro) => registro.acao === filtro),
    [registros, filtro]
  );

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <AppHeader
        title="Auditoria"
        subtitle="Histórico de alterações"
        onBack={() => router.back()}
      />

      {!podeVerAuditoria ? (
        <View className="px-[22px] pt-6">
          <EmptyState
            icon="lock-closed-outline"
            titulo="Acesso restrito"
            descricao="Somente administradores e gerentes podem ver a auditoria."
          />
        </View>
      ) : carregando ? (
        <LoadingState mensagem="Carregando auditoria..." />
      ) : erro ? (
        <View className="px-[22px]">
          <ErrorState
            mensagem={erro}
            onRetry={() => {
              setCarregando(true);
              carregar();
            }}
          />
        </View>
      ) : (
        <FlatList
          className="flex-1"
          contentContainerClassName="px-[22px] pb-8"
          data={filtrados}
          keyExtractor={(registro) => registro.id}
          ListHeaderComponent={
            <View>
              <View className="mt-2">
                <FiltroChips
                  opcoes={FILTROS}
                  selecionado={filtro}
                  onChange={setFiltro}
                />
              </View>

              <View className="mb-3 mt-6 flex-row items-center justify-between">
                <Text className="text-base font-bold text-salamandra-text">
                  Registros
                </Text>

                <Text className="text-xs text-salamandra-muted">
                  {filtrados.length}{' '}
                  {filtrados.length === 1 ? 'registro' : 'registros'}
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="shield-checkmark-outline"
              titulo="Nenhum registro"
              descricao="Cadastros, edições e exclusões feitos pelo app aparecerão aqui."
            />
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={atualizar}
              tintColor={COLORS.gold}
              colors={[COLORS.gold]}
            />
          }
          renderItem={({ item }) => <ItemAuditoria registro={item} />}
        />
      )}
    </SafeAreaView>
  );
}
