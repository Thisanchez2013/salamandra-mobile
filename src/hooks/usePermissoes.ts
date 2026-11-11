import { temPermissao } from '../constants/permissoes';
import { useSessao } from '../contexts/SessaoContext';

// Atalho para as telas: diz o que o usuário logado pode fazer.
export function usePermissoes() {
  const { perfil } = useSessao();
  const cargo = perfil?.perfil;

  return {
    cargo,
    podeExcluir: temPermissao(cargo, 'excluir'),
    podeGerenciarProdutos: temPermissao(cargo, 'gerenciarProdutos'),
    podeGerenciarFornecedores: temPermissao(cargo, 'gerenciarFornecedores'),
    podeVerAuditoria: temPermissao(cargo, 'verAuditoria'),
  };
}
