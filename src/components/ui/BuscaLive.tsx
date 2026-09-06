"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { BASE_CAMPO } from "./Campos";
import { Busca, Fechar } from "./Icones";

/**
 * Busca que filtra enquanto se digita.
 *
 * Existiam quatro listas com quatro comportamentos: orçamentos e contas a receber
 * filtravam ao vivo, clientes usava formulário de servidor com botão, e a lista
 * de OS escondia a busca atrás de "Filtros avançados", exigia o botão Aplicar e
 * ignorava a tecla Enter. Quatro modelos mentais para a mesma pergunta.
 *
 * O termo entra na URL depois de uma pausa, então continua funcionando com
 * componente de servidor, dá para compartilhar o link do resultado e o botão
 * voltar do navegador se comporta como a pessoa espera.
 */
export function BuscaLive({
  parametro = "q",
  placeholder = "Buscar...",
  rotulo,
  className,
  atraso = 350,
}: {
  parametro?: string;
  placeholder?: string;
  rotulo?: string;
  className?: string;
  atraso?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const atual = searchParams.get(parametro) ?? "";

  const [texto, setTexto] = useState(atual);
  const primeira = useRef(true);

  // Reflete mudanças vindas de fora (voltar, limpar filtros, link colado).
  useEffect(() => {
    setTexto(atual);
  }, [atual]);

  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    if (texto === atual) return;
    const t = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      if (texto) p.set(parametro, texto);
      else p.delete(parametro);
      router.replace(p.toString() ? `${pathname}?${p}` : pathname, { scroll: false });
    }, atraso);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  return (
    <div className={cn("relative", className)}>
      <Busca
        tamanho={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-3"
      />
      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        aria-label={rotulo ?? placeholder}
        autoComplete="off"
        className={cn(BASE_CAMPO, "pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden")}
      />
      {texto && (
        <button
          type="button"
          onClick={() => setTexto("")}
          aria-label="Limpar busca"
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-tinta-3 hover:bg-superficie-2 hover:text-tinta-2"
        >
          <Fechar tamanho={14} />
        </button>
      )}
    </div>
  );
}
