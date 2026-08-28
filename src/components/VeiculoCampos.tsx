"use client";

import {
  COMBUSTIVEIS,
  COMBUSTIVEIS_BICOMBUSTIVEL,
  COMBUSTIVEL_EM_USO,
  VALVULAS,
} from "@/lib/constants";

// Formulário único de veículo: os mesmos campos, na mesma ordem, em todo lugar
// que cadastra ou edita carro (novo cliente, painel do cliente, orçamento).
// Tudo string porque é estado de <input>; o servidor converte (ver lib/veiculo.ts).
export type VeiculoForm = {
  marca: string;
  modelo: string;
  placa: string;
  cor: string;
  anoFabricacao: string;
  anoModelo: string;
  motorizacao: string;
  valvulas: string;
  combustivel: string;
  combustivelEmUso: string;
  km: string;
};

export const VEICULO_FORM_VAZIO: VeiculoForm = {
  marca: "", modelo: "", placa: "", cor: "", anoFabricacao: "", anoModelo: "",
  motorizacao: "", valvulas: "", combustivel: "", combustivelEmUso: "", km: "",
};

type VeiculoSalvo = {
  marca?: string | null;
  modelo?: string | null;
  placa?: string | null;
  cor?: string | null;
  ano?: number | null;
  anoFabricacao?: number | null;
  anoModelo?: number | null;
  motorizacao?: string | null;
  valvulas?: string | null;
  combustivel?: string | null;
  combustivelEmUso?: string | null;
  km?: number | null;
};

const str = (v: string | number | null | undefined) => (v == null ? "" : String(v));

/** Preenche o formulário com um veículo do banco (usado ao editar). */
export function veiculoFormDe(v: VeiculoSalvo): VeiculoForm {
  return {
    marca: str(v.marca),
    modelo: str(v.modelo),
    placa: str(v.placa),
    cor: str(v.cor),
    // Cadastro antigo só tem `ano`: mostra como ano modelo para não sumir da tela.
    anoFabricacao: str(v.anoFabricacao),
    anoModelo: str(v.anoModelo ?? (v.anoFabricacao ? null : v.ano)),
    motorizacao: str(v.motorizacao),
    valvulas: str(v.valvulas),
    combustivel: str(v.combustivel),
    combustivelEmUso: str(v.combustivelEmUso),
    km: str(v.km),
  };
}

/** Rascunho salvo no navegador pode ter o formato antigo (`ano`, `cilindrada`). */
export function veiculoFormDeRascunho(raw: unknown): VeiculoForm {
  const d = (raw ?? {}) as Record<string, unknown>;
  return veiculoFormDe({
    marca: d.marca as string, modelo: d.modelo as string, placa: d.placa as string,
    cor: d.cor as string, ano: Number(d.ano) || null,
    anoFabricacao: Number(d.anoFabricacao) || null, anoModelo: Number(d.anoModelo) || null,
    motorizacao: (d.motorizacao ?? d.cilindrada) as string, valvulas: d.valvulas as string,
    combustivel: d.combustivel as string, combustivelEmUso: d.combustivelEmUso as string,
    km: Number(d.km) || null,
  });
}

/** Marca e modelo preenchidos — o mínimo para o veículo poder ser salvo. */
export function veiculoCompleto(f: VeiculoForm): boolean {
  return !!f.marca.trim() && !!f.modelo.trim();
}

/** Qualquer campo tocado — para avisar que falta marca/modelo em vez de ignorar o que foi digitado. */
export function veiculoIniciado(f: VeiculoForm): boolean {
  return Object.values(f).some((v) => v.trim());
}

const inputCls =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
const labelCls = "block text-sm font-medium text-zinc-700 mb-1";

export default function VeiculoCampos({
  value,
  onChange,
  obrigatorio = false,
}: {
  value: VeiculoForm;
  onChange: (v: VeiculoForm) => void;
  /** Marca e modelo como `required` do HTML — só onde o veículo não é opcional. */
  obrigatorio?: boolean;
}) {
  const set = (campo: keyof VeiculoForm, valor: string) => onChange({ ...value, [campo]: valor });
  const mostraCombUso = COMBUSTIVEIS_BICOMBUSTIVEL.includes(value.combustivel);
  const anoMax = new Date().getFullYear() + 2;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={labelCls}>Marca *</label>
        <input
          required={obrigatorio}
          value={value.marca}
          onChange={(e) => set("marca", e.target.value)}
          placeholder="Ex: Chevrolet"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Modelo *</label>
        <input
          required={obrigatorio}
          value={value.modelo}
          onChange={(e) => set("modelo", e.target.value)}
          placeholder="Ex: Onix"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Placa</label>
        <input
          value={value.placa}
          onChange={(e) => set("placa", e.target.value.toUpperCase())}
          placeholder="ABC1D23"
          maxLength={8}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Cor</label>
        <input
          value={value.cor}
          onChange={(e) => set("cor", e.target.value)}
          placeholder="Ex: Prata"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Ano fabricação</label>
        <input
          type="number"
          inputMode="numeric"
          value={value.anoFabricacao}
          onChange={(e) => set("anoFabricacao", e.target.value)}
          placeholder="2019"
          min={1950}
          max={anoMax}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Ano modelo</label>
        <input
          type="number"
          inputMode="numeric"
          value={value.anoModelo}
          onChange={(e) => set("anoModelo", e.target.value)}
          placeholder="2020"
          min={1950}
          max={anoMax}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Cilindrada</label>
        <input
          value={value.motorizacao}
          onChange={(e) => set("motorizacao", e.target.value)}
          placeholder="Ex: 1.0"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Válvulas</label>
        <select
          value={value.valvulas}
          onChange={(e) => set("valvulas", e.target.value)}
          className={inputCls}
        >
          <option value="">Selecione...</option>
          {VALVULAS.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>Combustível</label>
        <select
          value={value.combustivel}
          onChange={(e) =>
            onChange({ ...value, combustivel: e.target.value, combustivelEmUso: "" })
          }
          className={inputCls}
        >
          <option value="">Selecione...</option>
          {COMBUSTIVEIS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Só motor bicombustível tem "em uso" — nos outros o campo nem aparece. */}
      {mostraCombUso && (
        <div>
          <label className={labelCls}>Combustível em uso</label>
          <select
            value={value.combustivelEmUso}
            onChange={(e) => set("combustivelEmUso", e.target.value)}
            className={inputCls}
          >
            <option value="">Selecione...</option>
            {COMBUSTIVEL_EM_USO.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={labelCls}>KM</label>
        <input
          type="number"
          inputMode="numeric"
          value={value.km}
          onChange={(e) => set("km", e.target.value)}
          placeholder="Ex: 85000"
          className={inputCls}
        />
      </div>
    </div>
  );
}
