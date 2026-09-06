import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { BotaoLink } from "@/components/ui/Botao";
import { BuscaLive } from "@/components/ui/BuscaLive";
import { Vazio } from "@/components/ui/Dados";
import { Mais } from "@/components/ui/Icones";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; de?: string; ate?: string }>;
}) {
  const { q, de, ate } = await searchParams;

  const clientes = await prisma.cliente.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { nome: { contains: q, mode: "insensitive" } },
                { apelido: { contains: q, mode: "insensitive" } },
                { telefone: { contains: q } },
                { cpfCnpj: { contains: q } },
                {
                  veiculos: {
                    some: {
                      OR: [
                        { placa: { contains: q, mode: "insensitive" } },
                        { marca: { contains: q, mode: "insensitive" } },
                        { modelo: { contains: q, mode: "insensitive" } },
                      ],
                    },
                  },
                },
              ],
            }
          : {},
        de ? { createdAt: { gte: new Date(de) } } : {},
        ate ? { createdAt: { lte: new Date(ate + "T23:59:59") } } : {},
      ],
    },
    include: { _count: { select: { veiculos: true, ordens: true } } },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-tinta sm:text-2xl">Clientes</h1>
        <BotaoLink href="/clientes/novo">
          <Mais tamanho={16} /> Novo cliente
        </BotaoLink>
      </div>

      {/* Busca ao vivo, como nas outras listas — antes esta era a única que
          exigia apertar "Filtrar". As datas seguem em formulário porque são
          recorte, não busca. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Suspense fallback={<div className="h-10 flex-1 sm:max-w-sm" />}>
          <BuscaLive
            placeholder="Buscar por nome, apelido, placa, marca ou modelo"
            rotulo="Buscar clientes"
            className="flex-1 sm:max-w-sm"
          />
        </Suspense>
        <form className="flex flex-wrap items-center gap-2">
          {q && <input type="hidden" name="q" value={q} />}
          <input
            type="date"
            name="de"
            defaultValue={de}
            aria-label="Cadastrado a partir de"
            className="rounded-lg border border-linha-forte bg-superficie px-3 py-2 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="date"
            name="ate"
            defaultValue={ate}
            aria-label="Cadastrado até"
            className="rounded-lg border border-linha-forte bg-superficie px-3 py-2 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-lg border border-linha-forte bg-superficie px-4 text-sm font-medium text-tinta-2 hover:bg-superficie-2 sm:min-h-9"
          >
            Aplicar datas
          </button>
          {(q || de || ate) && (
            <Link
              href="/clientes"
              className="inline-flex min-h-11 items-center rounded-lg border border-linha-forte bg-superficie px-4 text-sm text-tinta-2 hover:bg-superficie-2 sm:min-h-9"
            >
              Limpar
            </Link>
          )}
        </form>
      </div>

      {clientes.length === 0 ? (
        q || de || ate ? (
          <Vazio
            titulo="Nenhum cliente encontrado"
            texto={q ? `Nada corresponde a “${q}”. Tente outro nome, apelido ou placa.` : "Nenhum cadastro no período escolhido."}
            acao={
              <Link
                href="/clientes"
                className="inline-flex min-h-11 items-center rounded-lg border border-linha-forte bg-superficie px-4 text-sm font-medium text-tinta-2 hover:bg-superficie-2"
              >
                Limpar filtros
              </Link>
            }
          />
        ) : (
          <Vazio
            titulo="Nenhum cliente cadastrado"
            texto="O cliente é o começo de tudo: com ele cadastrado dá para abrir orçamento e OS."
            acao={
              <BotaoLink href="/clientes/novo">
                <Mais tamanho={16} /> Cadastrar o primeiro
              </BotaoLink>
            }
          />
        )
      ) : (
        <div className="overflow-hidden rounded-xl border border-linha bg-superficie divide-y divide-linha">
          {clientes.map((c) => (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-superficie-2 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-tinta">{c.nome}</p>
                  {c.apelido && (
                    <span className="rounded-full bg-superficie-3 px-2 py-0.5 text-xs text-tinta-3">
                      {c.apelido}
                    </span>
                  )}
                </div>
                <p className="text-sm text-tinta-3">
                  {c.telefone || "Sem telefone"}
                  {c.cpfCnpj ? ` · ${c.cpfCnpj}` : ""}
                  {c.cidade ? ` · ${c.cidade}` : ""}
                </p>
              </div>
              <div className="text-right text-xs text-tinta-3 shrink-0 ml-4">
                <p className="text-tinta-3">{formatDate(c.createdAt)}</p>
                <p>{c._count.veiculos} veículo{c._count.veiculos !== 1 ? "s" : ""} · {c._count.ordens} OS</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
