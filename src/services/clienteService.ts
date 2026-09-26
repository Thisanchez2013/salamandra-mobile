import { supabase } from '../lib/supabase';
import {
  Cliente,
  ClienteFormData,
} from '../types/cliente';

// ==================================================
// LISTAR CLIENTES
// ==================================================

export async function buscarClientes(): Promise<Cliente[]> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select(`
        id,
        nome,
        email,
        cpf,
        rua,
        numero,
        bairro,
        cidade,
        estado,
        cep,
        data_cadastro
      `)
      .order('nome', { ascending: true });

    if (error) {
      throw error;
    }

    return data ?? [];
  } catch (error) {
    console.log(
      'Erro ao buscar clientes:',
      error
    );

    throw error;
  }
}

// ==================================================
// CADASTRAR CLIENTE
// ==================================================

export async function cadastrarCliente(
  cliente: ClienteFormData
): Promise<Cliente> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nome: cliente.nome.trim(),
        cpf: cliente.cpf.replace(/\D/g, ''),
        email: cliente.email.trim() || null,
        rua: cliente.rua.trim() || null,
        numero: cliente.numero.trim() || null,
        bairro: cliente.bairro.trim() || null,
        cidade: cliente.cidade.trim() || null,
        estado:
          cliente.estado.trim().toUpperCase() || null,
        cep:
          cliente.cep.replace(/\D/g, '') || null,
      })
      .select(`
        id,
        nome,
        email,
        cpf,
        rua,
        numero,
        bairro,
        cidade,
        estado,
        cep,
        data_cadastro
      `)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.log(
      'Erro ao cadastrar cliente:',
      error
    );

    throw error;
  }
}