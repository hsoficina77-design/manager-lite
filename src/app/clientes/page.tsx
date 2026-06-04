import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Clientes</h1>
        <Link
          href="/clientes/novo"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          + Novo Cliente
        </Link>
      </div>

      <form className="mb-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, apelido, placa, marca, modelo..."
          className="flex-1 min-w-48 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          autoComplete="off"
        />
        <input
          type="date"
          name="de"
          defaultValue={de}
          title="Cadastro a partir de"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <input
          type="date"
          name="ate"
          defaultValue={ate}
          title="Cadastro até"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Filtrar
        </button>
        {(q || de || ate) && (
          <Link
            href="/clientes"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Limpar
          </Link>
        )}
      </form>

      {clientes.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
          {q ? `Nenhum cliente encontrado para "${q}".` : "Nenhum cliente cadastrado."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
          {clientes.map((c) => (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-zinc-900">{c.nome}</p>
                  {c.apelido && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                      {c.apelido}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500">
                  {c.telefone || "Sem telefone"}
                  {c.cpfCnpj ? ` · ${c.cpfCnpj}` : ""}
                  {c.cidade ? ` · ${c.cidade}` : ""}
                </p>
              </div>
              <div className="text-right text-xs text-zinc-400 shrink-0 ml-4">
                <p className="text-zinc-500">{formatDate(c.createdAt)}</p>
                <p>{c._count.veiculos} veículo{c._count.veiculos !== 1 ? "s" : ""} · {c._count.ordens} OS</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
