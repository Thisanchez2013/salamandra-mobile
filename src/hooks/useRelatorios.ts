import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { exportarRelatorioExcel } from '../services/exportacaoService';
import { buscarRelatorio, FiltroPeriodo, Relatorio } from '../services/relatorioService';

export type { ItemRanking } from '../services/relatorioService';

export type PeriodoRelatorio = '7dias' | '30dias' | 'mes' | 'todos' | 'personalizado';
export type TipoRelatorio = 'saida' | 'entrada' | 'ambos';

const RELATORIO_VAZIO: Relatorio = {
  entradas: { lotes: 0, unidades: 0, custoTotal: 0 },
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

function montarFiltro(
  periodo: PeriodoRelatorio,
  dataInicial: Date,
  dataFinal: Date
): FiltroPeriodo {
  if (periodo === 'personalizado') {
    const inicio = new Date(dataInicial);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(dataFinal);
    fim.setHours(23, 59, 59, 999);
    return { diaInicial: formatarDia(inicio), diaFinal: formatarDia(fim), inicio, fim };
  }

  const inicio = inicioDoPeriodo(periodo);
  return { diaInicial: inicio ? formatarDia(inicio) : null, diaFinal: null, inicio, fim: null };
}

export function useRelatorios() {
  const [relatorio, setRelatorio] = useState<Relatorio>(RELATORIO_VAZIO);
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>('30dias');
  const [tipo, setTipo] = useState<TipoRelatorio>('ambos');
  const [dataInicial, setDataInicial] = useState(() => {
    const data = new Date();
    data.setDate(1);
    return data;
  });
  const [dataFinal, setDataFinal] = useState(() => new Date());
  const [exportando, setExportando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // ==================================================
  // CARREGAMENTO
  // ==================================================

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setRelatorio(
        await buscarRelatorio(montarFiltro(periodo, dataInicial, dataFinal), tipo !== 'saida')
      );
    } catch (error) {
      console.log('Erro ao carregar relatórios:', error);
      setErro(
        'Não foi possível carregar os relatórios. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }, [periodo, dataInicial, dataFinal, tipo]);

  const atualizar = useCallback(async () => {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }, [carregar]);

  const tentarNovamente = useCallback(async () => {
    setCarregando(true);
    await carregar();
  }, [carregar]);

  const exportar = useCallback(async () => {
    try {
      setExportando(true);
      await exportarRelatorioExcel(montarFiltro(periodo, dataInicial, dataFinal), tipo);
    } catch (error) {
      console.log('Erro ao exportar relatório:', error);
      Alert.alert('Erro ao exportar', 'Não foi possível gerar a planilha. Tente novamente.');
    } finally {
      setExportando(false);
    }
  }, [periodo, dataInicial, dataFinal, tipo]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  return {
    relatorio,
    periodo,
    setPeriodo,
    tipo,
    setTipo,
    dataInicial,
    setDataInicial,
    dataFinal,
    setDataFinal,
    exportar,
    exportando,
    carregando,
    atualizando,
    erro,
    atualizar,
    tentarNovamente,
  };
}
