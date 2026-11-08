import { supabase } from '../lib/supabase';
import { ItemVenda, VendaDetalhe, VendaResumo } from '../types/venda';

// ==================================================
// MAPEAMENTO
// ==================================================

// O Supabase pode devolver a relação como objeto ou lista,
// dependendo de como a chave estrangeira foi criada.
function primeiro<T>(valor: T | T[] | null | undefined): T | null {
  if (Array.isArray(valor)) {
    return valor[0] ?? null;
  }

  return valor ?? null;
}

function mapearResumo(venda: any): VendaResumo {
  const cliente = primeiro<{ nome: string }>(venda.clientes);
  const vendedor = primeiro<{ nome: string }>(venda.perfis);
  const contagem = primeiro<{ count: number }>(venda.itens_venda);

  return {
    id: venda.id,
    data: venda.data,
    valorTotal: Number(venda.valor_total ?? 0),
    status: venda.status ?? 'Sem status',
    cliente: cliente?.nome ?? 'Cliente não informado',
    vendedor: vendedor?.nome ?? null,
    quantidadeItens: Number(contagem?.count ?? 0),
  };
}

// ==================================================
// LISTAGEM
// ==================================================

export async function buscarVendas(): Promise<VendaResumo[]> {
  const { data, error } = await supabase
    .from('vendas')
    .select(`
      id,
      data,
      valor_total,
      status,
      clientes ( nome ),
      perfis ( nome ),
      itens_venda ( count )
    `)
    .order('data', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapearResumo);
}

// ==================================================
// DETALHE
// ==================================================

export async function buscarVendaPorId(
  id: string
): Promise<VendaDetalhe | null> {
  const { data, error } = await supabase
    .from('vendas')
    .select(`
      id,
      data,
      valor_total,
      status,
      observacao,
      clientes ( nome ),
      perfis ( nome ),
      itens_venda (
        id,
        quantidade,
        preco_unitario,
        subtotal,
        produtos ( nome, codigo )
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const itens: ItemVenda[] = ((data as any).itens_venda ?? []).map(
    (item: any) => {
      const produto = primeiro<{ nome: string; codigo: number }>(
        item.produtos
      );
      const quantidade = Number(item.quantidade ?? 0);
      const precoUnitario = Number(item.preco_unitario ?? 0);

      return {
        id: item.id,
        produto: produto?.nome ?? 'Produto removido',
        codigoProduto: produto?.codigo ?? null,
        quantidade,
        precoUnitario,
        subtotal: Number(item.subtotal ?? quantidade * precoUnitario),
      };
    }
  );

  return {
    ...mapearResumo({ ...data, itens_venda: [{ count: itens.length }] }),
    observacao: (data as any).observacao ?? null,
    itens,
  };
}
