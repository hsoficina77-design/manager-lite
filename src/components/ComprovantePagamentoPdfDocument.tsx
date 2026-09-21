import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { labelFormaPagamento } from "@/lib/constants";
import { CONFIG_PADRAO, rodapeDoDocumento, type Configuracao } from "@/lib/configuracao";

type Pagamento = {
  id: string | number; valor: number; formaPagamento: string; data: string; obs: string | null;
};
/**
 * Um débito do cliente: uma OS ou uma dívida avulsa.
 *
 * Uma OS tem `numero` e `veiculo`; uma dívida avulsa não tem nenhum dos dois — usa
 * `descricao` no lugar. Nunca os dois ao mesmo tempo.
 */
export type ComprovanteItem = {
  numero?: number;
  descricao?: string;
  veiculo?: { marca: string; modelo: string; placa: string | null };
  /** Desconto já abatido de `total`. Dívida avulsa não tem desconto. */
  desconto?: number;
  total: number;
  valorPago: number;
  pago: boolean;
  pagamentos: Pagamento[];
};

/**
 * Um comprovante por cliente, não por OS: com um débito só ele sai como o recibo
 * de sempre; com vários, ganha a lista de débitos e o histórico marcado com a
 * origem de cada pagamento — é assim que o cliente com duas OS em aberto recebe
 * uma conta só, em vez de duas imagens para juntar de cabeça.
 */
export type ComprovanteDados = {
  cliente: { nome: string };
  itens: ComprovanteItem[];
};

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function dataHora(d: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

export function identificacaoDoItem(item: ComprovanteItem) {
  return item.numero != null ? `OS Nº ${item.numero}` : (item.descricao ?? "Dívida avulsa");
}
function veiculoDoItem(item: ComprovanteItem) {
  if (!item.veiculo) return "";
  const nome = [item.veiculo.marca, item.veiculo.modelo].filter(Boolean).join(" ");
  return item.veiculo.placa ? `${nome} · ${item.veiculo.placa}` : nome;
}

const C = {
  ink: "#18181b", sub: "#52525b", mute: "#a1a1aa", line: "#e4e4e7",
  soft: "#f4f4f5", green: "#16a34a", red: "#dc2626",
};

// Largura fixa e sem altura: o react-pdf estica a página até caber tudo, do
// jeito de um recibo de balcão — sem paginação, que aqui só atrapalharia o
// recorte para o WhatsApp.
const LARGURA_PAGINA = 380;

const s = StyleSheet.create({
  page: { padding: 26, fontFamily: "Helvetica", fontSize: 9, color: C.ink },

  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  logo: { width: 36, height: 36, objectFit: "contain" },
  brandName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink },
  brandLine: { fontSize: 8, color: C.sub, marginTop: 1 },

  rule: { height: 2, marginBottom: 16 },

  title: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 3 },
  subtitle: { fontSize: 9, color: C.sub, marginBottom: 16, lineHeight: 1.4 },

  secTitle: { fontSize: 7.5, color: C.mute, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },

  debitos: { marginBottom: 16 },
  debRow: {
    flexDirection: "row", justifyContent: "space-between", gap: 10,
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.soft,
  },
  debInfo: { flex: 1 },
  debLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.ink },
  debSub: { fontSize: 7.5, color: C.mute, marginTop: 1.5 },
  debSaldo: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },

  grid: {
    flexDirection: "row", borderWidth: 1, borderColor: C.line, borderRadius: 10,
    marginBottom: 16,
  },
  gridCol: { flex: 1, paddingVertical: 12, alignItems: "center" },
  gridDivider: { width: 1, backgroundColor: C.line },
  gridLabel: { fontSize: 7.5, color: C.mute, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  gridValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink },

  desconto: {
    borderWidth: 1, borderColor: C.line, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 10,
  },
  descontoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.5 },
  descontoLabel: { fontSize: 8.5, color: C.sub },
  descontoValor: { fontSize: 8.5, color: C.sub },

  quitado: {
    flexDirection: "row", alignItems: "center", marginBottom: 16,
    borderWidth: 1, borderColor: C.green, borderRadius: 8, backgroundColor: "#f0fdf4",
    paddingVertical: 8, paddingHorizontal: 10,
  },
  quitadoTexto: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.green },

  histRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.soft },
  histLinha1: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap" },
  histValor: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.ink },
  histForma: { fontSize: 8.5, color: C.sub, marginLeft: 6 },
  histData: { fontSize: 8, color: C.mute, marginTop: 2 },

  footer: { marginTop: 18, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 },
  footerText: { fontSize: 7.5, color: C.mute },
  footerGerado: { fontSize: 7.5, color: C.mute, marginTop: 2 },
});

