"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Papel } from "@/lib/permissoes";
import { LogoBoxOS, SimboloBoxOS } from "../marca/LogoBoxOS";
import { NotificacaoSino } from "../ui/Notificacoes";
import { SeletorTema } from "../ui/Tema";
import { Chave, Dinheiro, Fechar, Mais, Menu as IconeMenu, Patio, PecaPeca, Sair } from "../ui/Icones";

// Menu do painel admin do boxOS. Mesmo desenho do menu da oficina (Sidebar.tsx) —
// lateral no computador, cabeçalho e barra inferior no celular —, com os destinos
// da plataforma no lugar dos da oficina.

type Item = { href: string; label: string; Icone: typeof Patio; exato?: boolean };

const ITENS: Item[] = [
  { href: "/admin", label: "Visão geral", Icone: Patio, exato: true },
  { href: "/admin/oficinas", label: "Oficinas", Icone: Chave },
  { href: "/admin/convites", label: "Convites", Icone: Mais },
  { href: "/admin/receita", label: "Receita", Icone: Dinheiro },
  // As autopeças do Peça Peça: cadastro manual, por região.
  { href: "/admin/lojas", label: "Lojas", Icone: PecaPeca },
];

export function AdminSidebar({ usuario }: { usuario: { nome: string; email: string; papel: Papel } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

  const ativo = (i: Item) => (i.exato ? pathname === i.href : pathname.startsWith(i.href));

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

  const brand = (
    <div className="min-w-0 text-menu-fg">
      <LogoBoxOS className="text-2xl" />
      <p className="mt-1.5 truncate text-xs font-medium text-menu-texto">Painel admin</p>
    </div>
  );

  const nav = (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {ITENS.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={ativo(i) ? "page" : undefined}
          className={cn(
            "flex min-h-11 items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
            ativo(i)
              ? "bg-brand-600 text-brand-fg"
              : "text-menu-texto hover:bg-menu-hover hover:text-menu-fg"
          )}
        >
          <i.Icone tamanho={17} className="shrink-0 opacity-80" />
          <span className="min-w-0 flex-1 truncate">{i.label}</span>
        </Link>
      ))}
    </nav>
  );

  const rodape = (
    <div className="space-y-2 border-t border-menu-borda p-3 pb-segura">
      <SeletorTema />
      <div className="flex items-center gap-2 rounded-md px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-menu-fg">{usuario.nome}</p>
          <p className="truncate text-xs text-menu-texto">{usuario.email}</p>
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
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-menu-borda bg-menu text-menu-fg md:flex">
        <div className="flex items-center justify-between gap-2 border-b border-menu-borda px-4 py-5">
          {brand}
          <NotificacaoSino papel={usuario.papel} className="-mr-1" painelDesktop="esquerda" />
        </div>
        {nav}
        {rodape}
      </aside>

      {/* Barra superior do celular */}
      <header className="no-print fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-menu-borda bg-menu px-4 text-menu-fg md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-menu-texto hover:bg-menu-hover hover:text-menu-fg active:bg-menu-hover"
        >
          <IconeMenu tamanho={22} />
        </button>
        <span role="img" aria-label="boxOS" className="text-menu-fg">
          <SimboloBoxOS className="h-7 w-[2.15rem]" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight text-menu-fg">
          Painel admin
        </span>
        <NotificacaoSino papel={usuario.papel} />
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

      {/* Navegação inferior do celular: todos os destinos, sem passar pela gaveta. */}
      <nav
        aria-label="Navegação do painel"
        className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-superficie/95 pb-segura backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-5">
          {ITENS.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              aria-current={ativo(i) ? "page" : undefined}
              className={cn(
                "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 transition-colors",
                ativo(i) ? "text-brand-texto" : "text-tinta-3"
              )}
            >
              <i.Icone tamanho={19} />
              <span className="text-xs leading-none">{i.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
