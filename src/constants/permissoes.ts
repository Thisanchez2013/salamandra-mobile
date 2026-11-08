// Cargos existentes na tabela "perfis".
export type Cargo = 'ADMIN' | 'GERENTE' | 'FUNCIONARIO';

// Quem pode fazer o quê. Espelha as regras de segurança (RLS)
// do banco no Supabase: o app só esconde o que o banco já bloqueia,
// para o usuário não ver botões que dariam erro.
export const PERMISSOES = {
  // Excluir clientes, produtos e fornecedores.
  excluir: ['ADMIN'],
  // Cadastrar/editar produtos e registrar entradas de estoque.
  gerenciarProdutos: ['ADMIN', 'GERENTE'],
  // Cadastrar/editar fornecedores.
  gerenciarFornecedores: ['ADMIN', 'GERENTE'],
  // Ver o registro de auditoria.
  verAuditoria: ['ADMIN', 'GERENTE'],
} satisfies Record<string, Cargo[]>;

export type Permissao = keyof typeof PERMISSOES;

export function temPermissao(
  cargo: Cargo | null | undefined,
  permissao: Permissao
): boolean {
  return !!cargo && (PERMISSOES[permissao] as Cargo[]).includes(cargo);
}

export const NOME_CARGO: Record<Cargo, string> = {
  ADMIN: 'Administrador',
  GERENTE: 'Gerente',
  FUNCIONARIO: 'Funcionário',
};
