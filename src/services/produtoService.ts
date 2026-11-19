import { supabase } from '../lib/supabase';
import { EntradaEstoqueData, LoteProduto, Produto, ProdutoFormData } from '../types/produto';
import { converterMoeda } from '../utils/currency';
import { garantirExcluido } from '../utils/erros';

type ProdutoRow = Omit<Produto, 'quantidadeDisponivel'>;
type LoteRow = LoteProduto;
const TAMANHO_PAGINA = 1000;

async function buscarTodosOsLotes(idProduto?: string): Promise<LoteRow[]> {
  const lotes: LoteRow[] = [];
  let inicio = 0;
  while (true) {
    let consulta = supabase
      .from('lotes_produto')
      .select('id, id_produto, codigo_lote, quantidade, custo_unitario, data_entrada')
      .order('data_entrada', { ascending: true })
      .order('id', { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (idProduto) consulta = consulta.eq('id_produto', idProduto);
    const { data, error } = await consulta;
    if (error) throw error;
    const pagina = (data ?? []) as LoteRow[];
    lotes.push(...pagina);
    if (pagina.length < TAMANHO_PAGINA) return lotes;
    inicio += TAMANHO_PAGINA;
  }
}

// Linha da view saldo_produtos (sql/02_saldo_produtos.sql):
// o banco já devolve o saldo somado dos lotes de cada produto.
type SaldoRow = ProdutoRow & { quantidade_disponivel: number };

async function buscarSaldoProdutos(): Promise<SaldoRow[]> {
  const produtos: SaldoRow[] = [];
  let inicio = 0;
  while (true) {
    const { data, error } = await supabase
      .from('saldo_produtos')
      .select('id, codigo, nome, descricao, preco_venda, created_at, quantidade_disponivel')
      .order('nome', { ascending: true })
      .order('id', { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (error) throw error;
    const pagina = (data ?? []) as SaldoRow[];
    produtos.push(...pagina);
    if (pagina.length < TAMANHO_PAGINA) return produtos;
    inicio += TAMANHO_PAGINA;
  }
}

function mapearProduto(row: ProdutoRow, lotes: LoteRow[]): Produto {
  return {
    ...row,
    preco_venda: Number(row.preco_venda),
    quantidadeDisponivel: lotes.reduce((total, lote) => total + Number(lote.quantidade), 0),
  };
}

export async function buscarProdutos(): Promise<Produto[]> {
  const produtos = await buscarSaldoProdutos();

  return produtos.map(({ quantidade_disponivel, ...produto }) => ({
    ...produto,
    preco_venda: Number(produto.preco_venda),
    quantidadeDisponivel: Number(quantidade_disponivel),
  }));
}

// Conta direto no banco (view estoque_baixo, sql/04_relatorios.sql),
// sem baixar a lista de produtos.
export async function contarProdutosComEstoqueBaixo(): Promise<number> {
  const { count, error } = await supabase
    .from('estoque_baixo')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function buscarProdutoPorId(id: string): Promise<{ produto: Produto; lotes: LoteProduto[] } | null> {
  const [{ data: produto, error: produtoError }, lotes] = await Promise.all([
    supabase.from('produtos').select('id, codigo, nome, descricao, preco_venda, created_at').eq('id', id).maybeSingle(),
    buscarTodosOsLotes(id),
  ]);
  if (produtoError) throw produtoError;
  if (!produto) return null;

  const lotesTipados = lotes as LoteProduto[];
  return { produto: mapearProduto(produto as ProdutoRow, lotesTipados), lotes: lotesTipados };
}

function dadosProduto(form: ProdutoFormData) {
  return {
    codigo: Number(form.codigo),
    nome: form.nome.trim(),
    descricao: form.descricao.trim() || null,
    preco_venda: converterMoeda(form.precoVenda),
  };
}

export async function salvarProduto(form: ProdutoFormData, id?: string): Promise<void> {
  const payload = dadosProduto(form);
  const { error } = id
    ? await supabase.from('produtos').update(payload).eq('id', id).select('id').single()
    : await supabase.from('produtos').insert(payload).select('id').single();
  if (error) throw error;
  // A auditoria é gravada pelo trigger do banco (sql/03_auditoria_triggers.sql).
}

// Exclusão (somente ADMIN). O banco bloqueia se o produto tiver lotes ou vendas.
export async function excluirProduto(id: string, nome: string): Promise<void> {
  const { data, error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) throw error;

  garantirExcluido(data);
}

export async function registrarEntradaEstoque(
  idProduto: string,
  form: EntradaEstoqueData
): Promise<void> {
  const { error } = await supabase.from('lotes_produto').insert({
    id_produto: idProduto,
    codigo_lote: form.codigoLote.trim(),
    quantidade: Number(form.quantidade),
    custo_unitario: converterMoeda(form.custoUnitario),
  });
  if (error) throw error;
  // O trigger do banco registra a entrada na auditoria (ENTRADA_ESTOQUE).
}
