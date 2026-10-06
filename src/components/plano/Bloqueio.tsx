"use client";

import { useEffect, useState } from "react";
import { useUsuario } from "@/components/UsuarioProvider";
import { Modal } from "@/components/ui/Modal";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { CODIGO_SOMENTE_LEITURA, linkWhatsappBoxOS } from "@/lib/plano";

/**
 * O que dizer a quem esbarrou no modo só leitura — no modal e no lugar dos formulários.
 * Dono vê o caminho para assinar; operador, que não paga a conta, é mandado ao dono.
 */
export function TextoDoBloqueio() {
  const usuario = useUsuario();
  const ehDono = usuario?.papel === "ADMIN";
  const whatsapp = linkWhatsappBoxOS("Olá! Quero assinar o boxOS para a minha oficina.");

  return (
    <div className="space-y-4 text-sm text-tinta-2">
      <p>
        O teste grátis desta oficina terminou. <strong className="text-tinta">Nada foi apagado</strong>: clientes,
        OS, orçamentos e o financeiro continuam aqui para consulta, e os PDFs seguem saindo normalmente.
      </p>
      <p>
        {ehDono
          ? "Para voltar a criar e alterar registros, é só assinar. A liberação é automática assim que o pagamento é confirmado."
          : "Para voltar a criar e alterar registros, o dono da oficina precisa assinar o boxOS."}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {ehDono && (
          <BotaoLink href="/assinatura" className="w-full sm:w-auto">
            Assinar o boxOS
          </BotaoLink>
        )}
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-linha-forte bg-superficie px-4 py-2 text-sm font-medium text-tinta-2 hover:bg-superficie-2 sm:w-auto"
          >
            Falar no WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Abre o aviso sempre que a API recusar uma ação por modo só leitura.
 *
 * Em vez de ensinar cada uma das dezenas de chamadas `fetch` espalhadas pelas telas a
 * reconhecer o 402, o `fetch` da janela é embrulhado uma vez: a resposta segue intacta
 * para quem chamou (que mostra o próprio erro, com a mesma mensagem), e este
 * componente só olha por cima do ombro para abrir o modal.
 */
export function BloqueioDeAcao() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const original = window.fetch;
    const embrulhado: typeof window.fetch = async (...args) => {
      const resposta = await original(...args);
      if (resposta.status === 402) {
        // `clone` para não consumir o corpo que a tela ainda vai ler.
        resposta
          .clone()
          .json()
          .then((corpo: { codigo?: string }) => {
            if (corpo?.codigo === CODIGO_SOMENTE_LEITURA) setAberto(true);
          })
          .catch(() => {});
      }
      return resposta;
    };
    window.fetch = embrulhado;
    return () => {
      // Só desfaz se ninguém embrulhou por cima depois.
      if (window.fetch === embrulhado) window.fetch = original;
    };
  }, []);

  if (!aberto) return null;

  return (
    <Modal
      titulo="Período de teste encerrado"
      onFechar={() => setAberto(false)}
      rodape={
        <Botao variante="secundario" onClick={() => setAberto(false)} data-foco-inicial>
          Continuar consultando
        </Botao>
      }
    >
      <TextoDoBloqueio />
    </Modal>
  );
}

/**
 * Formulário que grava (nova OS, novo cliente…). Em modo só leitura, mostra o aviso
 * no lugar — ninguém preenche uma OS inteira para só descobrir ao salvar.
 */
export function ExigeEscrita({ children }: { children: React.ReactNode }) {
  const usuario = useUsuario();
  if (!usuario?.plano.somenteLeitura) return <>{children}</>;

  return (
    <div className="p-4 pt-6 sm:p-6">
      <div className="mx-auto max-w-xl rounded-2xl border border-linha bg-superficie p-6 shadow-sm">
        <h1 className="mb-3 text-base font-semibold text-tinta">Período de teste encerrado</h1>
        <TextoDoBloqueio />
      </div>
    </div>
  );
}
