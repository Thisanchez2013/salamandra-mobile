import { supabase } from '../lib/supabase';
import { Produto } from '../types/produto';
import { buscarProdutos } from './produtoService';

// ==================================================
// TIPOS (dados brutos usados pelos relatórios)
// ==================================================

export interface VendaRelatorio {
  id: string;
  data: string;
  valorTotal: number;
  status: string;
  cliente: string;
}

export interface ItemRelatorio {
  idVenda: string;
  produto: string;
  quantidade: number;
  subtotal: number;
}

export interface DadosRelatorio {
  vendas: VendaRelatorio[];
  itens: ItemRelatorio[];
  produtos: Produto[];
}

function primeiro<T>(valor: T | T[] | null | undefined): T | null {
  if (Array.isArray(valor)) {
    return valor[0] ?? null;
  }

  return valor ?? null;
}

// ==================================================
// BUSCA
// Os números são calculados no app a partir destes dados,
// para permitir trocar o período sem novas consultas.
// ==================================================

export async function buscarDadosRelatorio(): Promise<DadosRelatorio> {
  const [vendasResposta, itensResposta, produtos] = await Promise.all([
    supabase
      .from('vendas')
      .select('id, data, valor_total, status, clientes ( nome )')
      .order('data', { ascending: false }),
    supabase
      .from('itens_venda')
      .select('id_venda, quantidade, subtotal, preco_unitario, produtos ( nome )'),
    buscarProdutos(),
  ]);

  if (vendasResposta.error) {
    throw vendasResposta.error;
  }

  if (itensResposta.error) {
    throw itensResposta.error;
  }

  const vendas: VendaRelatorio[] = (vendasResposta.data ?? []).map(
    (venda: any) => ({
      id: venda.id,
      data: venda.data,
      valorTotal: Number(venda.valor_total ?? 0),
      status: venda.status ?? '',
      cliente:
        primeiro<{ nome: string }>(venda.clientes)?.nome ??
        'Cliente não informado',
    })
  );

  const itens: ItemRelatorio[] = (itensResposta.data ?? []).map(
    (item: any) => {
      const quantidade = Number(item.quantidade ?? 0);

      return {
        idVenda: item.id_venda,
        produto:
          primeiro<{ nome: string }>(item.produtos)?.nome ??
          'Produto removido',
        quantidade,
        subtotal: Number(
          item.subtotal ?? quantidade * Number(item.preco_unitario ?? 0)
        ),
      };
    }
  );

  return { vendas, itens, produtos };
}
