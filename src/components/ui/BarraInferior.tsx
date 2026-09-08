"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Despesa, Dinheiro, Mais, Patio, Recibo } from "./Icones";

/**
 * Navegação inferior do celular.
 *
 * Antes toda navegação passava pelo hambúrguer: ir do pátio para contas a
 * receber custava três toques — abrir a gaveta, achar o item numa lista só de
 * texto, tocar. Numa oficina, com o celular numa das mãos, esse é o gesto mais
 * repetido do dia.
 *
 * Cinco posições fixas, sempre as mesmas, nesta ordem: Pátio, OS, Nova OS,
 * A receber, Gastos. Antes os dois últimos trocavam para Clientes/Mecânicos
 * quando quem estava logado era o operador, e havia um botão de menu que nunca
 * chegava a aparecer (a lista de itens tinha sempre 4, então a condição que o
 * mostraria nunca era verdadeira) — o resultado prático eram cinco posições
 * que pareciam mudar de lugar. Agora a barra é a mesma para todo mundo; quem
 * não é dono e toca em A receber ou Gastos é devolvido ao pátio pelo proxy
 * (ver src/proxy.ts), do mesmo jeito que aconteceria clicando o link direto.
 *
 * Some na impressão e no desktop, onde o menu lateral já resolve.
 */

type Item = {
  href: string;
  label: string;
  Icone: typeof Patio;
  /** Casa exata; sem isto "/" acenderia em toda tela. */
  exato?: boolean;
};

const ANTES: Item[] = [
  { href: "/", label: "Pátio", Icone: Patio, exato: true },
  { href: "/os", label: "OS", Icone: Recibo },
];

const DEPOIS: Item[] = [
  { href: "/contas-receber", label: "A receber", Icone: Dinheiro },
  { href: "/despesas", label: "Gastos", Icone: Despesa },
];

export function BarraInferior() {
  const pathname = usePathname();

  const ativo = (i: Item) => (i.exato ? pathname === i.href : pathname.startsWith(i.href));

  return (
    <nav
      aria-label="Navegação principal"
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-superficie/95 pb-segura backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-5">
        {ANTES.map((i) => (
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
          <span className="text-xs font-medium leading-none">Nova OS</span>
        </Link>

        {DEPOIS.map((i) => (
          <BotaoBarra key={i.href} item={i} ativo={ativo(i)} />
        ))}
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
      <span className="text-xs leading-none">{item.label}</span>
    </Link>
  );
}
