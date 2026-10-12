import Link from "next/link";
import { Voltar } from "@/components/ui/Icones";

/** Título das telas do painel admin, com volta opcional (na ficha da oficina). */
export function CabecalhoAdmin({
  titulo,
  texto,
  voltar,
  acao,
}: {
  titulo: string;
  texto?: string;
  voltar?: { href: string; rotulo: string };
  acao?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {voltar && (
        <Link href={voltar.href} className="inline-flex items-center gap-1 text-sm text-tinta-3 hover:text-tinta">
          <Voltar tamanho={14} />
          {voltar.rotulo}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-tinta sm:text-2xl">{titulo}</h1>
          {texto && <p className="mt-0.5 text-sm text-tinta-3">{texto}</p>}
        </div>
        {acao}
      </div>
    </div>
  );
}
