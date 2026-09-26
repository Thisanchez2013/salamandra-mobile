import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { buscarClientes } from '../services/clienteService';
import { Cliente } from '../types/cliente';

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

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

    return clientes.filter((cliente) => {
      const nome =
        cliente.nome.toLowerCase();

      const cpf =
        cliente.cpf ?? '';

      return (
        nome.includes(termo) ||
        cpf.includes(termo)
      );
    });
  }, [clientes, pesquisa]);

  return {
    clientes,
    clientesFiltrados,
    pesquisa,
    setPesquisa,
    carregando,
    erro,
    carregarClientes,
  };
}