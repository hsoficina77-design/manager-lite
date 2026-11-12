"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { lerCsvComCabecalho } from "@/lib/csv";
import { MAX_LINHAS_IMPORTACAO, colunaConhecida, type CategoriaDoArquivo, type PlanoDeImportacao } from "@/lib/prospeccao";
import { useAvisar } from "@/components/ui/Avisos";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Campo, Entrada } from "@/components/ui/Campos";
import { FaixaMetricas, Metrica, Painel } from "@/components/ui/Dados";

type Previa = Pick<PlanoDeImportacao, "linhas" | "categorias" | "resumo" | "exemplosDescartados">;

/** Nome do lote a partir do arquivo: "crm-oficinas-suzano.csv" → "Oficinas suzano". */
function nomeDoArquivo(arquivo: string) {
  const base = arquivo
    .replace(/\.[^.]+$/, "")
    .replace(/^(crm|results?)[-_]/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return base ? base[0].toUpperCase() + base.slice(1) : "Importação";
}

const ROTULO_CLASSE: Record<CategoriaDoArquivo["classe"], string> = {
  OFICINA: "oficina",
  AUTOPECA: "autopeça: vai para a lista do Peça Peça",
  FORA: "fora do público",
  OUTRA: "outra",
};

export function ImportarCsv() {
  const router = useRouter();
  const avisar = useAvisar();
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<Record<string, string>[] | null>(null);
  const [nome, setNome] = useState("");
  const [previa, setPrevia] = useState<Previa | null>(null);
  // Categorias que a pessoa mudou do padrão: true = entra, false = fica de fora.
  const [escolhas, setEscolhas] = useState<Map<string, boolean>>(new Map());
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [gravado, setGravado] = useState<{ novos: number; atualizados: number } | null>(null);

  const escolhaParaApi = (m: Map<string, boolean>) => ({
    excluir: [...m.entries()].filter(([, v]) => !v).map(([k]) => k),
    incluir: [...m.entries()].filter(([, v]) => v).map(([k]) => k),
  });

  async function pedir(modo: "previa" | "gravar", corpoLinhas: Record<string, string>[], m: Map<string, boolean>) {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/plataforma/prospeccao/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modo, linhas: corpoLinhas, ...escolhaParaApi(m), nome: nome.trim(), arquivo }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error || "Não foi possível ler o arquivo");
        return null;
      }
      return json;
    } catch {
      setErro("Sem conexão com o servidor");
      return null;
    } finally {
      setCarregando(false);
    }
  }

  async function escolherArquivo(file: File | undefined) {
    setPrevia(null);
    setGravado(null);
    setEscolhas(new Map());
    setErro(null);
    if (!file) return;
    const texto = await file.text();
    // Só as colunas que o importador usa, e cada campo com teto: o envio fica leve.
    const { linhas: lidas } = lerCsvComCabecalho(texto, colunaConhecida);
    const enxutas = lidas.map((l) => Object.fromEntries(Object.entries(l).map(([k, v]) => [k, v.slice(0, 4000)])));
    if (enxutas.length === 0) {
      setErro("O arquivo não tem linhas, ou não tem nenhuma coluna conhecida (nome, telefone, endereço...).");
      return;
    }
    if (enxutas.length > MAX_LINHAS_IMPORTACAO) {
      setErro(`O arquivo tem ${enxutas.length} linhas. O máximo por importação é ${MAX_LINHAS_IMPORTACAO}: divida em partes.`);
      return;
    }
    setArquivo(file.name);
    setNome(nomeDoArquivo(file.name));
    setLinhas(enxutas);
    const json = await pedir("previa", enxutas, new Map());
    if (json) setPrevia(json);
  }

  async function alternar(c: CategoriaDoArquivo) {
    if (!linhas) return;
    const m = new Map(escolhas);
    m.set(c.categoria, !c.incluida);
    setEscolhas(m);
    const json = await pedir("previa", linhas, m);
    if (json) setPrevia(json);
  }

  async function gravar() {
    if (!linhas || !previa) return;
    if (!nome.trim()) {
      setErro("Dê um nome ao lote");
      return;
    }
    const json = await pedir("gravar", linhas, escolhas);
    if (!json) return;
    setGravado({ novos: json.resumo.novos, atualizados: json.resumo.atualizados });
    avisar("Importação concluída");
    router.refresh();
  }

  if (gravado) {
    return (
      <Painel titulo="Importação concluída">
        <p className="text-sm text-tinta-2">
          {gravado.novos} lead{gravado.novos === 1 ? " novo entrou" : "s novos entraram"}
          {gravado.atualizados > 0 ? ` e ${gravado.atualizados} já existente${gravado.atualizados === 1 ? " foi atualizado" : "s foram atualizados"}` : ""}.
          As primeiras mensagens já estão na fila de hoje.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <BotaoLink href="/admin/prospeccao">Ver tarefas do dia</BotaoLink>
          <BotaoLink href="/admin/prospeccao/leads" variante="secundario">
            Ver os leads
          </BotaoLink>
          <Botao variante="fantasma" onClick={() => setGravado(null)}>
            Importar outro
          </Botao>
        </div>
      </Painel>
    );
  }

  const r = previa?.resumo;

  return (
    <div className="space-y-5">
      <Painel
        titulo="1. Escolha o arquivo"
        ajuda="O CSV do scraper (o completo do --crm ou o simples). Nada é gravado antes de você conferir."
      >
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => escolherArquivo(e.target.files?.[0])}
          className="block w-full text-sm text-tinta-2 file:mr-3 file:min-h-11 file:rounded-lg file:border file:border-linha-forte file:bg-superficie file:px-4 file:text-sm file:font-medium file:text-tinta-2 hover:file:bg-superficie-2"
        />
        {erro && (
          <p role="alert" className="mt-3 text-sm text-perigo">
            {erro}
          </p>
        )}
        {carregando && !previa && <p className="mt-3 text-sm text-tinta-3">Lendo o arquivo...</p>}
      </Painel>

      {previa && r && (
        <>
          <Painel titulo="2. Confira" ajuda={`${previa.linhas} linhas no arquivo.`}>
            <div className="space-y-3">
              <FaixaMetricas colunas={4}>
                <Metrica rotulo="Novos" valor={String(r.novos)} tom="ok" tamanho="grande" />
                <Metrica
                  rotulo="Já existiam"
                  valor={String(r.jaExistiam)}
                  sub={r.atualizados > 0 ? `${r.atualizados} com dados novos` : "nada a atualizar"}
                />
                <Metrica rotulo="Repetidos no arquivo" valor={String(r.repetidosNoArquivo)} />
                <Metrica rotulo="Fora do público" valor={String(r.foraDoPublico + r.semNome)} sub="pelas categorias abaixo" />
              </FaixaMetricas>
              <FaixaMetricas colunas={6}>
                <Metrica rotulo="Celular" valor={String(r.celular)} sub="vão direto para a fila" />
                <Metrica rotulo="Fixo" valor={String(r.fixo)} sub="conferir se tem WhatsApp" />
                <Metrica rotulo="Sem telefone" valor={String(r.semTelefone)} />
                <Metrica rotulo="Autopeças" valor={String(r.autopecas)} sub="lista do Peça Peça" />
                <Metrica
                  rotulo="Já usam o boxOS"
                  valor={String(r.jaClientes)}
                  tom={r.jaClientes > 0 ? "atencao" : "neutro"}
                  sub="entram como já clientes, sem mensagens"
                />
                <Metrica rotulo="Não contatar" valor={String(r.naoContatar)} sub="continuam fora da fila" />
              </FaixaMetricas>
            </div>
          </Painel>

          <Painel
            titulo="Categorias"
            ajuda="O Google mistura de tudo. Marque o que entra; as autopeças ficam separadas, para o Peça Peça."
          >
            <ul className="divide-y divide-linha">
              {previa.categorias.map((c) => (
                <li key={c.categoria || "-"}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      checked={c.incluida}
                      onChange={() => alternar(c)}
                      disabled={carregando}
                      className="h-4 w-4 accent-brand-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span className={cn("text-sm", c.incluida ? "text-tinta" : "text-tinta-3")}>{c.rotulo}</span>
                      {c.categoria && c.rotulo !== c.categoria && (
                        <span className="ml-1.5 text-xs text-tinta-3">{c.categoria}</span>
                      )}
                      <span className="block text-xs text-tinta-3">{ROTULO_CLASSE[c.classe]}</span>
                    </span>
                    <span className="text-sm tabular-nums text-tinta-2">{c.total}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Painel>

          {previa.exemplosDescartados.length > 0 && (
            <details className="rounded-xl border border-linha bg-superficie p-4">
              <summary className="cursor-pointer text-sm font-medium text-tinta-2">
                Ver o que ficou de fora ({previa.exemplosDescartados.length}
                {previa.exemplosDescartados.length === 30 ? "+" : ""})
              </summary>
              <ul className="mt-3 space-y-1 text-sm">
                {previa.exemplosDescartados.map((d, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="truncate text-tinta-2">{d.nome}</span>
                    <span className="shrink-0 text-xs text-tinta-3">{d.motivo}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <Painel titulo="3. Grave">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Campo rotulo="Nome do lote" ajuda="Cidade e busca, para comparar depois. Ex.: Suzano, oficina mecânica" className="sm:max-w-sm sm:flex-1">
                <Entrada value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} />
              </Campo>
              <Botao onClick={gravar} disabled={carregando || (r.novos === 0 && r.atualizados === 0)}>
                {carregando
                  ? "Gravando..."
                  : r.novos === 0 && r.atualizados === 0
                    ? "Nada novo para gravar"
                    : `Importar ${r.novos} novo${r.novos === 1 ? "" : "s"}${r.atualizados ? ` e atualizar ${r.atualizados}` : ""}`}
              </Botao>
            </div>
            {erro && (
              <p role="alert" className="mt-3 text-sm text-perigo">
                {erro}
              </p>
            )}
          </Painel>
        </>
      )}

      <p className="text-xs text-tinta-3">
        Duplicatas são achadas pelo identificador do Google, pelo telefone e pelo nome com CEP. Reimportar o mesmo lugar só
        completa dados vazios e renova nota e avaliações: etapa, anotações e &ldquo;não contatar&rdquo; nunca mudam.{" "}
        <Link href="/admin/prospeccao/leads" className="text-brand-texto hover:underline">
          Ver os leads
        </Link>
      </p>
    </div>
  );
}
