"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ABAS = [
  { href: "/configuracoes", label: "Oficina" },
  { href: "/configuracoes/usuarios", label: "Acessos" },
];

/** Navegação entre as duas telas do painel do dono. */
export default function AbasConfiguracoes() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex gap-1 border-b border-zinc-200">
      {ABAS.map((aba) => {
        const ativa = pathname === aba.href;
        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              ativa
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            )}
          >
            {aba.label}
          </Link>
        );
      })}
    </div>
  );
}
