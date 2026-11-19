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
  const [dias, produtos, clientes, estoqueBaixo, ultimas] = await Promise.all([
    supabase
      .from('faturamento_diario')
      .select('faturamento, quantidade_vendas'),
    supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true }),
    contarProdutosComEstoqueBaixo(),
    supabase
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
      .limit(5),
  ]);

  const erro = dias.error ?? produtos.error ?? clientes.error ?? ultimas.error;

  if (erro) {
    throw erro;
  }

  const linhasDias = dias.data ?? [];

  return {
    faturamento: linhasDias.reduce(
      (total, dia) => total + Number(dia.faturamento ?? 0),
      0
    ),
    quantidadeVendas: linhasDias.reduce(
      (total, dia) => total + Number(dia.quantidade_vendas ?? 0),
      0
    ),
    quantidadeProdutos: produtos.count ?? 0,
    quantidadeClientes: clientes.count ?? 0,
    estoqueBaixo,
    ultimasVendas: (ultimas.data ?? []).map((venda: any) => ({
      id: venda.id,
      data: venda.data,
      valorTotal: Number(venda.valor_total ?? 0),
      status: venda.status,
      cliente: venda.clientes?.nome ?? 'Cliente não informado',
    })),
  };
}
