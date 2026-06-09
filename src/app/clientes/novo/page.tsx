"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ORIGENS, COMBUSTIVEIS, COMBUSTIVEIS_BICOMBUSTIVEL } from "@/lib/constants";

export default function NovoClientePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nome: "", telefone: "", profissao: "", origem: "", obs: "",
    apelido: "", cpfCnpj: "", email: "",
  });
  const [telefones, setTelefones] = useState<string[]>([]);

  const [addVeiculo, setAddVeiculo] = useState(false);
  const [veiculo, setVeiculo] = useState({
    marca: "", modelo: "", placa: "", cor: "", ano: "",
    cilindrada: "", combustivel: "", combustivelEmUso: "",
  });

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setVField(key: string, value: string) {
    setVeiculo((v) => ({ ...v, [key]: value }));
  }

  function addTelefone() {
    if (telefones.length >= 3) return;
    setTelefones([...telefones, ""]);
  }

  function updateTelefone(idx: number, val: string) {
    setTelefones(telefones.map((t, i) => (i === idx ? val : t)));
  }

  function removeTelefone(idx: number) {
    setTelefones(telefones.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        telefones: telefones.filter(Boolean),
      };
      if (addVeiculo && veiculo.marca && veiculo.modelo) {
        payload.veiculo = veiculo;
      }
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao salvar"); return; }
      router.push(`/clientes/${data.id}`);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500";
  const showCombUso = COMBUSTIVEIS_BICOMBUSTIVEL.includes(veiculo.combustivel);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/clientes" className="text-sm text-zinc-500 hover:text-zinc-700">← Voltar</Link>
        <h1 className="text-2xl font-bold text-zinc-900 mt-2">Novo Cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dados do cliente */}
        <section className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
          <h2 className="font-semibold text-zinc-800">Dados do Cliente</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* 1. Nome */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nome *</label>
              <input
                required
                autoFocus
                value={form.nome}
                onChange={(e) => setField("nome", e.target.value)}
                className={inputCls}
              />
            </div>

            {/* 2. Telefone */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Telefone *</label>
              <input
                required
                type="tel"
                value={form.telefone}
                onChange={(e) => setField("telefone", e.target.value)}
                placeholder="(00) 00000-0000"
                className={inputCls}
              />
            </div>

            {/* 3. Profissão */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Profissão</label>
              <input
                value={form.profissao}
                onChange={(e) => setField("profissao", e.target.value)}
                className={inputCls}
              />
            </div>

            {/* 4. Origem */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Origem</label>
              <select
                value={form.origem}
                onChange={(e) => setField("origem", e.target.value)}
                className={inputCls}
              >
                <option value="">Selecione...</option>
                {ORIGENS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Apelido */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Apelido</label>
              <input
                value={form.apelido}
                onChange={(e) => setField("apelido", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Telefones extras */}
          <div className="space-y-2">
            {telefones.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="tel"
                  value={t}
                  onChange={(e) => updateTelefone(i, e.target.value)}
                  placeholder={`Telefone extra ${i + 1}`}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => removeTelefone(i)}
                  className="text-red-400 hover:text-red-600 text-sm px-2"
                >
                  ✕
                </button>
              </div>
            ))}
            {telefones.length < 3 && (
              <button
                type="button"
                onClick={addTelefone}
                className="text-sm text-red-600 hover:underline"
              >
                + Adicionar telefone
              </button>
            )}
          </div>

          {/* 5. Observação */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Observação</label>
            <textarea
              value={form.obs}
              onChange={(e) => setField("obs", e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
        </section>

        {/* Veículo */}
        <section className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-800">Veículo</h2>
            <button
              type="button"
              onClick={() => setAddVeiculo(!addVeiculo)}
              className={`text-sm px-3 py-1 rounded-lg border transition-colors ${
                addVeiculo
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {addVeiculo ? "Remover veículo" : "+ Adicionar veículo"}
            </button>
          </div>

          {addVeiculo && (
            <div className="grid grid-cols-2 gap-3">
              {/* 1. Marca */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Marca *</label>
                <input
                  required={addVeiculo}
                  value={veiculo.marca}
                  onChange={(e) => setVField("marca", e.target.value)}
                  placeholder="Ex: Chevrolet"
                  className={inputCls}
                />
              </div>

              {/* 2. Modelo */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Modelo *</label>
                <input
                  required={addVeiculo}
                  value={veiculo.modelo}
                  onChange={(e) => setVField("modelo", e.target.value)}
                  placeholder="Ex: Onix"
                  className={inputCls}
                />
              </div>

              {/* 3. Placa */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Placa</label>
                <input
                  value={veiculo.placa}
                  onChange={(e) => setVField("placa", e.target.value.toUpperCase())}
                  placeholder="ABC1D23"
                  maxLength={8}
                  className={inputCls}
                />
              </div>

              {/* 4. Cor */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Cor</label>
                <input
                  value={veiculo.cor}
                  onChange={(e) => setVField("cor", e.target.value)}
                  placeholder="Ex: Prata"
                  className={inputCls}
                />
              </div>

              {/* 5. Ano */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Ano</label>
                <input
                  type="number"
                  value={veiculo.ano}
                  onChange={(e) => setVField("ano", e.target.value)}
                  placeholder="2020"
                  min={1950}
                  max={new Date().getFullYear() + 2}
                  className={inputCls}
                />
              </div>

              {/* 6. Cilindrada */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Cilindrada</label>
                <input
                  value={veiculo.cilindrada}
                  onChange={(e) => setVField("cilindrada", e.target.value)}
                  placeholder="Ex: 1.0"
                  className={inputCls}
                />
              </div>

              {/* 7. Combustível */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Combustível</label>
                <select
                  value={veiculo.combustivel}
                  onChange={(e) => setVField("combustivel", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Selecione...</option>
                  {COMBUSTIVEIS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* 8. Combustível em uso (somente para Flex/Híbrido) */}
              {showCombUso && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Combustível em uso</label>
                  <select
                    value={veiculo.combustivelEmUso}
                    onChange={(e) => setVField("combustivelEmUso", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Selecione...</option>
                    <option value="GASOLINA">Gasolina</option>
                    <option value="ETANOL">Álcool</option>
                    <option value="GNV">GNV</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </section>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Salvando..." : "Criar Cliente"}
        </button>
      </form>
    </div>
  );
}
