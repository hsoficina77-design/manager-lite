"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { labelPapel, type Papel } from "@/lib/permissoes";
import { BarraInferior } from "./ui/BarraInferior";
import { SeletorTema } from "./ui/Tema";
import {
  Chevron,
  Dinheiro,
  Engrenagem,
  Fechar,
  Menu as IconeMenu,
  Patio,
  Recibo,
  Sair,
} from "./ui/Icones";

type IconeNav = typeof Patio;

type LinkDef = {
  href: string;
  label: string;
  exact?: boolean;
  badge?: number;
  children?: LinkDef[];
  Icone?: IconeNav;
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

  // Trava o scroll do body e fecha no Escape enquanto o drawer está aberto
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [open]);

  const todosOsLinks: LinkDef[] = [
    { href: "/", label: "Dashboard", exact: true, Icone: Patio },
    { href: "/clientes", label: "Clientes", Icone: Dinheiro },
    {
      href: "/os",
      label: "Ordens de serviço",
      Icone: Recibo,
      children: [{ href: "/orcamentos", label: "Orçamentos" }],
    },
    {
      href: "/mecanicos",
      label: "Mecânicos",
      Icone: IconeMenu,
      children: [{ href: "/produtividade", label: "Produtividade", dono: true }],
    },
    {
      href: "/contas-receber",
      label: "Contas a receber",
      badge: pendingCount,
      dono: true,
      Icone: Dinheiro,
    },
    { href: "/despesas", label: "Controle de gastos", dono: true, Icone: Recibo },
    { href: "/caixa", label: "Caixa", dono: true, Icone: Dinheiro },
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
      <img src={logoUrl} alt={nome} className={cn("shrink-0 object-contain", box)} />
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

  // O contador de pendências não usa o vermelho da marca: numa oficina de
  // identidade vermelha ele sumiria dentro do próprio menu. O anel na cor do
  // fundo o separa de qualquer identidade escolhida.
  const contador = (n: number, className?: string) => (
    <span
      className={cn(
        "rounded-full bg-perigo px-1.5 py-0.5 text-center text-xs font-bold text-perigo-fg ring-2 ring-menu",
        className
      )}
    >
      {n > 99 ? "99+" : n}
    </span>
  );

  const nav = (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {links.map((link) => {
        const isActive = isLinkActive(link);
        const childActive = link.children?.some(isLinkActive) ?? false;
        const hasChildren = !!link.children?.length;
        const isExpanded = expanded[link.href] ?? (isActive || childActive);
        const Icone = link.Icone;
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
                className="flex min-h-11 flex-1 items-center gap-2.5 px-3 py-2.5 text-sm font-medium"
              >
                {Icone && <Icone tamanho={17} className="shrink-0 opacity-80" />}
                <span className="min-w-0 flex-1 truncate">{link.label}</span>
                {link.badge != null && link.badge > 0 && contador(link.badge)}
              </Link>
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleExpand(link.href)}
                  aria-label={isExpanded ? `Recolher ${link.label}` : `Expandir ${link.label}`}
                  aria-expanded={isExpanded}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-current hover:text-menu-fg"
                >
                  <Chevron
                    tamanho={16}
                    className={cn("transition-transform", isExpanded && "rotate-180")}
                  />
                </button>
              )}
            </div>
            {link.children && isExpanded && (
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-menu-borda pl-2">
                {link.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "flex min-h-11 items-center rounded-md px-3 py-2 text-sm transition-colors",
                      isLinkActive(child)
                        ? "bg-brand-700 font-medium text-brand-fg"
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

  // Quem está logado, tema, configurações (só o dono) e a saída — separados da operação.
  const rodape = (
    <div className="space-y-2 border-t border-menu-borda p-3 pb-segura">
      <SeletorTema />

      {ehDono && (
        <Link
          href="/configuracoes"
          className={cn(
            "flex min-h-11 items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/configuracoes")
              ? "bg-brand-700 text-brand-fg"
              : "text-menu-texto hover:bg-menu-hover hover:text-menu-fg"
          )}
        >
          <Engrenagem tamanho={16} className="shrink-0" />
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
          <Sair tamanho={18} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Menu lateral do desktop. Fixo, porque agora quem rola é o documento. */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-56 flex-col bg-menu text-menu-fg md:flex">
        <div className="border-b border-menu-borda px-4 py-5">{brand}</div>
        {nav}
        {rodape}
      </aside>

      {/* Barra superior do celular */}
      <header className="no-print fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 bg-menu px-4 text-menu-fg md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-menu-texto hover:bg-menu-hover hover:text-menu-fg active:bg-menu-hover"
        >
          <IconeMenu tamanho={22} />
        </button>
        {marca("sm")}
        <span className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight text-menu-fg">
          {nome}
        </span>
        {pendingCount > 0 && (
          <Link href="/contas-receber" aria-label={`${pendingCount} contas a receber`}>
            {contador(pendingCount, "shrink-0")}
          </Link>
        )}
      </header>

      {/* Gaveta do celular */}
      {open && (
        <div className="no-print fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="animate-in absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col bg-menu text-menu-fg shadow-xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-menu-borda px-4 py-5">
              {brand}
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-menu-texto hover:bg-menu-hover hover:text-menu-fg active:bg-menu-hover"
              >
                <Fechar tamanho={20} />
              </button>
            </div>
            {nav}
            {rodape}
          </aside>
        </div>
      )}

      {/* Navegação inferior — os destinos do dia sem passar pela gaveta */}
      <BarraInferior />
    </>
  );
}
