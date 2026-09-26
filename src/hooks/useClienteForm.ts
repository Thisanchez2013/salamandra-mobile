import { useState } from 'react';

import {
  ClienteFormData,
  ClienteFormErrors,
} from '../types/cliente';
import {
  validarCPF,
  validarEmail,
} from '../utils/validators';

const INITIAL_FORM_DATA: ClienteFormData = {
  nome: '',
  cpf: '',
  email: '',
  rua: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
};

export function useClienteForm() {
  const [formData, setFormData] =
    useState<ClienteFormData>(INITIAL_FORM_DATA);

  const [errors, setErrors] =
    useState<ClienteFormErrors>({});

  // ==================================================
  // ALTERAÇÃO DOS CAMPOS
  // ==================================================

  function updateField<K extends keyof ClienteFormData>(
    field: K,
    value: ClienteFormData[K]
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }
  }

  // ==================================================
  // VALIDAÇÃO
  // ==================================================

  function validateForm(): boolean {
    const newErrors: ClienteFormErrors = {};

    const nome = formData.nome.trim();
    const cpf = formData.cpf.trim();
    const email = formData.email.trim();

    if (!nome) {
      newErrors.nome = 'Informe o nome do cliente.';
    } else if (nome.length < 3) {
      newErrors.nome =
        'O nome deve possuir pelo menos 3 caracteres.';
    }

    if (!cpf) {
      newErrors.cpf = 'Informe o CPF.';
    } else if (!validarCPF(cpf)) {
      newErrors.cpf = 'Informe um CPF válido.';
    }

    if (email && !validarEmail(email)) {
      newErrors.email =
        'Informe um e-mail válido.';
    }

    if (
      formData.estado.trim() &&
      formData.estado.trim().length !== 2
    ) {
      newErrors.estado =
        'Informe a UF com 2 letras.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  // ==================================================
  // LIMPAR FORMULÁRIO
  // ==================================================

  function resetForm() {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
  }

  return {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
  };
}