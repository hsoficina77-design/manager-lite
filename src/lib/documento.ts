// CNPJ e CEP: conferência e máscara. Puro de propósito (sem Prisma), para o formulário de
// cadastro e as rotas usarem o mesmo código.

export function soDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** Os dois dígitos verificadores do CNPJ. Recusa o que tem todos os dígitos iguais. */
export function cnpjValido(valor: string): boolean {
  const d = soDigitos(valor);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;

  const digito = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base.split("").reduce((s, n, i) => s + Number(n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = digito(d.slice(0, 12));
  const d2 = digito(d.slice(0, 12) + d1);
  return d.endsWith(`${d1}${d2}`);
}

/** 12.345.678/0001-95 enquanto digita. */
export function mascaraCnpj(valor: string): string {
  const d = soDigitos(valor).slice(0, 14);
  const partes = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 8), d.slice(8, 12), d.slice(12, 14)];
  let saida = partes[0];
  if (partes[1]) saida += `.${partes[1]}`;
  if (partes[2]) saida += `.${partes[2]}`;
  if (partes[3]) saida += `/${partes[3]}`;
  if (partes[4]) saida += `-${partes[4]}`;
  return saida;
}

export function cepValido(valor: string): boolean {
  return soDigitos(valor).length === 8;
}

/** 08674-000 enquanto digita. */
export function mascaraCep(valor: string): string {
  const d = soDigitos(valor).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** "Rua das Flores, 120 - Centro": o endereço numa linha só, como a configuração guarda. */
export function enderecoEmUmaLinha(rua: string, numero: string, bairro: string): string {
  return `${rua.trim()}, ${numero.trim()} - ${bairro.trim()}`;
}
