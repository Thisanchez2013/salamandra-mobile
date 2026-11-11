export interface Produto {
  id: string;
  codigo: number;
  nome: string;
  descricao: string | null;
  preco_venda: number;
  created_at: string;
  quantidadeDisponivel: number;
}

export interface LoteProduto {
  id: string;
  id_produto: string;
  codigo_lote: string;
  quantidade: number;
  custo_unitario: number;
  data_entrada: string;
}

export interface ProdutoFormData {
  codigo: string;
  nome: string;
  descricao: string;
  precoVenda: string;
}

export type ProdutoFormErrors = Partial<Record<keyof ProdutoFormData, string>>;

export interface EntradaEstoqueData {
  codigoLote: string;
  quantidade: string;
  custoUnitario: string;
}

export type EntradaEstoqueErrors = Partial<Record<keyof EntradaEstoqueData, string>>;