export function ComprovantePagamentoPdfDocument({
  dados,
  logoSrc,
  geradoEm,
  config = CONFIG_PADRAO,
}: {
  dados: ComprovanteDados;
  logoSrc?: string;
  /** Fixado no momento em que o download começa, para bater com o nome do arquivo. */
  geradoEm: Date;
  config?: Configuracao;
}) {
  const { cliente, itens } = dados;
  const varios = itens.length > 1;

  const total = itens.reduce((acc, i) => acc + i.total, 0);
  const valorPago = itens.reduce((acc, i) => acc + i.valorPago, 0);
  const saldo = Math.max(0, total - valorPago);
  // `total` já vem líquido; o bruto só existe aqui, para o cliente enxergar o abatimento.
  const desconto = itens.reduce((acc, i) => acc + (i.desconto ?? 0), 0);
  const quitado = itens.length > 0 && itens.every((i) => i.pago);

  const marca = config.corPrimaria;
  const unico = varios ? null : itens[0];
  const veiculoUnico = unico ? veiculoDoItem(unico) : "";

  // Um histórico só, em ordem de data, com a origem de cada pagamento à mão —
  // sem ela, dois débitos viram uma lista de valores soltos.
  const historico = itens
    .flatMap((item, idx) =>
      item.pagamentos.map((p) => ({ ...p, chave: `${idx}-${p.id}`, origem: identificacaoDoItem(item) }))
    )
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const tituloDoc = unico
    ? `Comprovante - ${identificacaoDoItem(unico)} - ${cliente.nome}`
    : `Comprovante - ${cliente.nome}`;

  return (
    <Document title={tituloDoc} author={config.nome}>
      <Page size={{ width: LARGURA_PAGINA }} style={s.page}>
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {logoSrc ? <Image style={s.logo} src={logoSrc} /> : null}
          <View>
            <Text style={s.brandName}>{config.nome}</Text>
            {config.telefone ? <Text style={s.brandLine}>{config.telefone}</Text> : null}
          </View>
        </View>

        <View style={[s.rule, { backgroundColor: marca }]} />

        <Text style={s.title}>Comprovante de Pagamento</Text>
        {unico ? (
          <Text style={s.subtitle}>
            {identificacaoDoItem(unico)} · {cliente.nome}
            {veiculoUnico ? `\n${veiculoUnico}` : ""}
          </Text>
        ) : (
          <Text style={s.subtitle}>
            {cliente.nome}
            {`\n${itens.length} débitos em aberto`}
          </Text>
        )}

        {varios ? (
          <View style={s.debitos}>
            <Text style={s.secTitle}>Débitos</Text>
            {itens.map((item, idx) => {
              const saldoItem = Math.max(0, item.total - item.valorPago);
              const veiculo = veiculoDoItem(item);
              return (
                <View key={idx} style={s.debRow}>
                  <View style={s.debInfo}>
                    <Text style={s.debLabel}>{identificacaoDoItem(item)}</Text>
                    <Text style={s.debSub}>
                      {veiculo ? `${veiculo} · ` : ""}
                      Total {brl(item.total)}
                      {item.valorPago > 0 ? ` · Pago ${brl(item.valorPago)}` : ""}
                    </Text>
                  </View>
                  <Text style={[s.debSaldo, { color: saldoItem > 0 ? C.red : C.green }]}>
                    {brl(saldoItem)}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {desconto > 0 ? (
          <View style={s.desconto}>
            <View style={s.descontoRow}>
              <Text style={s.descontoLabel}>Valor sem desconto</Text>
              <Text style={s.descontoValor}>{brl(total + desconto)}</Text>
            </View>
            <View style={s.descontoRow}>
              <Text style={[s.descontoLabel, { color: C.green }]}>
                {varios ? "Descontos aplicados" : "Desconto aplicado"}
              </Text>
              <Text style={[s.descontoValor, { color: C.green }]}>- {brl(desconto)}</Text>
            </View>
          </View>
        ) : null}

        <View style={s.grid}>
          <View style={s.gridCol}>
            <Text style={s.gridLabel}>Total</Text>
            <Text style={s.gridValue}>{brl(total)}</Text>
          </View>
          <View style={s.gridDivider} />
          <View style={s.gridCol}>
            <Text style={s.gridLabel}>Pago</Text>
            <Text style={[s.gridValue, { color: C.green }]}>{brl(valorPago)}</Text>
          </View>
          <View style={s.gridDivider} />
          <View style={s.gridCol}>
            <Text style={s.gridLabel}>Saldo</Text>
            <Text style={[s.gridValue, { color: saldo > 0 ? C.red : C.green }]}>{brl(saldo)}</Text>
          </View>
        </View>

        {quitado ? (
          <View style={s.quitado}>
            <Text style={s.quitadoTexto}>Pagamento quitado</Text>
          </View>
        ) : null}

        {historico.length > 0 ? (
          <View>
            <Text style={s.secTitle}>Histórico</Text>
            {historico.map((p) => (
              <View key={p.chave} style={s.histRow}>
                <View style={s.histLinha1}>
                  <Text style={s.histValor}>{brl(p.valor)}</Text>
                  <Text style={s.histForma}>{labelFormaPagamento(p.formaPagamento)}</Text>
                  {p.obs ? <Text style={s.histForma}>· {p.obs}</Text> : null}
                </View>
                <Text style={s.histData}>
                  {dataHora(p.data)}
                  {varios ? ` · ${p.origem}` : ""}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={s.footer}>
          <Text style={s.footerText}>{rodapeDoDocumento(config)}</Text>
          <Text style={s.footerGerado}>Comprovante gerado em {dataHora(geradoEm)}</Text>
        </View>
      </Page>
    </Document>
  );
}
