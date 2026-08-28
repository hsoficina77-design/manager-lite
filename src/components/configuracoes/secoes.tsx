"use client";

// Registro das seções do painel de configurações.
//
// Esta lista é a única coisa que o painel sabe sobre o conteúdo: ela alimenta o
// menu lateral do computador, o índice do celular, a busca e o endereço da tela
// (`/configuracoes#marca`). Para criar uma configuração nova, acrescente um item
// aqui — o menu, a busca e a navegação passam a funcionar sozinhos.
//
// Vale a pena manter cada seção curta: no celular ela vira uma tela inteira, e
// tela curta é tela que não cansa.

import { useRef, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { cn } from "@/lib/utils";
import { rodapeDoDocumento, type Configuracao } from "@/lib/configuracao";
import {
  COR_MENU_PADRAO,
  COR_PRIMARIA_PADRAO,
  MENUS_SUGERIDOS,
  PALETA_SUGERIDA,
} from "@/lib/tema";
import { Campo, Cartao, Grade, Icone, SeletorDeCor, inputCls } from "./campos";
import type { Form } from "./form";

export type SecaoProps = {
  form: Form;
  setCampo: <K extends keyof Form>(campo: K, valor: Form[K]) => void;
  /** Para quem precisa mexer em vários campos de uma vez (a busca de CEP). */
  setForm: Dispatch<SetStateAction<Form>>;
  /** O que está no formulário agora, no formato dos documentos. */
  previa: Configuracao;
  logoUrl: string | null;
  enviandoLogo: boolean;
  aoEnviarLogo: (arquivo: File) => void;
  aoRemoverLogo: () => void;
};

export type Secao = {
  /** Vira o endereço da seção: `/configuracoes#identidade`. Não mude depois de publicado. */
  id: string;
  titulo: string;
  /** Uma linha explicando a seção — aparece no índice do celular e no topo da tela. */
  descricao: string;
  /** Cabeçalho do menu. Seções com o mesmo grupo ficam juntas, na ordem desta lista. */
  grupo: string;
  icone: ReactNode;
  /** Termos extras da busca, para quem procura pela palavra que não está no título. */
  palavras?: string[];
  /** Qual pré-visualização acompanha a seção. */
  previa?: "documento" | "marca";
  Conteudo: (props: SecaoProps) => ReactNode;
};

/* ── Identidade ─────────────────────────────────────────────────────────── */

function Identidade({ form, setCampo }: SecaoProps) {
  return (
    <Cartao>
      <Grade>
        <Campo label="Nome da oficina" obrigatorio>
          <input
            required
            value={form.nome}
            onChange={(e) => setCampo("nome", e.target.value)}
            placeholder="Ex.: Auto Center Silva"
            className={inputCls}
          />
        </Campo>
        <Campo label="Nome curto (menu)" ajuda="Deixe vazio para usar o nome completo.">
          <input
            value={form.nomeCurto}
            onChange={(e) => setCampo("nomeCurto", e.target.value)}
            placeholder="Auto Center"
            className={inputCls}
          />
        </Campo>
        <Campo label="CNPJ / CPF" colunas={3}>
          <input
            value={form.cnpj}
            onChange={(e) => setCampo("cnpj", e.target.value)}
            placeholder="00.000.000/0000-00"
            className={inputCls}
          />
        </Campo>
      </Grade>
    </Cartao>
  );
}

/* ── Contato ────────────────────────────────────────────────────────────── */

function Contato({ form, setCampo }: SecaoProps) {
  return (
    <Cartao>
      <Grade>
        <Campo label="Telefone" colunas={3}>
          <input
            type="tel"
            value={form.telefone}
            onChange={(e) => setCampo("telefone", e.target.value)}
            placeholder="(00) 0000-0000"
            className={inputCls}
          />
        </Campo>
        <Campo label="WhatsApp" colunas={3}>
          <input
            type="tel"
            value={form.whatsapp}
            onChange={(e) => setCampo("whatsapp", e.target.value)}
            placeholder="(00) 00000-0000"
            className={inputCls}
          />
        </Campo>
        <Campo label="E-mail" colunas={3}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setCampo("email", e.target.value)}
            placeholder="contato@suaoficina.com.br"
            className={inputCls}
          />
        </Campo>
        <Campo label="Site / Instagram" colunas={3}>
          <input
            value={form.site}
            onChange={(e) => setCampo("site", e.target.value)}
            placeholder="@suaoficina"
            className={inputCls}
          />
        </Campo>
      </Grade>
    </Cartao>
  );
}

