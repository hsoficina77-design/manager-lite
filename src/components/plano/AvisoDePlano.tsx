import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UsuarioSessao } from "@/lib/auth";
import { AVISO_VENCIMENTO_DIAS, CARENCIA_DIAS, diasAte } from "@/lib/plano";

// Faixa do plano no topo de toda tela: quanto falta do teste, ou que a oficina está só
// para consulta. Componente de servidor de propósito — os dias são contados uma vez,
// aqui, e não divergem entre o HTML do servidor e o navegador.
//
// Oficina liberada (antigas, convite, cortesia) ou assinante em dia: nada aparece.

function dias(n: number) {
  return n === 1 ? "1 dia" : `${n} dias`;
}

export function AvisoDePlano({ usuario }: { usuario: UsuarioSessao }) {
  const ehDono = usuario.papel === "ADMIN";
  const aviso = montarAviso(usuario);
  if (!aviso) return null;

  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-2.5 text-sm sm:px-6",
        aviso.tom === "perigo" && "border-perigo-linha bg-perigo-fraco text-perigo",
        aviso.tom === "atencao" && "border-atencao-linha bg-atencao-fraco text-tinta",
        aviso.tom === "neutro" && "border-linha bg-superficie-2 text-tinta-2"
      )}
    >
      <p>{aviso.texto}</p>
      {ehDono ? (
        <Link
          href="/assinatura"
          className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-brand-fg hover:bg-brand-700"
        >
          {aviso.acao}
        </Link>
      ) : (
        aviso.tom === "perigo" && <p className="text-xs">Fale com o dono da oficina.</p>
      )}
    </div>
  );
}

function montarAviso(usuario: UsuarioSessao): { texto: string; acao: string; tom: "neutro" | "atencao" | "perigo" } | null {
  switch (usuario.situacao) {
    case "TESTE": {
      const restam = Math.max(1, diasAte(usuario.testeAte));
      return {
        texto:
          restam === 1
            ? "Teste grátis: este é o último dia."
            : `Teste grátis: faltam ${dias(restam)}.`,
        acao: "Assinar o boxOS",
        tom: restam <= 2 ? "atencao" : "neutro",
      };
    }

    case "SOMENTE_LEITURA":
      return {
        texto: "Seu período de teste terminou. Você continua vendo tudo o que registrou, mas não pode alterar nada.",
        acao: "Assinar e voltar a registrar",
        tom: "perigo",
      };

    case "ASSINANTE": {
      const restam = diasAte(usuario.pagoAte);
      // Já passou do pago: está na carência, à espera de uma nova tentativa no cartão
      // ou do Pix do mês.
      if (restam <= 0) {
        const ate = Math.max(1, CARENCIA_DIAS + restam);
        return {
          texto: `Não identificamos o pagamento deste mês. Em ${dias(ate)} a oficina fica só para consulta.`,
          acao: "Regularizar",
          tom: "perigo",
        };
      }
      // Cartão renova sozinho; quem paga por Pix precisa lembrar do próximo mês.
      if (!usuario.assinaturaAutomatica && restam <= AVISO_VENCIMENTO_DIAS) {
        return {
          texto: `Seu mês pago termina em ${dias(restam)}.`,
          acao: "Pagar o próximo mês",
          tom: "atencao",
        };
      }
      return null;
    }

    default:
      return null;
  }
}
