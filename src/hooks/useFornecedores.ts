import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { buscarFornecedores } from '../services/fornecedorService';
import { Fornecedor } from '../types/fornecedor';
import { somenteNumeros } from '../utils/validators';

export type FiltroStatus = 'todos' | 'Ativo' | 'Inativo';

export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [status, setStatus] = useState<FiltroStatus>('todos');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setFornecedores(await buscarFornecedores());
    } catch (error) {
      console.log('Erro ao carregar fornecedores:', error);
      setErro(
        'Não foi possível carregar os fornecedores. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  const atualizar = useCallback(async () => {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }, [carregar]);

  const tentarNovamente = useCallback(async () => {
    setCarregando(true);
    await carregar();
  }, [carregar]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  // Busca por nome ou documento (com ou sem pontuação) e filtro de status.
  const fornecedoresFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLocaleLowerCase('pt-BR');
    const termoNumeros = somenteNumeros(termo);

    return fornecedores.filter((fornecedor) => {
      if (status !== 'todos' && fornecedor.status !== status) {
        return false;
      }

      if (!termo) {
        return true;
      }

      return (
        fornecedor.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
        (termoNumeros.length > 0 &&
          (fornecedor.cnpjCpf ?? '').includes(termoNumeros))
      );
    });
  }, [fornecedores, pesquisa, status]);

  return {
    fornecedores,
    fornecedoresFiltrados,
    pesquisa,
    setPesquisa,
    status,
    setStatus,
    carregando,
    atualizando,
    erro,
    atualizar,
    tentarNovamente,
  };
}
