"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LOGIN_DO_PECA_PECA } from "@/lib/produto";
import { LogoPecaPeca } from "@/components/marca/LogoPecaPeca";
import { useInstalarApp } from "@/components/ui/InstalarApp";
import { usePedirSaida } from "@/components/ui/SaidaSegura";
import { SeletorTema } from "@/components/ui/Tema";
import { labelPapel, type Papel } from "@/lib/permissoes";
import { PERMISSOES_DA_LOJA, rotuloDosAcessos, type PermissaoLoja } from "@/lib/acessos-loja";
import {
  Engrenagem,
  Fechar,
  Grafico,
  Instalar,
  Mais,
  Menu as IconeMenu,
  PecaPeca,
  Pessoas,
  Recibo,
  Sair,
  type Casa,
} from "@/components/ui/Icones";

// Moldura das telas do Peça Peça — a da oficina (cotações) e a da autopeça (painel da
// loja). Mais simples que o menu do boxOS: poucos destinos, todos na barra de cima no
// computador e na barra de baixo no celular; conta, tema e "sair" ficam na gaveta.

export type ItemDaMoldura = {
  href: string;
  label: string;
  Icone: typeof Casa;
  /** Casa só o endereço exato (sem isto, a lista acenderia em toda tela de dentro). */
  exato?: boolean;
  /** A ação principal: botão cheio no centro da barra do celular. */
  destaque?: boolean;
};

export type LinkDaGaveta = { href: string; label: string; externo?: boolean };

