import { supabase } from '../lib/supabase';

// ==================================================
// RELATÓRIOS
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

export interface ResumoEntradas {
  lotes: number;
  unidades: number;
  custoTotal: number;
}

export interface Relatorio {
  entradas: ResumoEntradas;
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

export interface FiltroPeriodo {
  diaInicial: string | null;
  diaFinal: string | null;
  inicio: Date | null;
  fim: Date | null;
}

async function buscarPaginado<T>(montar: () => any): Promise<T[]> {
  const linhas: T[] = [];
  let inicio = 0;

  while (true) {
    const { data, error } = await montar().range(inicio, inicio + TAMANHO_PAGINA - 1);

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

function filtrarData(consulta: any, coluna: string, filtro: FiltroPeriodo) {
  if (filtro.inicio) consulta = consulta.gte(coluna, filtro.inicio.toISOString());
  if (filtro.fim) consulta = consulta.lte(coluna, filtro.fim.toISOString());
  return consulta;
}

export interface LinhaEntrada {
  data: string;
  produto: string;
  codigo: string;
  lote: string;
  quantidade: number;
  custoUnitario: number;
}

// A quantidade do lote diminui a cada venda, então a entrada é o saldo atual + o que já saiu dele.
export async function buscarEntradas(filtro: FiltroPeriodo): Promise<LinhaEntrada[]> {
  const lotes = await buscarPaginado<any>(() =>
    filtrarData(
      supabase
        .from('lotes_produto')
        .select('id, codigo_lote, quantidade, custo_unitario, data_entrada, produtos ( nome, codigo ), itens_venda_lote ( quantidade, itens_venda ( vendas ( status ) ) )')
        .order('data_entrada', { ascending: true })
        .order('id', { ascending: true }),
      'data_entrada',
      filtro
    )
  );

  return lotes.map((lote) => {
    const produto = Array.isArray(lote.produtos) ? lote.produtos[0] : lote.produtos;
    // Venda cancelada já devolveu a quantidade ao lote.
    const consumido = (lote.itens_venda_lote ?? [])
      .filter((item: any) => item.itens_venda?.vendas?.status !== 'Cancelada')
      .reduce((soma: number, item: any) => soma + Number(item.quantidade), 0);

    return {
      data: lote.data_entrada,
      produto: produto?.nome ?? 'Produto removido',
      codigo: String(produto?.codigo ?? ''),
      lote: lote.codigo_lote,
      quantidade: Number(lote.quantidade) + consumido,
      custoUnitario: Number(lote.custo_unitario),
    };
  });
}

export interface LinhaSaida {
  data: string;
  cliente: string;
  status: string;
  produto: string;
  codigo: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export async function buscarSaidas(filtro: FiltroPeriodo): Promise<LinhaSaida[]> {
  const vendas = await buscarPaginado<any>(() =>
    filtrarData(
      supabase
        .from('vendas')
        .select('id, data, status, clientes ( nome ), itens_venda ( quantidade, preco_unitario, subtotal, produtos ( nome, codigo ) )')
        .order('data', { ascending: true })
        .order('id', { ascending: true }),
      'data',
      filtro
    )
  );

  return vendas.flatMap((venda) => {
    const cliente = Array.isArray(venda.clientes) ? venda.clientes[0] : venda.clientes;

    return (venda.itens_venda ?? []).map((item: any) => {
      const produto = Array.isArray(item.produtos) ? item.produtos[0] : item.produtos;

      return {
        data: venda.data,
        cliente: cliente?.nome ?? 'Cliente não informado',
        status: venda.status ?? '',
        produto: produto?.nome ?? 'Produto removido',
        codigo: String(produto?.codigo ?? ''),
        quantidade: Number(item.quantidade),
        precoUnitario: Number(item.preco_unitario),
        subtotal: Number(item.subtotal),
      };
    });
  });
}

async function buscarDesde<T>(
  view: string,
  colunas: string,
  filtro: FiltroPeriodo
): Promise<T[]> {
  const linhas: T[] = [];
  let inicio = 0;

  while (true) {
    let consulta = supabase
      .from(view)
      .select(colunas)
      .order('dia', { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);

    if (filtro.diaInicial) {
      consulta = consulta.gte('dia', filtro.diaInicial);
    }

    if (filtro.diaFinal) {
      consulta = consulta.lte('dia', filtro.diaFinal);
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

export async function buscarRelatorio(
  filtro: FiltroPeriodo,
  comEntradas: boolean
): Promise<Relatorio> {
  const consultaCanceladas = filtrarData(
    supabase
      .from('vendas')
      .select('id', { count: 'exact', head: true })
      .ilike('status', 'cancel%'),
    'data',
    filtro
  );

  const [dias, produtos, clientes, estoque, canceladas, entradas] = await Promise.all([
    buscarDesde<{
      quantidade_vendas: number;
      faturamento: number;
      itens_vendidos: number;
    }>('faturamento_diario', 'quantidade_vendas, faturamento, itens_vendidos', filtro),
    buscarDesde<{
      id_produto: string;
      produto: string;
      quantidade: number;
      valor: number;
    }>('produtos_vendidos_diario', 'id_produto, produto, quantidade, valor', filtro),
    buscarDesde<{
      id_cliente: string | null;
      cliente: string;
      compras: number;
      valor: number;
    }>('clientes_compras_diario', 'id_cliente, cliente, compras, valor', filtro),
    supabase
      .from('estoque_baixo')
      .select('id, nome, quantidade_disponivel')
      .order('quantidade_disponivel', { ascending: true }),
    consultaCanceladas,
    comEntradas ? buscarEntradas(filtro) : Promise.resolve([]),
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
    entradas: {
      lotes: entradas.length,
      unidades: entradas.reduce((soma, linha) => soma + linha.quantidade, 0),
      custoTotal: entradas.reduce((soma, linha) => soma + linha.quantidade * linha.custoUnitario, 0),
    },
    faturamento,
    quantidadeVendas,
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
