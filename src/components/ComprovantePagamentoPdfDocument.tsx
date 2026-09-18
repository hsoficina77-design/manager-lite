import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { labelFormaPagamento } from "@/lib/constants";
import { CONFIG_PADRAO, rodapeDoDocumento, type Configuracao } from "@/lib/configuracao";

type Pagamento = {
  id: string | number; valor: number; formaPagamento: string; data: string; obs: string | null;
};
/**
 * Uma OS tem `numero` e `veiculo`; uma dívida avulsa não tem nenhum dos dois — usa
 * `descricao` no lugar. Nunca os dois ao mesmo tempo.
 */
export type ComprovanteOS = {
  numero?: number;
  descricao?: string;
  cliente: { nome: string };
  veiculo?: { marca: string; modelo: string; placa: string | null };
  total: number;
  valorPago: number;
  pago: boolean;
  pagamentos: Pagamento[];
};

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function dataHora(d: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
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

  grid: {
    flexDirection: "row", borderWidth: 1, borderColor: C.line, borderRadius: 10,
    marginBottom: 16,
  },
  gridCol: { flex: 1, paddingVertical: 12, alignItems: "center" },
  gridDivider: { width: 1, backgroundColor: C.line },
  gridLabel: { fontSize: 7.5, color: C.mute, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  gridValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink },

  quitado: {
    flexDirection: "row", alignItems: "center", marginBottom: 16,
    borderWidth: 1, borderColor: C.green, borderRadius: 8, backgroundColor: "#f0fdf4",
    paddingVertical: 8, paddingHorizontal: 10,
  },
  quitadoTexto: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.green },

  histTitle: { fontSize: 7.5, color: C.mute, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
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
  os,
  logoSrc,
  geradoEm,
  config = CONFIG_PADRAO,
}: {
  os: ComprovanteOS;
  logoSrc?: string;
  /** Fixado no momento em que o download começa, para bater com o nome do arquivo. */
  geradoEm: Date;
  config?: Configuracao;
}) {
  const saldo = Math.max(0, os.total - os.valorPago);
  const marca = config.corPrimaria;
  const veiculo = os.veiculo ? [os.veiculo.marca, os.veiculo.modelo].filter(Boolean).join(" ") : "";
  const identificacao = os.numero != null ? `OS Nº ${os.numero}` : (os.descricao ?? "Dívida avulsa");

  return (
    <Document title={`Comprovante - ${identificacao} - ${os.cliente.nome}`} author={config.nome}>
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
        <Text style={s.subtitle}>
          {identificacao} · {os.cliente.nome}
          {veiculo ? `\n${veiculo}${os.veiculo?.placa ? ` · ${os.veiculo.placa}` : ""}` : ""}
        </Text>

        <View style={s.grid}>
          <View style={s.gridCol}>
            <Text style={s.gridLabel}>Total</Text>
            <Text style={s.gridValue}>{brl(os.total)}</Text>
          </View>
          <View style={s.gridDivider} />
          <View style={s.gridCol}>
            <Text style={s.gridLabel}>Pago</Text>
            <Text style={[s.gridValue, { color: C.green }]}>{brl(os.valorPago)}</Text>
          </View>
          <View style={s.gridDivider} />
          <View style={s.gridCol}>
            <Text style={s.gridLabel}>Saldo</Text>
            <Text style={[s.gridValue, { color: saldo > 0 ? C.red : C.green }]}>{brl(saldo)}</Text>
          </View>
        </View>

        {os.pago ? (
          <View style={s.quitado}>
            <Text style={s.quitadoTexto}>Pagamento quitado</Text>
          </View>
        ) : null}

        {os.pagamentos.length > 0 ? (
          <View>
            <Text style={s.histTitle}>Histórico</Text>
            {os.pagamentos.map((p) => (
              <View key={p.id} style={s.histRow}>
                <View style={s.histLinha1}>
                  <Text style={s.histValor}>{brl(p.valor)}</Text>
                  <Text style={s.histForma}>{labelFormaPagamento(p.formaPagamento)}</Text>
                  {p.obs ? <Text style={s.histForma}>· {p.obs}</Text> : null}
                </View>
                <Text style={s.histData}>{dataHora(p.data)}</Text>
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
