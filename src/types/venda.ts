export interface VendaResumo {
  id: string;
  data: string;
  valorTotal: number;
  status: string;
  cliente: string;
  vendedor: string | null;
  quantidadeItens: number;
}

export interface ItemVenda {
  id: string;
  produto: string;
  codigoProduto: number | null;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface VendaDetalhe extends VendaResumo {
  observacao: string | null;
  itens: ItemVenda[];
}

export type PeriodoVenda = 'todos' | 'hoje' | '7dias' | '30dias';
