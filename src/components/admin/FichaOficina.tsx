"use client";

import type { FichaDaOficina } from "@/lib/sistema";
import { dispositivo, origemDa, rotuloDoEvento, ehPagamento } from "@/lib/admin";
import { labelPapel } from "@/lib/permissoes";
import { cn, formatCurrency } from "@/lib/utils";
import { FaixaMetricas, Metrica, Painel, Vazio } from "@/components/ui/Dados";
import { AcoesDaOficina, LinkWhatsapp, Selos, dia, haQuanto, quando } from "./comum";

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-xs text-tinta-3 sm:text-sm">{rotulo}</dt>
      <dd className="text-sm text-tinta sm:text-right">{children}</dd>
    </div>
  );
}

export function FichaOficina({ oficina: o }: { oficina: FichaDaOficina }) {
  const comoEntrou = o.convite
    ? `Convite de ${dia(o.convite.createdAt)}`
    : o.whatsapp
      ? `Teste grátis pelo link (${origemDa(o)})`
      : "Cadastro direto";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Selos oficina={o} />
        <AcoesDaOficina oficina={o} className="sm:justify-end" />
      </div>

      <FaixaMetricas colunas={5}>
        <Metrica rotulo="Clientes" valor={String(o.clientes)} />
        <Metrica rotulo="OS no total" valor={String(o.ordens)} />
        <Metrica rotulo="OS em 30 dias" valor={String(o.ordens30d)} tom={o.ordens30d ? "ok" : "neutro"} />
        <Metrica rotulo="Orçamentos" valor={String(o.orcamentos)} />
        <Metrica rotulo="Última OS" valor={haQuanto(o.ultimaOs, "nenhuma")} />
      </FaixaMetricas>

      <div className="grid gap-6 lg:grid-cols-2">
        <Painel titulo="Cadastro e plano">
          <dl className="divide-y divide-linha">
            <Linha rotulo="Cadastrada em">{quando(o.criadaEm)}</Linha>
            <Linha rotulo="Como entrou">{comoEntrou}</Linha>
            {o.convite?.email && <Linha rotulo="Convite enviado para">{o.convite.email}</Linha>}
            <Linha rotulo="Teste até">{o.testeAte ? dia(o.testeAte) : "—"}</Linha>
            <Linha rotulo="Pago até">{o.pagoAte ? dia(o.pagoAte) : "—"}</Linha>
            <Linha rotulo="Renovação">
              {o.assinaturaAutomatica ? "Cartão, automática" : o.pagoAte ? "Pix, mês a mês" : "—"}
            </Linha>
            <Linha rotulo="WhatsApp">{o.whatsapp ? <LinkWhatsapp oficina={o} className="text-sm" /> : "—"}</Linha>
          </dl>
        </Painel>

        <Painel titulo="Acessos" ajuda="Quem entra nesta oficina e por onde. Último acesso conta o uso, não só o login.">
          {o.usuarios.length === 0 ? (
            <Vazio titulo="Nenhum acesso" compacto />
          ) : (
            <ul className="divide-y divide-linha">
              {o.usuarios.map((u) => (
                <li key={u.id} className="py-3">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-tinta">
                    <span className="min-w-0 truncate">{u.nome}</span>
                    <span className="rounded-full bg-superficie-3 px-2 py-0.5 text-xs font-normal text-tinta-3">
                      {labelPapel(u.papel)}
                    </span>
                    {!u.ativo && (
                      <span className="rounded-full bg-perigo-fraco px-2 py-0.5 text-xs font-normal text-perigo">
                        desativado
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-tinta-3">{u.email}</p>
                  <p className="text-xs text-tinta-3">
                    Último acesso: {u.ultimoAcesso ? `${quando(u.ultimoAcesso)} (${haQuanto(u.ultimoAcesso)})` : "nunca entrou"}
                  </p>
                  <p className="text-xs text-tinta-3">
                    {u.ultimoAcessoApp
                      ? `Pelo app instalado desde ${dia(u.appDesde ?? u.ultimoAcessoApp)} · última vez ${haQuanto(u.ultimoAcessoApp)}`
                      : "Só pelo site, por enquanto"}
                  </p>
                  {u.sessaoAberta && (
                    <p className="text-xs text-tinta-3">
                      Conectado em {dispositivo(u.sessaoAberta.userAgent)} desde {dia(u.sessaoAberta.criadaEm)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>

      <Painel titulo="Pagamentos ao boxOS" ajuda="Eventos do Asaas desta oficina, do mais recente para o mais antigo.">
        {o.pagamentos.length === 0 ? (
          <Vazio titulo="Nenhum pagamento ainda" compacto />
        ) : (
          <ul className="divide-y divide-linha">
            {o.pagamentos.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-tinta">{rotuloDoEvento(p.tipo)}</p>
                  <p className="text-xs text-tinta-3">{quando(p.createdAt)}</p>
                </div>
                {p.valor != null && (
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      ehPagamento(p.tipo) ? "text-ok" : "text-tinta-2"
                    )}
                  >
                    {formatCurrency(p.valor / 100)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Painel>
    </div>
  );
}
