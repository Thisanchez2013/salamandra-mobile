export interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  cpf: string;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  data_cadastro: string;
}

export interface ClienteFormData {
  nome: string;
  cpf: string;
  email: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export type ClienteFormErrors = Partial<
  Record<keyof ClienteFormData, string>
>;