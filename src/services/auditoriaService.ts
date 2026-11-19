import { supabase } from '../lib/supabase';

export interface RegistroAuditoria {
  id: string;
  acao: string;
  descricao: string | null;
  dataHora: string;
  usuario: string;
}

// ==================================================
// LISTAR (somente ADMIN e GERENTE, conforme regras do banco)
// ==================================================

export async function buscarAuditoria(): Promise<RegistroAuditoria[]> {
  const { data, error } = await supabase
    .from('auditoria')
    .select('id, acao, descricao, data_hora, id_usuario')
    .order('data_hora', { ascending: false })
    .limit(300);

  if (error) {
    throw error;
  }

  const registros = data ?? [];

  // Nomes dos usuários (o administrador enxerga todos os perfis;
  // os demais enxergam só o próprio).
  const ids = [
    ...new Set(registros.map((r) => r.id_usuario).filter(Boolean)),
  ] as string[];

  const nomes = new Map<string, string>();

  if (ids.length > 0) {
    const { data: perfis } = await supabase
      .from('perfis')
      .select('id, nome')
      .in('id', ids);

    (perfis ?? []).forEach((perfil) => nomes.set(perfil.id, perfil.nome));
  }

  return registros.map((registro) => ({
    id: registro.id,
    acao: registro.acao,
    descricao: registro.descricao,
    dataHora: registro.data_hora,
    usuario: registro.id_usuario
      ? nomes.get(registro.id_usuario) ?? 'Usuário'
      : 'Alteração direta no banco',
  }));
}
