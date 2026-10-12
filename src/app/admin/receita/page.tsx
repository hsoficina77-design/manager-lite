import { exigirPlataforma } from "@/lib/auth";
import { eventosDePagamento, listarOficinas } from "@/lib/sistema";
import { precoMensalCentavos } from "@/lib/asaas";
import { receitaPorMes } from "@/lib/admin";
import { formatCurrency } from "@/lib/utils";
import { FaixaMetricas, Metrica, Painel } from "@/components/ui/Dados";
import { Barras } from "@/components/admin/Barras";
import { EventosDePagamento } from "@/components/admin/EventosDePagamento";
import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";

export const dynamic = "force-dynamic";

const MESES = 6;
const FUSO = "America/Sao_Paulo";
const nomeDoMes = (iso: string, mes: "short" | "long") =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, month: mes }).format(new Date(iso)).replace(".", "");

const reais = (centavos: number) => formatCurrency(centavos / 100);

export default async function AdminReceitaPage() {
  await exigirPlataforma();

  const agora = new Date();
  const desde = new Date(agora.getFullYear(), agora.getMonth() - (MESES - 1), 1);
  const [eventos, oficinas] = await Promise.all([eventosDePagamento(desde), listarOficinas()]);

  const meses = receitaPorMes(eventos, agora, MESES);
  const atual = meses[meses.length - 1];
  const anterior = meses[meses.length - 2];

  const assinantes = oficinas.filter((o) => o.ativa && o.situacao === "ASSINANTE");
  const noCartao = assinantes.filter((o) => o.assinaturaAutomatica).length;
  const preco = precoMensalCentavos();

  const barras = meses.map((m, i) => ({
    rotulo: nomeDoMes(m.inicio, "short"),
    valor: m.recebido,
    dica: `${i === meses.length - 1 ? "Este mês" : nomeDoMes(m.inicio, "long")}: ${reais(m.recebido)} em ${m.pagamentos} pagamento${m.pagamentos === 1 ? "" : "s"}${m.estornado ? ` · ${reais(m.estornado)} estornado` : ""}`,
  }));

  return (
    <div className="space-y-6 p-4 pt-6 sm:p-6">
      <CabecalhoAdmin titulo="Receita" texto="O que as oficinas pagaram ao boxOS, pelo que o Asaas avisou." />

      <FaixaMetricas colunas={4}>
        <Metrica
          rotulo="Recebido este mês"
          valor={reais(atual.recebido)}
          sub={`${reais(anterior.recebido)} no mês passado`}
          tom="ok"
          tamanho="grande"
        />
        <Metrica
          rotulo="Assinantes"
          valor={String(assinantes.length)}
          sub={`${noCartao} no cartão · ${assinantes.length - noCartao} no Pix`}
          tamanho="grande"
        />
        <Metrica
          rotulo="Receita mensal prevista"
          valor={preco ? reais(preco * assinantes.length) : "—"}
          sub={preco ? `${assinantes.length} × ${reais(preco)}` : "preço não configurado"}
          tamanho="grande"
        />
        <Metrica
          rotulo="Estornado este mês"
          valor={reais(atual.estornado)}
          tom={atual.estornado ? "perigo" : "neutro"}
          tamanho="grande"
        />
      </FaixaMetricas>

      <Painel titulo="Recebido por mês" ajuda={`Últimos ${MESES} meses.`}>
        <Barras barras={barras} rotuloAcessivel="Valor recebido por mês" />
      </Painel>

      <Painel titulo="Eventos de pagamento" ajuda={`Tudo o que o Asaas avisou desde ${nomeDoMes(desde.toISOString(), "long")}.`}>
        <EventosDePagamento eventos={eventos} />
      </Painel>
    </div>
  );
}
