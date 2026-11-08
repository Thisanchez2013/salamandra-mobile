// Produtos com esta quantidade ou menos são considerados "estoque baixo".
export const LIMITE_ESTOQUE_BAIXO = 10;

export type SituacaoEstoque = 'sem-estoque' | 'baixo' | 'normal';

// Regra única de estoque usada em todo o app
// (card do produto, Home e Relatórios).
export function situacaoEstoque(quantidade: number): SituacaoEstoque {
  if (quantidade <= 0) {
    return 'sem-estoque';
  }

  if (quantidade <= LIMITE_ESTOQUE_BAIXO) {
    return 'baixo';
  }

  return 'normal';
}

// "Precisa de atenção": sem estoque ou com estoque baixo.
export function precisaReporEstoque(quantidade: number): boolean {
  return situacaoEstoque(quantidade) !== 'normal';
}
