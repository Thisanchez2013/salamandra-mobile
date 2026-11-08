import { somenteNumeros } from '../utils/validators';

// ==================================================
// API EXTERNA: ViaCEP (https://viacep.com.br)
// Serviço público e gratuito que devolve o endereço de um CEP.
// Não precisa de chave nem de cadastro.
// ==================================================

const URL_VIACEP = 'https://viacep.com.br/ws';
const TEMPO_LIMITE_MS = 8000;

export interface EnderecoCep {
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
}

// Formato da resposta da ViaCEP (só os campos usados).
interface RespostaViaCep {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

export class ErroCep extends Error {}

export async function buscarEnderecoPorCep(
  cep: string
): Promise<EnderecoCep> {
  const numeros = somenteNumeros(cep);

  if (numeros.length !== 8) {
    throw new ErroCep('O CEP deve ter 8 dígitos.');
  }

  // Cancela a busca se a internet estiver lenta demais.
  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);

  try {
    const resposta = await fetch(`${URL_VIACEP}/${numeros}/json/`, {
      signal: controle.signal,
    });

    if (!resposta.ok) {
      throw new ErroCep('CEP inválido.');
    }

    const dados: RespostaViaCep = await resposta.json();

    // A ViaCEP responde { "erro": true } quando o CEP não existe.
    if (dados.erro) {
      throw new ErroCep('CEP não encontrado.');
    }

    return {
      rua: dados.logradouro ?? '',
      bairro: dados.bairro ?? '',
      cidade: dados.localidade ?? '',
      estado: dados.uf ?? '',
    };
  } catch (error) {
    if (error instanceof ErroCep) {
      throw error;
    }

    throw new ErroCep(
      'Não foi possível consultar o CEP. Verifique sua conexão.'
    );
  } finally {
    clearTimeout(temporizador);
  }
}
