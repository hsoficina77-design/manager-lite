"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type LinkDef = {
  href: string;
  label: string;
  exact?: boolean;
  badge?: number;
  children?: LinkDef[];
};

export function Sidebar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Fecha o drawer ao navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Trava o scroll do body enquanto o drawer está aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const links: LinkDef[] = [
    { href: "/", label: "Dashboard", exact: true },
    { href: "/clientes", label: "Clientes" },
    {
      href: "/os",
      label: "Ordens de Serviço",
      children: [{ href: "/orcamentos", label: "Orçamentos" }],
    },
    {
      href: "/mecanicos",
      label: "Mecânicos",
      children: [{ href: "/produtividade", label: "Produtividade" }],
    },
    { href: "/contas-receber", label: "Contas a Receber", badge: pendingCount },
    { href: "/despesas", label: "Contas a Pagar" },
    { href: "/caixa", label: "Caixa" },
  ];

  const isLinkActive = (link: LinkDef) =>
    link.exact ? pathname === link.href : pathname.startsWith(link.href);

  const toggleExpand = (href: string) =>
    setExpanded((prev) => ({ ...prev, [href]: !prev[href] }));

  const brand = (
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-hs.png" alt="HS Oficina Mecânica" width={44} height={44} className="shrink-0 h-11 w-11 object-contain" />
      <div className="leading-tight">
        <span className="block font-bold text-white text-sm tracking-tight">HS Oficina</span>
        <span className="text-xs text-zinc-500">Mecânica</span>
      </div>
    </div>
  );

  const nav = (
    <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
      {links.map((link) => {
        const isActive = isLinkActive(link);
        const childActive = link.children?.some(isLinkActive) ?? false;
        const hasChildren = !!link.children?.length;
        const isExpanded = expanded[link.href] ?? (isActive || childActive);
        return (
          <div key={link.href}>
            <div
              className={cn(
                "flex items-center rounded-md transition-colors",
                isActive && !childActive
                  ? "bg-red-700 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              <Link
                href={link.href}
                className="flex flex-1 items-center justify-between px-3 py-2.5 text-sm font-medium"
              >
                <span>{link.label}</span>
                {link.badge != null && link.badge > 0 && (
                  <span className="rounded-full bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 min-w-[1.25rem] text-center">
                    {link.badge > 99 ? "99+" : link.badge}
                  </span>
                )}
              </Link>
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleExpand(link.href)}
                  aria-label={isExpanded ? `Recolher ${link.label}` : `Expandir ${link.label}`}
                  aria-expanded={isExpanded}
                  className="px-2 py-2.5 text-current hover:text-white"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className={cn("transition-transform", isExpanded && "rotate-180")}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
            </div>
            {link.children && isExpanded && (
              <div className="mt-0.5 ml-3 space-y-0.5 border-l border-zinc-800 pl-2">
                {link.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                      isLinkActive(child)
                        ? "bg-red-700 text-white font-medium"
                        : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                    )}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-56 bg-zinc-950 text-zinc-100 flex-col shrink-0 no-print">
        <div className="px-4 py-5 border-b border-zinc-800">{brand}</div>
        {nav}
      </aside>

      {/* Barra superior mobile (fixa) */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center gap-3 bg-zinc-950 text-zinc-100 px-4 no-print">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="-ml-1 rounded-md p-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-hs.png" alt="HS Oficina Mecânica" width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />
        <span className="font-bold text-white text-sm tracking-tight">HS Oficina</span>
        {pendingCount > 0 && (
          <Link
            href="/contas-receber"
            className="ml-auto rounded-full bg-red-600 text-white text-xs font-bold px-2 py-0.5 min-w-[1.5rem] text-center"
          >
            {pendingCount > 99 ? "99+" : pendingCount}
          </Link>
        )}
      </header>

      {/* Drawer mobile */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 no-print">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-zinc-950 text-zinc-100 flex flex-col shadow-xl animate-in">
            <div className="px-4 py-5 border-b border-zinc-800 flex items-center justify-between">
              {brand}
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
