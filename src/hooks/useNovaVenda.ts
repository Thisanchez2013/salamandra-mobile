import { useCallback, useEffect, useMemo, useState } from 'react';

import { buscarClientes } from '../services/clienteService';
import { buscarProdutos } from '../services/produtoService';
import { registrarVenda } from '../services/vendaService';
import { Cliente } from '../types/cliente';
import { Produto } from '../types/produto';

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

const MENSAGENS_ERRO: Record<string, string> = {
  SESSAO_INVALIDA: 'Sua sessão expirou. Entre novamente no app.',
  SEM_PERMISSAO: 'Seu usuário não tem permissão para registrar vendas.',
  CLIENTE_OBRIGATORIO: 'Escolha o cliente da venda.',
  CLIENTE_NAO_ENCONTRADO: 'O cliente escolhido não foi encontrado.',
  ITENS_INVALIDOS: 'Algum item da venda está inválido. Revise o carrinho.',
  QUANTIDADE_INVALIDA: 'A quantidade de algum item está inválida.',
  PRODUTO_NAO_ENCONTRADO: 'Algum produto do carrinho não existe mais.',
  FALHA_AO_BAIXAR_LOTE: 'Não foi possível baixar o estoque. Tente novamente.',
};

function mensagemErroVenda(error: unknown, produtos: Produto[]): string {
  const erro = error as { code?: string; message?: string };

  if (erro?.code !== 'P0001' || !erro.message) {
    return 'Não foi possível registrar a venda. Verifique sua conexão e tente novamente.';
  }

  const [codigo, idProduto] = erro.message.split(':');

  if (codigo === 'ESTOQUE_INSUFICIENTE') {
    const nome = produtos.find((produto) => produto.id === idProduto)?.nome;
    return nome
      ? `Estoque insuficiente de "${nome}". Os saldos foram atualizados.`
      : 'Estoque insuficiente para algum produto. Os saldos foram atualizados.';
  }

  return MENSAGENS_ERRO[codigo] ?? 'Não foi possível registrar a venda.';
}

export function useNovaVenda() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [observacao, setObservacao] = useState('');

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // ==================================================
  // CARREGAMENTO
  // ==================================================

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErroCarga(null);
      const [listaClientes, listaProdutos] = await Promise.all([
        buscarClientes(),
        buscarProdutos(),
      ]);
      setClientes(listaClientes);
      setProdutos(listaProdutos);
    } catch (error) {
      console.log('Erro ao carregar dados da venda:', error);
      setErroCarga('Não foi possível carregar clientes e produtos.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // ==================================================
  // CARRINHO
  // ==================================================

  const quantidadeNoCarrinho = useCallback(
    (idProduto: string) =>
      carrinho.find((item) => item.produto.id === idProduto)?.quantidade ?? 0,
    [carrinho]
  );

  const alterarQuantidade = useCallback((produto: Produto, delta: number) => {
    setErro(null);
    setCarrinho((atual) => {
      const existente = atual.find((item) => item.produto.id === produto.id);
      const nova = Math.min(
        (existente?.quantidade ?? 0) + delta,
        produto.quantidadeDisponivel
      );

      if (nova <= 0) {
        return atual.filter((item) => item.produto.id !== produto.id);
      }

      if (existente) {
        return atual.map((item) =>
          item.produto.id === produto.id ? { ...item, quantidade: nova } : item
        );
      }

      return [...atual, { produto, quantidade: nova }];
    });
  }, []);

  const total = useMemo(
    () =>
      carrinho.reduce(
        (soma, item) => soma + item.quantidade * item.produto.preco_venda,
        0
      ),
    [carrinho]
  );

  // ==================================================
  // FINALIZAR
  // ==================================================

  async function finalizar(): Promise<string | null> {
    if (salvando) return null;

    if (!cliente) {
      setErro('Escolha o cliente da venda.');
      return null;
    }

    if (carrinho.length === 0) {
      setErro('Adicione pelo menos um produto.');
      return null;
    }

    try {
      setSalvando(true);
      setErro(null);
      return await registrarVenda(
        cliente.id,
        carrinho.map((item) => ({
          idProduto: item.produto.id,
          quantidade: item.quantidade,
        })),
        observacao
      );
    } catch (error) {
      console.log('Erro ao registrar venda:', error);
      setErro(mensagemErroVenda(error, produtos));
      setProdutos(await buscarProdutos().catch(() => produtos));
      return null;
    } finally {
      setSalvando(false);
    }
  }

  return {
    clientes,
    produtos,
    carregando,
    erroCarga,
    carregar,
    cliente,
    setCliente,
    carrinho,
    quantidadeNoCarrinho,
    alterarQuantidade,
    observacao,
    setObservacao,
    total,
    salvando,
    erro,
    finalizar,
  };
}
