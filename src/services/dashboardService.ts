import { supabase } from '../lib/supabase';

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
    // FATURAMENTO
    // ==================================================

    const { data: vendas, error: vendasError } = await supabase
      .from('vendas')
      .select('valor_total')
      .eq('status', 'Concluída');

    if (vendasError) {
      throw vendasError;
    }

    const faturamento = (vendas ?? []).reduce(
      (total, venda) => total + Number(venda.valor_total ?? 0),
      0
    );

    // ==================================================
    // QUANTIDADE DE VENDAS
    // ==================================================

    const {
      count: quantidadeVendas,
      error: quantidadeVendasError,
    } = await supabase
      .from('vendas')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('status', 'Concluída');

    if (quantidadeVendasError) {
      throw quantidadeVendasError;
    }

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
    // Consideramos estoque <= 10 por enquanto.
    // ==================================================

    const {
      count: estoqueBaixo,
      error: estoqueError,
    } = await supabase
      .from('produtos')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .lte('quantidade_estoque', 10);

    if (estoqueError) {
      throw estoqueError;
    }

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
      quantidadeVendas: quantidadeVendas ?? 0,
      quantidadeProdutos: quantidadeProdutos ?? 0,
      quantidadeClientes: quantidadeClientes ?? 0,
      estoqueBaixo: estoqueBaixo ?? 0,
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