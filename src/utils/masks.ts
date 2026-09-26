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