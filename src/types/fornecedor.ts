export type StatusFornecedor = 'Ativo' | 'Inativo';

export interface Fornecedor {
  id: string;
  nome: string;
  cnpjCpf: string | null;
  contato: string | null;
  email: string | null;
  endereco: string | null;
  status: StatusFornecedor;
}

export interface FornecedorFormData {
  nome: string;
  cnpjCpf: string;
  contato: string;
  email: string;
  endereco: string;
  status: StatusFornecedor;
}

export type FornecedorFormErrors = Partial<
  Record<keyof FornecedorFormData, string>
>;
