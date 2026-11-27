import { supabase } from '../lib/supabase';
import {
  Cliente,
  ClienteFormData,
} from '../types/cliente';
import { garantirExcluido } from '../utils/erros';
import { somenteNumeros } from '../utils/validators';

const COLUNAS =
  'id, nome, email, cpf, rua, numero, bairro, cidade, estado, cep, data_cadastro';

function paraBanco(cliente: ClienteFormData) {
  return {
    nome: cliente.nome.trim(),
    cpf: somenteNumeros(cliente.cpf),
    email: cliente.email.trim() || null,
    rua: cliente.rua.trim() || null,
    numero: cliente.numero.trim() || null,
    bairro: cliente.bairro.trim() || null,
    cidade: cliente.cidade.trim() || null,
    estado: cliente.estado.trim().toUpperCase() || null,
    cep: somenteNumeros(cliente.cep) || null,
  };
}

// ==================================================
// CONSULTAS
// ==================================================

export async function buscarClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select(COLUNAS)
    .order('nome', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function buscarClientePorId(
  id: string
): Promise<Cliente | null> {
  const { data, error } = await supabase
    .from('clientes')
    .select(COLUNAS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

// ==================================================
// GRAVAÇÃO
// ==================================================

export async function cadastrarCliente(
  cliente: ClienteFormData
): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert(paraBanco(cliente))
    .select(COLUNAS)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function atualizarCliente(
  id: string,
  cliente: ClienteFormData
): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .update(paraBanco(cliente))
    .eq('id', id)
    .select(COLUNAS)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ==================================================
// EXCLUIR CLIENTE
// ==================================================

export async function excluirCliente(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) {
    throw error;
  }

  garantirExcluido(data);
}
