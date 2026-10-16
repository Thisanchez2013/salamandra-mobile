import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { Produto } from '../types/produto';
import { buscarProdutos } from '../services/produtoService';

export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarProdutos = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      setProdutos(await buscarProdutos());
    } catch (error) {
      console.log('Erro ao carregar produtos:', error);
      setErro('Não foi possível carregar os produtos. Verifique sua conexão e as permissões de acesso.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void carregarProdutos(); }, [carregarProdutos]));

  const produtosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return produtos;
    return produtos.filter((produto) =>
      produto.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
      String(produto.codigo).includes(termo) ||
      (produto.descricao ?? '').toLocaleLowerCase('pt-BR').includes(termo)
    );
  }, [produtos, pesquisa]);

  return { produtos, produtosFiltrados, pesquisa, setPesquisa, carregando, erro, carregarProdutos };
}