/* ── Endereço ───────────────────────────────────────────────────────────── */

function Endereco({ form, setCampo, setForm }: SecaoProps) {
  async function buscarCep() {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((f) => ({
          ...f,
          endereco: [data.logradouro, data.bairro].filter(Boolean).join(", ") || f.endereco,
          cidade: data.localidade || f.cidade,
          estado: data.uf || f.estado,
        }));
      }
    } catch {}
  }

  return (
    <Cartao>
      <Grade>
        <Campo label="CEP" colunas={2} ajuda="Preenche o resto sozinho.">
          <input
            inputMode="numeric"
            value={form.cep}
            onChange={(e) => setCampo("cep", e.target.value)}
            onBlur={buscarCep}
            placeholder="00000-000"
            className={inputCls}
          />
        </Campo>
        <Campo label="Endereço" colunas={4}>
          <input
            value={form.endereco}
            onChange={(e) => setCampo("endereco", e.target.value)}
            placeholder="Rua, número e bairro"
            className={inputCls}
          />
        </Campo>
        <Campo label="Cidade" colunas={4}>
          <input
            value={form.cidade}
            onChange={(e) => setCampo("cidade", e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo label="UF" colunas={2}>
          <input
            maxLength={2}
            value={form.estado}
            onChange={(e) => setCampo("estado", e.target.value.toUpperCase())}
            placeholder="SP"
            className={inputCls}
          />
        </Campo>
      </Grade>
    </Cartao>
  );
}

/* ── Marca ──────────────────────────────────────────────────────────────── */

function Marca({ form, setCampo, logoUrl, enviandoLogo, aoEnviarLogo, aoRemoverLogo }: SecaoProps) {
  const inputLogo = useRef<HTMLInputElement>(null);

  return (
    <>
      <Cartao titulo="Logo" ajuda="Aparece no menu, na aba do navegador e no topo dos documentos.">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo da oficina" className="h-20 w-20 object-contain" />
            ) : (
              <span className="px-2 text-center text-xs text-zinc-400">Sem logo</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <input
              ref={inputLogo}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) aoEnviarLogo(arquivo);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={enviandoLogo}
                onClick={() => inputLogo.current?.click()}
                className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50"
              >
                {enviandoLogo ? "Enviando..." : logoUrl ? "Trocar logo" : "Enviar logo"}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  disabled={enviandoLogo}
                  onClick={aoRemoverLogo}
                  className="min-h-11 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Remover
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              PNG, JPG, WebP ou SVG, até 2MB. PNG com fundo transparente fica melhor no cabeçalho.
              A logo é salva assim que você escolhe o arquivo.
            </p>
          </div>
        </div>
      </Cartao>

      <Cartao titulo="Cores" ajuda="Valem no sistema inteiro e nos documentos.">
        <div className="space-y-5">
          <SeletorDeCor
            titulo="Cor principal"
            ajuda="Botões, destaques e o número da OS."
            valor={form.corPrimaria}
            padrao={COR_PRIMARIA_PADRAO}
            sugestoes={PALETA_SUGERIDA}
            onChange={(cor) => setCampo("corPrimaria", cor)}
          />
          <SeletorDeCor
            titulo="Cor do menu"
            ajuda="Fundo da barra lateral."
            valor={form.corMenu}
            padrao={COR_MENU_PADRAO}
            sugestoes={MENUS_SUGERIDOS}
            onChange={(cor) => setCampo("corMenu", cor)}
          />
        </div>
      </Cartao>
    </>
  );
}

/* ── Documentos ─────────────────────────────────────────────────────────── */

