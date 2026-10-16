import { supabase } from '../lib/supabase';
import { LIMITE_ESTOQUE_BAIXO } from '../constants/estoque';
import { EntradaEstoqueData, LoteProduto, Produto, ProdutoFormData } from '../types/produto';
import { converterMoeda } from '../utils/currency';

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

async function buscarTodosOsProdutos(): Promise<ProdutoRow[]> {
  const produtos: ProdutoRow[] = [];
  let inicio = 0;
  while (true) {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, codigo, nome, descricao, preco_venda, created_at')
      .order('nome', { ascending: true })
      .order('id', { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (error) throw error;
    const pagina = (data ?? []) as ProdutoRow[];
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
  const [produtos, lotes] = await Promise.all([buscarTodosOsProdutos(), buscarTodosOsLotes()]);

  const lotesPorProduto = new Map<string, LoteRow[]>();
  (lotes ?? []).forEach((lote) => {
    const atuais = lotesPorProduto.get(lote.id_produto) ?? [];
    atuais.push(lote as LoteRow);
    lotesPorProduto.set(lote.id_produto, atuais);
  });

  return (produtos ?? []).map((produto) =>
    mapearProduto(produto as ProdutoRow, lotesPorProduto.get(produto.id) ?? [])
  );
}

export async function contarProdutosComEstoqueBaixo(): Promise<number> {
  const [produtos, lotes] = await Promise.all([buscarTodosOsProdutos(), buscarTodosOsLotes()]);
  const saldoPorProduto = new Map<string, number>();
  lotes.forEach((lote) => {
    saldoPorProduto.set(lote.id_produto, (saldoPorProduto.get(lote.id_produto) ?? 0) + Number(lote.quantidade));
  });
  return produtos.filter((produto) => (saldoPorProduto.get(produto.id) ?? 0) <= LIMITE_ESTOQUE_BAIXO).length;
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
}
