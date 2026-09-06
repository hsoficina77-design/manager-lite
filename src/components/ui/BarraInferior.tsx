"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Papel } from "@/lib/permissoes";
import { Dinheiro, Mais, Patio, Recibo, Menu } from "./Icones";

/**
 * Navegação inferior do celular.
 *
 * Antes toda navegação passava pelo hambúrguer: ir do pátio para contas a
 * receber custava três toques — abrir a gaveta, achar o item numa lista só de
 * texto, tocar. Numa oficina, com o celular numa das mãos, esse é o gesto mais
 * repetido do dia.
 *
 * Quatro destinos fixos mais "Nova OS", que no dashboard ficava soterrado abaixo
 * da lista inteira do pátio. Some na impressão e no desktop, onde o menu lateral
 * já resolve.
 */

type Item = {
  href: string;
  label: string;
  Icone: typeof Patio;
  /** Casa exata; sem isto "/" acenderia em toda tela. */
  exato?: boolean;
  dono?: boolean;
};

const ITENS: Item[] = [
  { href: "/", label: "Pátio", Icone: Patio, exato: true },
  { href: "/os", label: "OS", Icone: Recibo },
  { href: "/contas-receber", label: "A receber", Icone: Dinheiro, dono: true },
  { href: "/despesas", label: "Gastos", Icone: Menu, dono: true },
];

export function BarraInferior({
  papel,
  onAbrirMenu,
}: {
  papel: Papel;
  onAbrirMenu: () => void;
}) {
  const pathname = usePathname();
  const ehDono = papel === "ADMIN";

  // Para o operador as duas telas de dinheiro não existem; entram clientes e
  // mecânicos, que são o que ele de fato abre.
  const itens: Item[] = ehDono
    ? ITENS
    : [
        { href: "/", label: "Pátio", Icone: Patio, exato: true },
        { href: "/os", label: "OS", Icone: Recibo },
        { href: "/clientes", label: "Clientes", Icone: Dinheiro },
        { href: "/mecanicos", label: "Mecânicos", Icone: Menu },
      ];

  const ativo = (i: Item) => (i.exato ? pathname === i.href : pathname.startsWith(i.href));

  return (
    <nav
      aria-label="Navegação principal"
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-superficie/95 pb-segura backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-5">
        {itens.slice(0, 2).map((i) => (
          <BotaoBarra key={i.href} item={i} ativo={ativo(i)} />
        ))}

        {/* Ação primária no centro, onde o polegar alcança sem reposicionar a mão. */}
        <Link
          href="/os/nova"
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 text-brand-600"
          aria-label="Nova OS"
        >
          <span className="flex h-8 w-12 items-center justify-center rounded-full bg-brand-600 text-brand-fg">
            <Mais tamanho={20} />
          </span>
          <span className="text-[11px] font-medium leading-none">Nova OS</span>
        </Link>

        {itens.slice(2, 4).map((i) => (
          <BotaoBarra key={i.href} item={i} ativo={ativo(i)} />
        ))}

        {itens.length < 4 && (
          <button
            type="button"
            onClick={onAbrirMenu}
            className="flex min-h-[3.25rem] flex-col items-center justify-center gap-1 text-tinta-3"
          >
            <Menu tamanho={19} />
            <span className="text-[11px] leading-none">Menu</span>
          </button>
        )}
      </div>
    </nav>
  );
}

function BotaoBarra({ item, ativo }: { item: Item; ativo: boolean }) {
  const { Icone } = item;
  return (
    <Link
      href={item.href}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 transition-colors",
        ativo ? "text-brand-600" : "text-tinta-3"
      )}
    >
      <Icone tamanho={19} />
      <span className="text-[11px] leading-none">{item.label}</span>
    </Link>
  );
}
