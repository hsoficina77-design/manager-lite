import { exigirOficina } from "@/lib/auth";
import { osNoPatio } from "@/lib/os-periodo";
import { contarPendencias } from "@/lib/pendencias";
import { precisaRepor } from "@/lib/estoque";
import {
  AcoesDoInicio,
  ComoFunciona,
  DestinosDoInicio,
  type Contagens,
} from "@/components/inicio/Atalhos";

// Tela inicial: é onde o app abre, no celular e no computador.
//
// O Resumo (/painel, o antigo Dashboard) responde "como está a oficina"; esta tela responde a
// pergunta de antes, "o que eu faço agora", e mostra onde fica cada coisa. Ela não tem
// número de dinheiro nenhum — só os avisos que pedem uma ação (carro esperando peça,
// orçamento sem resposta, peça para repor, conta em aberto).

/** O fuso da oficina. O servidor roda em UTC (ver lib/periodo). */
const FUSO = "America/Sao_Paulo";

export default async function Inicio() {
  const { usuario, db } = await exigirOficina();
  const ehDono = usuario.papel === "ADMIN";
  const { podeFinanceiro } = usuario;

  const [patio, aguardandoPeca, orcamentosPendentes, produtos, contasEmAberto] = await Promise.all([
    db.ordemServico.count({ where: osNoPatio }),
    db.ordemServico.count({ where: { status: "AGUARDANDO_PECA" } }),
    db.orcamento.count({ where: { status: "PENDENTE" } }),
    // "Precisa repor" compara duas colunas, o que o Prisma não faz no `where` — mesmo
    // recorte da rota do estoque, feito aqui sobre as peças ativas.
    db.produto.findMany({ where: { ativo: true }, select: { quantidade: true, estoqueMinimo: true } }),
    podeFinanceiro ? contarPendencias(db) : Promise.resolve(null),
  ]);

  const contagens: Contagens = {
    patio,
    aguardandoPeca,
    orcamentosPendentes,
    paraRepor: produtos.filter(precisaRepor).length,
    contasEmAberto,
  };

  const agora = new Date();
  const primeiroNome = usuario.nome.trim().split(/\s+/)[0] ?? "";

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-tinta">
            {saudacao(agora)}
            {primeiroNome && `, ${primeiroNome}`}
          </h1>
          <p className="mt-0.5 text-sm text-tinta-3">{dataPorExtenso(agora)}</p>
        </div>
        <ComoFunciona />
      </div>

      <section aria-labelledby="inicio-comecar" className="space-y-3">
        <h2 id="inicio-comecar" className="text-xs font-semibold uppercase tracking-wide text-tinta-3">
          Começar
        </h2>
        <AcoesDoInicio />
      </section>

      <section aria-labelledby="inicio-destinos" className="space-y-3">
        <div>
          <h2 id="inicio-destinos" className="text-xs font-semibold uppercase tracking-wide text-tinta-3">
            Tudo do boxOS
          </h2>
          <p className="mt-1 text-sm text-tinta-3">
            Os mesmos lugares do menu. Na dúvida, toque no <span className="font-semibold">?</span> para
            saber para que serve cada um.
          </p>
        </div>
        <DestinosDoInicio podeFinanceiro={podeFinanceiro} ehDono={ehDono} contagens={contagens} />
      </section>
    </div>
  );
}

function saudacao(agora: Date): string {
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: FUSO })
      .formatToParts(agora)
      .find((p) => p.type === "hour")?.value ?? 12
  );
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

/** "Terça-feira, 13 de outubro". */
function dataPorExtenso(agora: Date): string {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: FUSO,
  }).format(agora);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
