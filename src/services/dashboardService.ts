import { supabase } from '../lib/supabase';
import { contarProdutosComEstoqueBaixo } from './produtoService';

// ==================================================
// TIPOS
// ==================================================

export interface UltimaVenda {
  id: string;
  data: string;
  valorTotal: number;
  status: string;
  cliente: string;
}

export interface DashboardDados {
  faturamento: number;
  quantidadeVendas: number;
  quantidadeProdutos: number;
  quantidadeClientes: number;
  estoqueBaixo: number;
  ultimasVendas: UltimaVenda[];
}

// ==================================================
// DASHBOARD
// ==================================================

export async function buscarDadosDashboard(): Promise<DashboardDados> {
  try {
    // ==================================================
    // FATURAMENTO E QUANTIDADE DE VENDAS
    // Somados a partir da view faturamento_diario (uma linha por dia),
    // em vez de baixar o valor de todas as vendas.
    // ==================================================

    const { data: dias, error: diasError } = await supabase
      .from('faturamento_diario')
      .select('faturamento, quantidade_vendas');

    if (diasError) {
      throw diasError;
    }

    const faturamento = (dias ?? []).reduce(
      (total, dia) => total + Number(dia.faturamento ?? 0),
      0
    );

    const quantidadeVendas = (dias ?? []).reduce(
      (total, dia) => total + Number(dia.quantidade_vendas ?? 0),
      0
    );

    // ==================================================
    // QUANTIDADE DE PRODUTOS
    // ==================================================

    const {
      count: quantidadeProdutos,
      error: produtosError,
    } = await supabase
      .from('produtos')
      .select('*', {
        count: 'exact',
        head: true,
      });

    if (produtosError) {
      throw produtosError;
    }

    // ==================================================
    // QUANTIDADE DE CLIENTES
    // ==================================================

    const {
      count: quantidadeClientes,
      error: clientesError,
    } = await supabase
      .from('clientes')
      .select('*', {
        count: 'exact',
        head: true,
      });

    if (clientesError) {
      throw clientesError;
    }

    // ==================================================
    // ESTOQUE BAIXO
    // Contado no banco pela view estoque_baixo (até 10 unidades).
    // ==================================================

    const estoqueBaixo = await contarProdutosComEstoqueBaixo();

    // ==================================================
    // ÚLTIMAS VENDAS
    // ==================================================

    const {
      data: ultimasVendasData,
      error: ultimasVendasError,
    } = await supabase
      .from('vendas')
      .select(`
        id,
        data,
        valor_total,
        status,
        clientes (
          nome
        )
      `)
      .order('data', { ascending: false })
      .limit(5);

    if (ultimasVendasError) {
      throw ultimasVendasError;
    }

    const ultimasVendas: UltimaVenda[] =
      (ultimasVendasData ?? []).map((venda: any) => ({
        id: venda.id,
        data: venda.data,
        valorTotal: Number(venda.valor_total ?? 0),
        status: venda.status,
        cliente:
          venda.clientes?.nome ??
          'Cliente não informado',
      }));

    // ==================================================
    // RETORNO
    // ==================================================

    return {
      faturamento,
      quantidadeVendas,
      quantidadeProdutos: quantidadeProdutos ?? 0,
      quantidadeClientes: quantidadeClientes ?? 0,
      estoqueBaixo,
      ultimasVendas,
    };
  } catch (error) {
    console.log(
      'Erro ao buscar dados do Dashboard:',
      error
    );

    throw error;
  }
}
