export const TEMPO_ULTIMA_LETRA_MS = 1500;

export function mascararSenha(senha: string, revelarUltima: boolean) {
  if (!revelarUltima || !senha) return '•'.repeat(senha.length);
  return '•'.repeat(senha.length - 1) + senha.slice(-1);
}

// Descobre o que mudou entre o texto exibido (mascarado) e o novo, e aplica na senha real.
export function aplicarEdicao(senha: string, exibido: string, novo: string) {
  let inicio = 0;
  while (inicio < novo.length && inicio < exibido.length && novo[inicio] === exibido[inicio]) inicio++;

  let fim = 0;
  while (
    fim < novo.length - inicio &&
    fim < exibido.length - inicio &&
    novo[novo.length - 1 - fim] === exibido[exibido.length - 1 - fim]
  ) fim++;

  return senha.slice(0, inicio) + novo.slice(inicio, novo.length - fim) + senha.slice(senha.length - fim);
}
