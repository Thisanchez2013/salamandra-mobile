import { useState } from 'react';

import { cadastrarCliente } from '../services/clienteService';
import { ClienteFormData } from '../types/cliente';

export function useNovoCliente() {
  const [salvando, setSalvando] = useState(false);
  const [erroCadastro, setErroCadastro] = useState<string | null>(
    null
  );

  async function salvarCliente(
    cliente: ClienteFormData
  ): Promise<boolean> {
    try {
      setSalvando(true);
      setErroCadastro(null);

      await cadastrarCliente(cliente);

      return true;
    } catch (error: any) {
      console.log('Erro ao salvar cliente:', error);

      if (error?.code === '23505') {
        setErroCadastro(
          'Já existe um cliente cadastrado com este CPF.'
        );
      } else {
        setErroCadastro(
          'Não foi possível cadastrar o cliente. Tente novamente.'
        );
      }

      return false;
    } finally {
      setSalvando(false);
    }
  }

  function limparErroCadastro() {
    setErroCadastro(null);
  }

  return {
    salvarCliente,
    salvando,
    erroCadastro,
    limparErroCadastro,
  };
}