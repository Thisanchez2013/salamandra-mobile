import { supabase } from '../lib/supabase';

// ==================================================
// RELATÓRIOS
// Os números vêm das views do banco (sql/04_relatorios.sql), que já
// devolvem tudo agrupado por dia. O app pede só os dias do período
// escolhido e soma poucas linhas, em vez de baixar todas as vendas.
// ==================================================

export interface ItemRanking {
  nome: string;
  valor: number;
  quantidade: number;
}

export interface ProdutoEstoqueBaixo {
  id: string;
  nome: string;
  quantidadeDisponivel: number;
}

export interface Relatorio {
  faturamento: number;
  quantidadeVendas: number;
  ticketMedio: number;
  itensVendidos: number;
  canceladas: number;
  maisVendidos: ItemRanking[];
  melhoresClientes: ItemRanking[];
  estoqueBaixo: ProdutoEstoqueBaixo[];
}

const TAMANHO_RANKING = 5;
const TAMANHO_PAGINA = 1000;

// Busca todas as linhas de uma view a partir de um dia (AAAA-MM-DD),
// página por página (o Supabase devolve no máximo 1000 por vez).
async function buscarDesde<T>(
  view: string,
  colunas: string,
  diaInicial: string | null
): Promise<T[]> {
  const linhas: T[] = [];
  let inicio = 0;

  while (true) {
    let consulta = supabase
      .from(view)
      .select(colunas)
      .order('dia', { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);

    if (diaInicial) {
      consulta = consulta.gte('dia', diaInicial);
    }

    const { data, error } = await consulta;

    if (error) {
      throw error;
    }

    const pagina = (data ?? []) as T[];
    linhas.push(...pagina);

    if (pagina.length < TAMANHO_PAGINA) {
      return linhas;
    }

    inicio += TAMANHO_PAGINA;
  }
}

// Junta as linhas de vários dias de um mesmo produto/cliente
// e devolve os maiores por valor.
function ranking(
  linhas: { chave: string; nome: string; valor: number; quantidade: number }[]
): ItemRanking[] {
  const mapa = new Map<string, ItemRanking>();

  linhas.forEach(({ chave, nome, valor, quantidade }) => {
    const atual = mapa.get(chave) ?? { nome, valor: 0, quantidade: 0 };
    atual.valor += valor;
    atual.quantidade += quantidade;
    mapa.set(chave, atual);
  });

  return [...mapa.values()]
    .sort((a, b) => b.valor - a.valor)
    .slice(0, TAMANHO_RANKING);
}

// diaInicial: primeiro dia do período (AAAA-MM-DD), ou null para "tudo".
// inicioCanceladas: mesmo início, como data e hora, para contar canceladas.
export async function buscarRelatorio(
  diaInicial: string | null,
  inicioCanceladas: Date | null
): Promise<Relatorio> {
  let consultaCanceladas = supabase
    .from('vendas')
    .select('id', { count: 'exact', head: true })
    .ilike('status', 'cancel%');

  if (inicioCanceladas) {
    consultaCanceladas = consultaCanceladas.gte(
      'data',
      inicioCanceladas.toISOString()
    );
  }

  const [dias, produtos, clientes, estoque, canceladas] = await Promise.all([
    buscarDesde<{
      quantidade_vendas: number;
      faturamento: number;
      itens_vendidos: number;
    }>('faturamento_diario', 'quantidade_vendas, faturamento, itens_vendidos', diaInicial),
    buscarDesde<{
      id_produto: string;
      produto: string;
      quantidade: number;
      valor: number;
    }>('produtos_vendidos_diario', 'id_produto, produto, quantidade, valor', diaInicial),
    buscarDesde<{
      id_cliente: string | null;
      cliente: string;
      compras: number;
      valor: number;
    }>('clientes_compras_diario', 'id_cliente, cliente, compras, valor', diaInicial),
    supabase
      .from('estoque_baixo')
      .select('id, nome, quantidade_disponivel')
      .order('quantidade_disponivel', { ascending: true }),
    consultaCanceladas,
  ]);

  if (estoque.error) {
    throw estoque.error;
  }

  if (canceladas.error) {
    throw canceladas.error;
  }

  const faturamento = dias.reduce((soma, dia) => soma + Number(dia.faturamento), 0);
  const quantidadeVendas = dias.reduce((soma, dia) => soma + Number(dia.quantidade_vendas), 0);

  return {
    faturamento,
    quantidadeVendas,
    // Ticket médio do período = faturamento total / número de vendas
    // (não dá para tirar a média das médias de cada dia).
    ticketMedio: quantidadeVendas > 0 ? faturamento / quantidadeVendas : 0,
    itensVendidos: dias.reduce((soma, dia) => soma + Number(dia.itens_vendidos), 0),
    canceladas: canceladas.count ?? 0,
    maisVendidos: ranking(
      produtos.map((linha) => ({
        chave: linha.id_produto,
        nome: linha.produto,
        valor: Number(linha.valor),
        quantidade: Number(linha.quantidade),
      }))
    ),
    melhoresClientes: ranking(
      clientes.map((linha) => ({
        chave: linha.id_cliente ?? 'sem-cliente',
        nome: linha.cliente,
        valor: Number(linha.valor),
        quantidade: Number(linha.compras),
      }))
    ),
    estoqueBaixo: (estoque.data ?? []).map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      quantidadeDisponivel: Number(produto.quantidade_disponivel),
    })),
  };
}
