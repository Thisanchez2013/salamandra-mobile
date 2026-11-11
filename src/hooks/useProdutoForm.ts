import { useCallback, useState } from 'react';
import { EntradaEstoqueData, EntradaEstoqueErrors, ProdutoFormData, ProdutoFormErrors } from '../types/produto';
import { converterMoeda } from '../utils/currency';

const FORM_INICIAL: ProdutoFormData = { codigo: '', nome: '', descricao: '', precoVenda: '' };
const ENTRADA_INICIAL: EntradaEstoqueData = { codigoLote: '', quantidade: '', custoUnitario: '' };

export function useProdutoForm() {
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [errors, setErrors] = useState<ProdutoFormErrors>({});
  const updateField = useCallback(<K extends keyof ProdutoFormData>(field: K, value: ProdutoFormData[K]) => {
    setFormData((atual) => ({ ...atual, [field]: value }));
    setErrors((atual) => ({ ...atual, [field]: undefined }));
  }, []);
  const preencherForm = useCallback((dados: ProdutoFormData) => { setFormData(dados); setErrors({}); }, []);
  const resetForm = useCallback(() => { setFormData(FORM_INICIAL); setErrors({}); }, []);
  const validar = useCallback(() => {
    const novos: ProdutoFormErrors = {};
    const codigo = Number(formData.codigo);
    const preco = converterMoeda(formData.precoVenda);
    if (!formData.codigo.trim() || !Number.isInteger(codigo)) novos.codigo = 'Informe um código inteiro válido.';
    if (!formData.nome.trim()) novos.nome = 'Informe o nome do produto.';
    if (!formData.precoVenda.trim() || !Number.isFinite(preco) || preco < 0) novos.precoVenda = 'Informe um preço válido, igual ou maior que zero.';
    setErrors(novos);
    return Object.keys(novos).length === 0;
  }, [formData]);
  return { formData, errors, updateField, preencherForm, resetForm, validar };
}

export function useEntradaEstoqueForm() {
  const [formData, setFormData] = useState(ENTRADA_INICIAL);
  const [errors, setErrors] = useState<EntradaEstoqueErrors>({});
  const updateField = useCallback(<K extends keyof EntradaEstoqueData>(field: K, value: EntradaEstoqueData[K]) => {
    setFormData((atual) => ({ ...atual, [field]: value }));
    setErrors((atual) => ({ ...atual, [field]: undefined }));
  }, []);
  const validar = useCallback(() => {
    const novos: EntradaEstoqueErrors = {};
    if (!formData.codigoLote.trim()) novos.codigoLote = 'Informe o código do lote.';
    else if (formData.codigoLote.trim().length > 5) novos.codigoLote = 'O código do lote deve ter até 5 caracteres.';
    const quantidade = Number(formData.quantidade);
    if (!formData.quantidade.trim() || !Number.isInteger(quantidade) || quantidade <= 0) novos.quantidade = 'Informe uma quantidade inteira maior que zero.';
    const custo = converterMoeda(formData.custoUnitario);
    if (!formData.custoUnitario.trim() || !Number.isFinite(custo) || custo < 0) novos.custoUnitario = 'Informe um custo unitário válido.';
    setErrors(novos);
    return Object.keys(novos).length === 0;
  }, [formData]);
  return { formData, errors, updateField, validar, resetForm: () => { setFormData(ENTRADA_INICIAL); setErrors({}); } };
}
