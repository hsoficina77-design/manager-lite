"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// A plataforma (convites, oficinas) saiu daqui: tem painel próprio em /admin, na conta
// do boxOS.
const ABAS = [
  { href: "/configuracoes", label: "Oficina" },
  { href: "/configuracoes/usuarios", label: "Acessos" },
];

/** Navegação entre as telas do painel do dono. */
export default function AbasConfiguracoes() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex gap-1 border-b border-linha">
      {ABAS.map((aba) => {
        const ativa = pathname === aba.href;
        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              ativa
                ? "border-brand-600 text-brand-texto"
                : "border-transparent text-tinta-3 hover:text-tinta"
            )}
          >
            {aba.label}
          </Link>
        );
      })}
    </div>
  );
}
