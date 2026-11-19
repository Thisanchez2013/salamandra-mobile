import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { buscarVendas } from '../services/vendaService';
import { PeriodoVenda, VendaResumo } from '../types/venda';

// Data mínima de cada período (início do dia).
function inicioDoPeriodo(periodo: PeriodoVenda): Date | null {
  if (periodo === 'todos') {
    return null;
  }

  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);

  if (periodo === '7dias') {
    inicio.setDate(inicio.getDate() - 6);
  }

  if (periodo === '30dias') {
    inicio.setDate(inicio.getDate() - 29);
  }

  return inicio;
}

export function useVendas() {
  const [vendas, setVendas] = useState<VendaResumo[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [periodo, setPeriodo] = useState<PeriodoVenda>('todos');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // ==================================================
  // CARREGAMENTO
  // ==================================================

  const carregarVendas = useCallback(async () => {
    try {
      setErro(null);
      setVendas(await buscarVendas());
    } catch (error) {
      console.log('Erro ao carregar vendas:', error);
      setErro(
        'Não foi possível carregar as vendas. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  const atualizar = useCallback(async () => {
    setAtualizando(true);
    await carregarVendas();
    setAtualizando(false);
  }, [carregarVendas]);

  const tentarNovamente = useCallback(async () => {
    setCarregando(true);
    await carregarVendas();
  }, [carregarVendas]);

  useFocusEffect(
    useCallback(() => {
      carregarVendas();
    }, [carregarVendas])
  );

  // ==================================================
  // FILTROS
  // ==================================================

  const vendasFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLocaleLowerCase('pt-BR');
    const inicio = inicioDoPeriodo(periodo);

    return vendas.filter((venda) => {
      if (inicio && new Date(venda.data) < inicio) {
        return false;
      }

      if (!termo) {
        return true;
      }

      return venda.cliente.toLocaleLowerCase('pt-BR').includes(termo);
    });
  }, [vendas, pesquisa, periodo]);

  // Resumo considera só as vendas concluídas do filtro atual.
  const resumo = useMemo(() => {
    const concluidas = vendasFiltradas.filter(
      (venda) => venda.status === 'Concluída'
    );

    return {
      total: concluidas.reduce((soma, venda) => soma + venda.valorTotal, 0),
      quantidade: concluidas.length,
    };
  }, [vendasFiltradas]);

  return {
    vendas,
    vendasFiltradas,
    resumo,
    pesquisa,
    setPesquisa,
    periodo,
    setPeriodo,
    carregando,
    atualizando,
    erro,
    atualizar,
    tentarNovamente,
  };
}
