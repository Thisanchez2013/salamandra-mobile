import { supabase } from '../lib/supabase';
import {
  Fornecedor,
  FornecedorFormData,
  StatusFornecedor,
} from '../types/fornecedor';
import { garantirExcluido } from '../utils/erros';
import { somenteNumeros } from '../utils/validators';
import { registrarAuditoria } from './auditoriaService';

const COLUNAS = 'id, nome, cnpj_cpf, contato, email, endereco, status';

function mapear(row: any): Fornecedor {
  return {
    id: row.id,
    nome: row.nome,
    cnpjCpf: row.cnpj_cpf,
    contato: row.contato,
    email: row.email,
    endereco: row.endereco,
    status: (row.status === 'Inativo' ? 'Inativo' : 'Ativo') as StatusFornecedor,
  };
}

// Documento e telefone são salvos só com números.
function paraBanco(form: FornecedorFormData) {
  return {
    nome: form.nome.trim(),
    cnpj_cpf: somenteNumeros(form.cnpjCpf) || null,
    contato: somenteNumeros(form.contato) || null,
    email: form.email.trim() || null,
    endereco: form.endereco.trim() || null,
    status: form.status,
  };
}

// ==================================================
// CONSULTAS
// ==================================================

export async function buscarFornecedores(): Promise<Fornecedor[]> {
  const { data, error } = await supabase
    .from('fornecedores')
    .select(COLUNAS)
    .order('nome', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapear);
}

export async function buscarFornecedorPorId(
  id: string
): Promise<Fornecedor | null> {
  const { data, error } = await supabase
    .from('fornecedores')
    .select(COLUNAS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapear(data) : null;
}

// ==================================================
// GRAVAÇÃO
// ==================================================

export async function salvarFornecedor(
  form: FornecedorFormData,
  id?: string
): Promise<void> {
  const payload = paraBanco(form);

  const { error } = id
    ? await supabase
        .from('fornecedores')
        .update(payload)
        .eq('id', id)
        .select('id')
        .single()
    : await supabase
        .from('fornecedores')
        .insert(payload)
        .select('id')
        .single();

  if (error) {
    throw error;
  }

  await registrarAuditoria(
    id ? 'EDITAR' : 'CRIAR',
    `Fornecedor: ${payload.nome}`
  );
}

export async function excluirFornecedor(
  id: string,
  nome: string
): Promise<void> {
  const { data, error } = await supabase
    .from('fornecedores')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) {
    throw error;
  }

  garantirExcluido(data);

  await registrarAuditoria('EXCLUIR', `Fornecedor: ${nome}`);
}
