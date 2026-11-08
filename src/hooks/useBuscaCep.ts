import { useCallback, useRef, useState } from 'react';

import {
  buscarEnderecoPorCep,
  EnderecoCep,
  ErroCep,
} from '../services/cepService';
import { somenteNumeros } from '../utils/validators';

// Busca o endereço na ViaCEP assim que o CEP fica completo (8 dígitos).
export function useBuscaCep(onEncontrado: (endereco: EnderecoCep) => void) {
  const [buscando, setBuscando] = useState(false);
  const [erroCep, setErroCep] = useState<string | null>(null);
  const [encontrado, setEncontrado] = useState(false);

  // Guarda o último CEP pedido, para ignorar respostas antigas
  // se o usuário mudar o CEP enquanto a busca ainda não terminou.
  const ultimoCep = useRef('');

  const aoMudarCep = useCallback(
    async (cep: string) => {
      const numeros = somenteNumeros(cep);

      setErroCep(null);
      setEncontrado(false);

      if (numeros.length !== 8) {
        ultimoCep.current = '';
        return;
      }

      ultimoCep.current = numeros;
      setBuscando(true);

      try {
        const endereco = await buscarEnderecoPorCep(numeros);

        if (ultimoCep.current !== numeros) return;

        onEncontrado(endereco);
        setEncontrado(true);
      } catch (error) {
        if (ultimoCep.current !== numeros) return;

        setErroCep(
          error instanceof ErroCep
            ? error.message
            : 'Não foi possível consultar o CEP.'
        );
      } finally {
        if (ultimoCep.current === numeros) {
          setBuscando(false);
        }
      }
    },
    [onEncontrado]
  );

  return { buscando, erroCep, encontrado, aoMudarCep };
}