// Sem o sino de avisos: os avisos da oficina são do boxOS (espaço das fotos, plano), e o
// Peça Peça não cria nenhum. Na oficina só do Peça Peça ele ficava sempre vazio.
export function Moldura({
  nome,
  pessoa,
  itens,
  links = [],
  children,
}: {
  /** Oficina ou loja de quem está dentro. */
  nome: string;
  pessoa: { nome: string; papel: string };
  itens: ItemDaMoldura[];
  links?: LinkDaGaveta[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pedirSaida = usePedirSaida();
  const instalacao = useInstalarApp("Peça Peça");
  const [aberta, setAberta] = useState(false);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    setAberta(false);
  }, [pathname]);

  useEffect(() => {
    if (!aberta) return;
    document.body.style.overflow = "hidden";
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberta(false);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberta]);

  // O item mais específico vence: em /peca-peca/nova acende "Nova cotação", não a lista.
  const ativo = (item: ItemDaMoldura) => {
    if (item.exato) return pathname === item.href;
    if (!(pathname === item.href || pathname.startsWith(`${item.href}/`))) return false;
    return !itens.some((outro) => outro.href.length > item.href.length && pathname.startsWith(outro.href));
  };

  async function sair() {
    if (!(await pedirSaida())) return;
    setSaindo(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Carregamento completo, como depois de entrar (LoginForm): sair troca a moldura
      // inteira, que mora no layout raiz. E o login é o do Peça Peça, também no endereço
      // do boxOS. O botão fica desligado até a próxima tela abrir.
      window.location.replace(LOGIN_DO_PECA_PECA);
    } catch {
      setSaindo(false);
    }
  }

  return (
    <>
      <header className="no-print fixed inset-x-0 top-0 z-30 border-b border-menu-borda bg-menu text-menu-fg">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href={itens[0]?.href ?? "/"} className="shrink-0" aria-label="Peça Peça — início">
            <LogoPecaPeca className="text-lg" />
          </Link>
          <span className="hidden min-w-0 truncate text-xs font-medium text-menu-texto sm:block">{nome}</span>

          <nav aria-label="Navegação principal" className="ml-4 hidden flex-1 items-center gap-1 md:flex">
            {itens.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo(item) ? "page" : undefined}
                className={cn(
                  "flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                  ativo(item) ? "bg-brand-600 text-brand-fg" : "text-menu-texto hover:bg-menu-hover hover:text-menu-fg"
                )}
              >
                <item.Icone tamanho={16} className="shrink-0 opacity-80" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setAberta(true)}
              aria-label="Abrir menu da conta"
              className="flex h-11 w-11 items-center justify-center rounded-md text-menu-texto hover:bg-menu-hover hover:text-menu-fg"
            >
              <IconeMenu tamanho={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-14 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      {/* Barra de baixo do celular: os mesmos destinos da barra de cima. */}
      <nav
        aria-label="Navegação principal"
        className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-superficie/95 pb-segura backdrop-blur md:hidden"
      >
        <div className="grid" style={{ gridTemplateColumns: `repeat(${itens.length}, minmax(0, 1fr))` }}>
          {itens.map((item) =>
            item.destaque ? (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5 py-1.5 text-brand-texto"
              >
                <span className="flex h-8 w-12 items-center justify-center rounded-full bg-brand-600 text-brand-fg">
                  <item.Icone tamanho={20} />
                </span>
                <span className="text-xs font-medium leading-none">{item.label}</span>
              </Link>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo(item) ? "page" : undefined}
                className={cn(
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 transition-colors",
                  ativo(item) ? "text-brand-texto" : "text-tinta-3"
                )}
              >
                <item.Icone tamanho={19} />
                <span className="text-xs leading-none">{item.label}</span>
              </Link>
            )
          )}
        </div>
      </nav>

      {aberta && (
        <div className="no-print fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAberta(false)} />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu da conta"
            className="animate-in absolute right-0 top-0 flex h-full w-72 max-w-[85%] flex-col bg-menu text-menu-fg shadow-xl"
          >
            <div className="flex items-start justify-between gap-2 border-b border-menu-borda px-4 py-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-menu-fg">{pessoa.nome}</p>
                <p className="text-xs text-menu-texto">{pessoa.papel}</p>
                <p className="mt-1 truncate text-xs text-menu-texto">{nome}</p>
              </div>
              <button
                onClick={() => setAberta(false)}
                aria-label="Fechar menu"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-menu-texto hover:bg-menu-hover hover:text-menu-fg"
              >
                <Fechar tamanho={20} />
              </button>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto p-3">
              {links.map((l) =>
                l.externo ? (
                  <a
                    key={l.href}
                    href={l.href}
                    className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-menu-texto hover:bg-menu-hover hover:text-menu-fg"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-menu-texto hover:bg-menu-hover hover:text-menu-fg"
                  >
                    {l.label}
                  </Link>
                )
              )}
            </div>

            <div className="space-y-2 border-t border-menu-borda p-3 pb-segura">
              <SeletorTema />
              {instalacao.disponivel && (
                <button
                  type="button"
                  onClick={() => {
                    setAberta(false);
                    instalacao.instalar();
                  }}
                  className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 text-sm font-medium text-menu-texto hover:bg-menu-hover hover:text-menu-fg"
                >
                  <Instalar tamanho={16} className="shrink-0" />
                  Instalar o Peça Peça
                </button>
              )}
              <button
                type="button"
                onClick={sair}
                disabled={saindo}
                className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 text-sm font-medium text-menu-texto hover:bg-menu-hover hover:text-menu-fg disabled:opacity-50"
              >
                <Sair tamanho={16} className="shrink-0" />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      {instalacao.explicacao}
    </>
  );
}

/** A oficina no Peça Peça: cotações e nova cotação, e o boxOS na gaveta. */
export function MolduraDaOficina({
  nome,
  usuario,
  usaBoxOS,
  urlBoxOS,
  children,
}: {
  nome: string;
  usuario: { nome: string; papel: Papel };
  usaBoxOS: boolean;
  /** Endereço do boxOS, quando a tela está no endereço do Peça Peça. */
  urlBoxOS: string;
  children: React.ReactNode;
}) {
  const itens: ItemDaMoldura[] = [
    { href: "/peca-peca", label: "Cotações", Icone: PecaPeca },
    { href: "/peca-peca/nova", label: "Nova cotação", Icone: Mais, destaque: true },
  ];
  const links: LinkDaGaveta[] = usaBoxOS
    ? [{ href: urlBoxOS || "/", label: "Abrir o boxOS", externo: Boolean(urlBoxOS) }]
    : [{ href: "/conheca-o-boxos", label: "Conheça o boxOS — gestão da oficina" }];
  return (
    <Moldura
      nome={nome}
      pessoa={{ nome: usuario.nome, papel: labelPapel(usuario.papel) }}
      itens={itens}
      links={links}
    >
      {children}
    </Moldura>
  );
}

/** Quem trabalha na autopeça: o balcão e o que o acesso da pessoa liberar. */
export function MolduraDaLoja({
  loja,
  pessoa,
  children,
}: {
  loja: string;
  pessoa: { nome: string; permissoes: PermissaoLoja[] };
  children: React.ReactNode;
}) {
  const pode = (p: PermissaoLoja) => pessoa.permissoes.includes(p);
  const itens: ItemDaMoldura[] = [
    { href: "/loja", label: "Balcão", Icone: Recibo },
    ...(pode("loja.resumo") ? [{ href: "/loja/resumo", label: "Resumo", Icone: Grafico }] : []),
    ...(pode("loja.equipe") ? [{ href: "/loja/equipe", label: "Equipe", Icone: Pessoas }] : []),
    ...(pode("loja.dados") ? [{ href: "/loja/dados", label: "Loja", Icone: Engrenagem }] : []),
  ];
  // A gaveta mostra o que a pessoa pode, para ela saber a quem pedir o resto.
  const acessos = PERMISSOES_DA_LOJA.filter((p) => pode(p.chave)).map((p) => p.rotulo);
  return (
    <Moldura
      nome={loja}
      pessoa={{ nome: pessoa.nome, papel: `${rotuloDosAcessos(pessoa.permissoes)} · ${acessos.length} acessos` }}
      itens={itens}
    >
      {children}
    </Moldura>
  );
}
