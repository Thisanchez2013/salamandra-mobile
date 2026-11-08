import { somenteNumeros } from './validators';

// ==================================================
// CPF
// ==================================================

export function maskCPF(value: string): string {
  const numeros = somenteNumeros(value).slice(0, 11);

  return numeros
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// ==================================================
// CEP
// ==================================================

export function maskCEP(value: string): string {
  const numeros = somenteNumeros(value).slice(0, 8);

  return numeros.replace(
    /(\d{5})(\d{1,3})$/,
    '$1-$2'
  );
}

// ==================================================
// CPF OU CNPJ (escolhe pelo tamanho)
// ==================================================

export function maskCpfCnpj(value: string): string {
  const numeros = somenteNumeros(value).slice(0, 14);

  if (numeros.length <= 11) {
    return maskCPF(numeros);
  }

  return numeros
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

// ==================================================
// TELEFONE: (00) 0000-0000 ou (00) 00000-0000
// ==================================================

export function maskTelefone(value: string): string {
  const numeros = somenteNumeros(value).slice(0, 11);

  if (numeros.length <= 2) {
    return numeros.replace(/^(\d{1,2})/, '($1');
  }

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }

  return numeros
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}
