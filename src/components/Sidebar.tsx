"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { labelPapel, type Papel } from "@/lib/permissoes";

type LinkDef = {
  href: string;
  label: string;
  exact?: boolean;
  badge?: number;
  children?: LinkDef[];
  /** Só o dono vê. Esconder é conforto; quem barra de verdade é o proxy. */
  dono?: boolean;
};

export function Sidebar({
  pendingCount = 0,
  nome = "Minha Oficina",
  logoUrl = null,
  usuario,
}: {
  pendingCount?: number;
  nome?: string;
  logoUrl?: string | null;
  usuario: { nome: string; papel: Papel };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saindo, setSaindo] = useState(false);

  const ehDono = usuario.papel === "ADMIN";

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

  const todosOsLinks: LinkDef[] = [
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
      children: [{ href: "/produtividade", label: "Produtividade", dono: true }],
    },
    { href: "/contas-receber", label: "Contas a Receber", badge: pendingCount, dono: true },
    { href: "/despesas", label: "Contas a Pagar", dono: true },
    { href: "/caixa", label: "Caixa", dono: true },
  ];

  const permitido = (link: LinkDef) => ehDono || !link.dono;

  const links = todosOsLinks
    .filter(permitido)
    .map((link) => ({ ...link, children: link.children?.filter(permitido) }));

  async function sair() {
    setSaindo(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setSaindo(false);
    }
  }

  const isLinkActive = (link: LinkDef) =>
    link.exact ? pathname === link.href : pathname.startsWith(link.href);

  const toggleExpand = (href: string) =>
    setExpanded((prev) => ({ ...prev, [href]: !prev[href] }));

  // Sem logo configurada, a marca cai numa inicial em bloco — nunca uma imagem quebrada.
  const inicial = nome.trim().charAt(0).toUpperCase() || "O";

  const marca = (tamanho: "sm" | "md") => {
    const box = tamanho === "sm" ? "h-8 w-8" : "h-11 w-11";
    return logoUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={nome}
        className={cn("shrink-0 object-contain", box)}
      />
    ) : (
      <span
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-brand-600 font-black text-brand-fg",
          box,
          tamanho === "sm" ? "text-sm" : "text-lg"
        )}
      >
        {inicial}
      </span>
    );
  };

  const brand = (
    <div className="flex min-w-0 items-center gap-2.5">
      {marca("md")}
      <span className="min-w-0 truncate text-sm font-bold tracking-tight text-menu-fg">
        {nome}
      </span>
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
                  ? "bg-brand-700 text-brand-fg"
                  : "text-menu-texto hover:bg-menu-hover hover:text-menu-fg"
              )}
            >
              <Link
                href={link.href}
                className="flex min-h-11 flex-1 items-center justify-between px-3 py-2.5 text-sm font-medium"
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
                  className="px-2 py-2.5 text-current hover:text-menu-fg"
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
              <div className="mt-0.5 ml-3 space-y-0.5 border-l border-menu-borda pl-2">
                {link.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                      isLinkActive(child)
                        ? "bg-brand-700 text-brand-fg font-medium"
                        : "text-menu-texto hover:bg-menu-hover hover:text-menu-fg"
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

  // Quem está logado, configurações (só o dono) e a saída — separados da operação.
  const rodape = (
    <div className="space-y-1 border-t border-menu-borda p-3">
      {ehDono && (
        <Link
          href="/configuracoes"
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/configuracoes")
              ? "bg-brand-700 text-brand-fg"
              : "text-menu-texto hover:bg-menu-hover hover:text-menu-fg"
          )}
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
            className="shrink-0"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Configurações
        </Link>
      )}

      <div className="flex items-center gap-2 rounded-md px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-menu-fg">{usuario.nome}</p>
          <p className="text-xs text-menu-texto">{labelPapel(usuario.papel)}</p>
        </div>
        <button
          type="button"
          onClick={sair}
          disabled={saindo}
          title="Sair"
          aria-label="Sair"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-menu-texto hover:bg-menu-hover hover:text-menu-fg disabled:opacity-50"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-56 bg-menu text-menu-fg flex-col shrink-0 no-print">
        <div className="px-4 py-5 border-b border-menu-borda">{brand}</div>
        {nav}
        {rodape}
      </aside>

      {/* Barra superior mobile (fixa) */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center gap-3 bg-menu text-menu-fg px-4 no-print">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-menu-texto hover:bg-menu-hover hover:text-menu-fg active:bg-menu-hover"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        {marca("sm")}
        <span className="min-w-0 truncate text-sm font-bold tracking-tight text-menu-fg">{nome}</span>
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
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-menu text-menu-fg flex flex-col shadow-xl animate-in">
            <div className="px-4 py-5 border-b border-menu-borda flex items-center justify-between gap-2">
              {brand}
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-menu-texto hover:bg-menu-hover hover:text-menu-fg active:bg-menu-hover"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {nav}
            {rodape}
          </aside>
        </div>
      )}
    </>
  );
}
