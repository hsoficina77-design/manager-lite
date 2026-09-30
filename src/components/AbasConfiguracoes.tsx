"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUsuario } from "@/components/UsuarioProvider";

const ABAS = [
  { href: "/configuracoes", label: "Oficina" },
  { href: "/configuracoes/usuarios", label: "Acessos" },
];

// Só para o dono da plataforma: convites e a lista de oficinas.
const ABA_PLATAFORMA = { href: "/configuracoes/plataforma", label: "Plataforma" };

/** Navegação entre as telas do painel do dono. */
export default function AbasConfiguracoes() {
  const pathname = usePathname();
  const usuario = useUsuario();
  const abas = usuario?.administraPlataforma ? [...ABAS, ABA_PLATAFORMA] : ABAS;

  return (
    <div className="mb-6 flex gap-1 border-b border-linha">
      {abas.map((aba) => {
        const ativa = pathname === aba.href;
        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              ativa
                ? "border-brand-600 text-brand-700"
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
