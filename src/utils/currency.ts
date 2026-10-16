export function formatarMoedaBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function mascararMoeda(value: string): string {
  const centavos = value.replace(/\D/g, '');

  if (!centavos) {
    return '';
  }

  return (Number(centavos) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function converterMoeda(value: string): number {
  const normalizado = value.trim().replace(/\./g, '').replace(',', '.');
  return normalizado ? Number(normalizado) : 0;
}
