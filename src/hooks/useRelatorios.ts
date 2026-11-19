import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { buscarRelatorio, Relatorio } from '../services/relatorioService';

export type { ItemRanking } from '../services/relatorioService';

export type PeriodoRelatorio = '7dias' | '30dias' | 'mes' | 'todos';

const RELATORIO_VAZIO: Relatorio = {
  faturamento: 0,
  quantidadeVendas: 0,
  ticketMedio: 0,
  itensVendidos: 0,
  canceladas: 0,
  maisVendidos: [],
  melhoresClientes: [],
  estoqueBaixo: [],
};

function inicioDoPeriodo(periodo: PeriodoRelatorio): Date | null {
  if (periodo === 'todos') {
    return null;
  }

  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);

  if (periodo === '7dias') {
    inicio.setDate(inicio.getDate() - 6);
  } else if (periodo === '30dias') {
    inicio.setDate(inicio.getDate() - 29);
  } else {
    inicio.setDate(1); // primeiro dia do mês atual
  }

  return inicio;
}

function formatarDia(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export function useRelatorios() {
  const [relatorio, setRelatorio] = useState<Relatorio>(RELATORIO_VAZIO);
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>('30dias');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // ==================================================
  // CARREGAMENTO
  // ==================================================

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const inicio = inicioDoPeriodo(periodo);
      setRelatorio(
        await buscarRelatorio(inicio ? formatarDia(inicio) : null, inicio)
      );
    } catch (error) {
      console.log('Erro ao carregar relatórios:', error);
      setErro(
        'Não foi possível carregar os relatórios. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }, [periodo]);

  const atualizar = useCallback(async () => {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }, [carregar]);

  const tentarNovamente = useCallback(async () => {
    setCarregando(true);
    await carregar();
  }, [carregar]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  return {
    relatorio,
    periodo,
    setPeriodo,
    carregando,
    atualizando,
    erro,
    atualizar,
    tentarNovamente,
  };
}
