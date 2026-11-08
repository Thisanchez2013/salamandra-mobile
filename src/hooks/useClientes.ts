import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { buscarClientes } from '../services/clienteService';
import { Cliente } from '../types/cliente';
import { somenteNumeros } from '../utils/validators';

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  // ==================================================
  // CARREGAMENTO
  // ==================================================

  const carregarClientes = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await buscarClientes();

      setClientes(dados);
    } catch (error) {
      console.log(
        'Erro ao carregar clientes:',
        error
      );

      setErro(
        'Não foi possível carregar os clientes.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarClientes();
    }, [carregarClientes])
  );

  // Puxar para atualizar: recarrega sem trocar a lista pelo "carregando".
  const atualizar = useCallback(async () => {
    try {
      setAtualizando(true);
      setErro(null);
      setClientes(await buscarClientes());
    } catch (error) {
      console.log('Erro ao atualizar clientes:', error);
      setErro('Não foi possível carregar os clientes.');
    } finally {
      setAtualizando(false);
    }
  }, []);

  // ==================================================
  // FILTRO
  // ==================================================

  const clientesFiltrados = useMemo(() => {
    const termo = pesquisa
      .trim()
      .toLowerCase();

    if (!termo) {
      return clientes;
    }

    // O CPF é salvo só com números, então a busca
    // ignora pontos e traços digitados pelo usuário.
    const termoCpf = somenteNumeros(termo);

    return clientes.filter((cliente) => {
      const nome =
        cliente.nome.toLowerCase();

      const cpf = somenteNumeros(
        cliente.cpf ?? ''
      );

      return (
        nome.includes(termo) ||
        (termoCpf.length > 0 &&
          cpf.includes(termoCpf))
      );
    });
  }, [clientes, pesquisa]);

  return {
    clientes,
    clientesFiltrados,
    pesquisa,
    setPesquisa,
    carregando,
    atualizando,
    erro,
    carregarClientes,
    atualizar,
  };
}