// O formulário do painel trabalha só com strings e booleanos: é o que os inputs
// devolvem. A conversão para o formato do banco (`Configuracao`) acontece no envio
// e, ao vivo, na pré-visualização.

import { CONFIG_PADRAO, type Configuracao } from "@/lib/configuracao";

export type Form = {
  nome: string; nomeCurto: string; cnpj: string; telefone: string; whatsapp: string;
  email: string; site: string; cep: string; endereco: string; cidade: string; estado: string;
  corPrimaria: string; corMenu: string;
  rodapeDocumento: string; mensagemDocumento: string;
  mostrarAssinatura: boolean; validadeOrcamentoDias: string;
};

export function paraForm(c: Configuracao): Form {
  return {
    nome: c.nome ?? "",
    nomeCurto: c.nomeCurto ?? "",
    cnpj: c.cnpj ?? "",
    telefone: c.telefone ?? "",
    whatsapp: c.whatsapp ?? "",
    email: c.email ?? "",
    site: c.site ?? "",
    cep: c.cep ?? "",
    endereco: c.endereco ?? "",
    cidade: c.cidade ?? "",
    estado: c.estado ?? "",
    corPrimaria: c.corPrimaria,
    corMenu: c.corMenu,
    rodapeDocumento: c.rodapeDocumento ?? "",
    mensagemDocumento: c.mensagemDocumento ?? "",
    mostrarAssinatura: c.mostrarAssinatura,
    validadeOrcamentoDias: String(c.validadeOrcamentoDias),
  };
}

/** Configuração equivalente ao que está no formulário — alimenta a pré-visualização. */
export function paraConfig(form: Form, logoUrl: string | null): Configuracao {
  const texto = (v: string) => (v.trim() === "" ? null : v.trim());
  return {
    ...CONFIG_PADRAO,
    nome: form.nome.trim() || CONFIG_PADRAO.nome,
    nomeCurto: texto(form.nomeCurto),
    cnpj: texto(form.cnpj),
    telefone: texto(form.telefone),
    whatsapp: texto(form.whatsapp),
    email: texto(form.email),
    site: texto(form.site),
    cep: texto(form.cep),
    endereco: texto(form.endereco),
    cidade: texto(form.cidade),
    estado: texto(form.estado),
    logoUrl,
    corPrimaria: form.corPrimaria,
    corMenu: form.corMenu,
    rodapeDocumento: texto(form.rodapeDocumento),
    mensagemDocumento: texto(form.mensagemDocumento),
    mostrarAssinatura: form.mostrarAssinatura,
    validadeOrcamentoDias: Number(form.validadeOrcamentoDias) || CONFIG_PADRAO.validadeOrcamentoDias,
  };
}

/** Há edição pendente? Decide o botão "Salvar" e o aviso de saída sem salvar. */
export function mudou(a: Form, b: Form): boolean {
  return (Object.keys(a) as (keyof Form)[]).some((campo) => a[campo] !== b[campo]);
}
