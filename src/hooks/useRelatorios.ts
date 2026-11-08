import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { LIMITE_ESTOQUE_BAIXO } from '../constants/estoque';
import {
  buscarDadosRelatorio,
  DadosRelatorio,
} from '../services/relatorioService';

export type PeriodoRelatorio = '7dias' | '30dias' | 'mes' | 'todos';

export interface ItemRanking {
  nome: string;
  valor: number;
  quantidade: number;
}

const DADOS_VAZIOS: DadosRelatorio = {
  vendas: [],
  itens: [],
  produtos: [],
};

const TAMANHO_RANKING = 5;

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

// Soma valores por nome e devolve os maiores.
function ranking(
  entradas: { nome: string; valor: number; quantidade: number }[]
): ItemRanking[] {
  const mapa = new Map<string, ItemRanking>();

  entradas.forEach(({ nome, valor, quantidade }) => {
    const atual = mapa.get(nome) ?? { nome, valor: 0, quantidade: 0 };
    atual.valor += valor;
    atual.quantidade += quantidade;
    mapa.set(nome, atual);
  });

  return [...mapa.values()]
    .sort((a, b) => b.valor - a.valor)
    .slice(0, TAMANHO_RANKING);
}

export function useRelatorios() {
  const [dados, setDados] = useState<DadosRelatorio>(DADOS_VAZIOS);
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
      setDados(await buscarDadosRelatorio());
    } catch (error) {
      console.log('Erro ao carregar relatórios:', error);
      setErro(
        'Não foi possível carregar os relatórios. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

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

  // ==================================================
  // INDICADORES
  // ==================================================

  const relatorio = useMemo(() => {
    const inicio = inicioDoPeriodo(periodo);

    const vendasPeriodo = dados.vendas.filter(
      (venda) => !inicio || new Date(venda.data) >= inicio
    );

    const concluidas = vendasPeriodo.filter(
      (venda) => venda.status === 'Concluída'
    );
    const idsConcluidas = new Set(concluidas.map((venda) => venda.id));

    const itensConcluidos = dados.itens.filter((item) =>
      idsConcluidas.has(item.idVenda)
    );

    const faturamento = concluidas.reduce(
      (soma, venda) => soma + venda.valorTotal,
      0
    );

    const estoqueBaixo = dados.produtos
      .filter(
        (produto) => produto.quantidadeDisponivel <= LIMITE_ESTOQUE_BAIXO
      )
      .sort((a, b) => a.quantidadeDisponivel - b.quantidadeDisponivel);

    return {
      faturamento,
      quantidadeVendas: concluidas.length,
      ticketMedio: concluidas.length > 0 ? faturamento / concluidas.length : 0,
      itensVendidos: itensConcluidos.reduce(
        (soma, item) => soma + item.quantidade,
        0
      ),
      canceladas: vendasPeriodo.filter((venda) =>
        venda.status.toLocaleLowerCase('pt-BR').startsWith('cancel')
      ).length,
      maisVendidos: ranking(
        itensConcluidos.map((item) => ({
          nome: item.produto,
          valor: item.subtotal,
          quantidade: item.quantidade,
        }))
      ),
      melhoresClientes: ranking(
        concluidas.map((venda) => ({
          nome: venda.cliente,
          valor: venda.valorTotal,
          quantidade: 1,
        }))
      ),
      estoqueBaixo,
    };
  }, [dados, periodo]);

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
