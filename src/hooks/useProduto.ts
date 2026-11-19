import { useCallback, useState } from 'react';
import { EntradaEstoqueData, ProdutoFormData } from '../types/produto';
import { registrarEntradaEstoque, salvarProduto } from '../services/produtoService';

export function useSalvarProduto() {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const salvar = useCallback(async (dados: ProdutoFormData, id?: string) => {
    try { setSalvando(true); setErro(null); await salvarProduto(dados, id); return true; }
    catch (error: any) {
      console.log('Erro ao salvar produto:', error);
      setErro(error?.code === '23505' ? 'Já existe um produto com este código.' : 'Não foi possível salvar o produto. Verifique suas permissões e tente novamente.');
      return false;
    } finally { setSalvando(false); }
  }, []);
  return { salvar, salvando, erro };
}

export function useRegistrarEntrada(idProduto: string) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const registrar = useCallback(async (dados: EntradaEstoqueData) => {
    try { setSalvando(true); setErro(null); await registrarEntradaEstoque(idProduto, dados); return true; }
    catch (error) {
      console.log('Erro ao registrar entrada de estoque:', error);
      setErro('Não foi possível registrar a entrada. Verifique as permissões de acesso e tente novamente.');
      return false;
    } finally { setSalvando(false); }
  }, [idProduto]);
  return { registrar, salvando, erro };
}