function Documentos({ form, setCampo, previa }: SecaoProps) {
  return (
    <Cartao>
      <div className="space-y-4">
        <Campo
          label="Recado ao cliente"
          ajuda="Impresso num quadro no fim do documento. Deixe vazio para não aparecer."
        >
          <textarea
            rows={3}
            value={form.mensagemDocumento}
            onChange={(e) => setCampo("mensagemDocumento", e.target.value)}
            placeholder="Ex.: Garantia de 90 dias para peças e serviços, conforme o Código de Defesa do Consumidor."
            className={cn(inputCls, "resize-y")}
          />
        </Campo>

        <Campo label="Rodapé" ajuda="Vazio usa o nome da oficina e o telefone.">
          <input
            value={form.rodapeDocumento}
            onChange={(e) => setCampo("rodapeDocumento", e.target.value)}
            placeholder={rodapeDoDocumento({ ...previa, rodapeDocumento: null })}
            className={inputCls}
          />
        </Campo>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-200 p-3 text-sm text-zinc-700 hover:bg-zinc-50">
          <input
            type="checkbox"
            checked={form.mostrarAssinatura}
            onChange={(e) => setCampo("mostrarAssinatura", e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
          />
          <span>
            Espaço para assinatura do cliente
            <span className="mt-0.5 block text-xs text-zinc-500">
              Linha de assinatura no fim da OS e do orçamento impressos.
            </span>
          </span>
        </label>
      </div>
    </Cartao>
  );
}

/* ── Orçamento ──────────────────────────────────────────────────────────── */

function Orcamento({ form, setCampo }: SecaoProps) {
  return (
    <Cartao>
      <Campo
        label="Validade padrão do orçamento"
        colunas={3}
        ajuda="Sugerido ao criar um orçamento novo; dá para mudar caso a caso."
      >
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={365}
            inputMode="numeric"
            value={form.validadeOrcamentoDias}
            onChange={(e) => setCampo("validadeOrcamentoDias", e.target.value)}
            className={cn(inputCls, "w-24")}
          />
          <span className="text-sm text-zinc-500">dias</span>
        </div>
      </Campo>
    </Cartao>
  );
}

/* ── A lista ────────────────────────────────────────────────────────────── */

export const SECOES: Secao[] = [
  {
    id: "identidade",
    titulo: "Identidade",
    descricao: "Nome e documento da oficina.",
    grupo: "A oficina",
    palavras: ["nome", "cnpj", "cpf", "razão social", "empresa"],
    previa: "documento",
    icone: (
      <Icone>
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
        <path d="M2 7h20" />
      </Icone>
    ),
    Conteudo: Identidade,
  },
  {
    id: "contato",
    titulo: "Contato",
    descricao: "Telefone, WhatsApp, e-mail e redes.",
    grupo: "A oficina",
    palavras: ["telefone", "whatsapp", "email", "site", "instagram"],
    previa: "documento",
    icone: (
      <Icone>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
      </Icone>
    ),
    Conteudo: Contato,
  },
  {
    id: "endereco",
    titulo: "Endereço",
    descricao: "Onde o cliente encontra a oficina.",
    grupo: "A oficina",
    palavras: ["cep", "rua", "cidade", "estado", "uf", "localização"],
    previa: "documento",
    icone: (
      <Icone>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </Icone>
    ),
    Conteudo: Endereco,
  },
  {
    id: "marca",
    titulo: "Logo e cores",
    descricao: "A cara do sistema e dos documentos.",
    grupo: "Aparência",
    palavras: ["logo", "logotipo", "cor", "tema", "marca", "menu", "identidade visual"],
    previa: "marca",
    icone: (
      <Icone>
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </Icone>
    ),
    Conteudo: Marca,
  },
  {
    id: "documentos",
    titulo: "OS e orçamento",
    descricao: "Recado, rodapé e assinatura do impresso.",
    grupo: "Documentos",
    palavras: ["rodapé", "recado", "garantia", "assinatura", "impressão", "pdf"],
    previa: "documento",
    icone: (
      <Icone>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </Icone>
    ),
    Conteudo: Documentos,
  },
  {
    id: "orcamento",
    titulo: "Regras do orçamento",
    descricao: "Prazo de validade padrão.",
    grupo: "Documentos",
    palavras: ["validade", "prazo", "dias", "vencimento"],
    icone: (
      <Icone>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </Icone>
    ),
    Conteudo: Orcamento,
  },
];

export function acharSecao(id: string | null): Secao | undefined {
  return SECOES.find((s) => s.id === id);
}

/** Seções que casam com a busca, agrupadas na ordem em que foram declaradas. */
export function gruposDeSecoes(busca: string): { nome: string; itens: Secao[] }[] {
  const termo = busca.trim().toLowerCase();
  const casa = (s: Secao) =>
    termo === "" ||
    [s.titulo, s.descricao, s.grupo, ...(s.palavras ?? [])]
      .join(" ")
      .toLowerCase()
      .includes(termo);

  const grupos: { nome: string; itens: Secao[] }[] = [];
  for (const secao of SECOES) {
    if (!casa(secao)) continue;
    const grupo = grupos.find((g) => g.nome === secao.grupo);
    if (grupo) grupo.itens.push(secao);
    else grupos.push({ nome: secao.grupo, itens: [secao] });
  }
  return grupos;
}
