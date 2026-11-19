// Códigos de erro do PostgreSQL devolvidos pelo Supabase.
const REGISTRO_EM_USO = '23503'; // chave estrangeira: há outros dados ligados
const REGISTRO_DUPLICADO = '23505'; // valor único repetido

export class ErroExclusao extends Error {}

// Converte o erro de uma exclusão numa mensagem clara para o usuário.
export function mensagemErroExclusao(
  error: unknown,
  emUso: string
): string {
  if (error instanceof ErroExclusao) {
    return error.message;
  }

  if ((error as { code?: string })?.code === REGISTRO_EM_USO) {
    return emUso;
  }

  return 'Não foi possível excluir. Verifique sua conexão e tente novamente.';
}

export function ehRegistroDuplicado(error: unknown): boolean {
  return (error as { code?: string })?.code === REGISTRO_DUPLICADO;
}

// O banco não devolve erro quando a regra de permissão impede a exclusão:
// ele simplesmente não apaga nada. Por isso conferimos quantas linhas saíram.
export function garantirExcluido(linhas: unknown[] | null): void {
  if (!linhas || linhas.length === 0) {
    throw new ErroExclusao(
      'Você não tem permissão para excluir este registro.'
    );
  }
}
