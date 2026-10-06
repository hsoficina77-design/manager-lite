import Link from "next/link";
import { LogoBoxOS } from "./marca/LogoBoxOS";

// Moldura das páginas públicas de texto (termos, privacidade). Abertas sem login:
// quem lê ainda está decidindo se cria o acesso.

export function DocumentoLegal({
  titulo,
  atualizadoEm,
  children,
}: {
  titulo: string;
  atualizadoEm: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-fundo px-4 py-10">
      <article className="mx-auto max-w-2xl">
        <Link href="/teste" className="mb-8 inline-flex text-tinta" aria-label="boxOS">
          <LogoBoxOS className="text-3xl" />
        </Link>
        <h1 className="text-2xl font-bold text-tinta">{titulo}</h1>
        <p className="mt-1 text-xs text-tinta-3">Atualizado em {atualizadoEm}</p>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-tinta-2 [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-tinta [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </div>
  );
}
