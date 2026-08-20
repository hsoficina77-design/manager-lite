import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

type Item = {
  id: string; tipo: string; descricao: string; quantidade: number;
  valorUnit: number; valorTotal: number;
};
export type OrcamentoForPdf = {
  numero: number; status: string; descricao: string | null;
  totalPecas: number; totalMO: number; desconto: number; total: number;
  validade: string | null; obs: string | null; createdAt: string;
  cliente: {
    nome: string; telefone: string | null; cpfCnpj: string | null; email: string | null;
    endereco: string | null; cidade: string | null; estado: string | null;
  } | null;
  clienteNome: string | null;
  clienteTelefone: string | null;
  veiculo: {
    marca: string; modelo: string; placa: string | null; ano: number | null;
    cor: string | null; motorizacao: string | null;
  } | null;
  veiculoDesc: string | null;
  itens: Item[];
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente", APROVADO: "Aprovado", RECUSADO: "Recusado", CONVERTIDO: "Convertido",
};
const TIPO_LABEL: Record<string, string> = { PECA: "Peça", MAO_DE_OBRA: "Mão de obra", SERVICO: "Serviço" };

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function dia(d: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d));
}

const C = {
  ink: "#18181b", sub: "#52525b", mute: "#a1a1aa", line: "#e4e4e7",
  soft: "#f4f4f5", red: "#dc2626",
};

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 56, paddingHorizontal: 40, fontSize: 9, color: C.ink, fontFamily: "Helvetica" },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: -6 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  brandText: { justifyContent: "center" },
  logo: { width: 88, height: 88, objectFit: "contain" },
  brandName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.ink, letterSpacing: 0.5 },
  brandLine: { fontSize: 8.5, color: C.sub, marginTop: 1.5 },
  osLabel: { fontSize: 8, color: C.mute, letterSpacing: 1, textTransform: "uppercase", textAlign: "right" },
  osNum: { fontSize: 26, fontFamily: "Helvetica-Bold", color: C.red, textAlign: "right", marginTop: 1 },
  osDate: { fontSize: 8.5, color: C.sub, textAlign: "right", marginTop: 1 },
  osStatus: { fontSize: 8.5, color: C.sub, textAlign: "right", marginTop: 1, fontFamily: "Helvetica-Bold" },

  rule: { height: 2, backgroundColor: C.ink, marginBottom: 14 },

  infoBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 12, marginBottom: 12 },
  infoCol: { flex: 1 },
  infoDivider: { width: 1, alignSelf: "stretch", backgroundColor: C.line, marginHorizontal: 12 },
  boxTitle: { fontSize: 7.5, color: C.mute, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 },
  boxName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 3 },
  boxLine: { fontSize: 8.5, color: C.sub, marginBottom: 1.5, lineHeight: 1.3 },

  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 7.5, color: C.mute, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 },
  desc: { fontSize: 9.5, color: C.ink, lineHeight: 1.45 },
  descObs: { fontSize: 8.5, color: C.sub, marginTop: 4, fontFamily: "Helvetica-Oblique" },

  itensHead: { marginBottom: 0 },
  thead: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: C.ink, paddingBottom: 4, marginBottom: 2 },
  th: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.soft, paddingVertical: 5, alignItems: "flex-start" },
  cTipo: { width: "16%", fontSize: 8, color: C.sub },
  cDesc: { width: "44%", fontSize: 9, color: C.ink, paddingRight: 6 },
  cQtd: { width: "10%", fontSize: 9, color: C.sub, textAlign: "right" },
  cUnit: { width: "15%", fontSize: 9, color: C.sub, textAlign: "right" },
  cTotal: { width: "15%", fontSize: 9, fontFamily: "Helvetica-Bold", color: C.ink, textAlign: "right" },

  totals: { marginTop: 8, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", width: 220, paddingVertical: 1.5 },
  totalLabel: { fontSize: 9, color: C.sub },
  totalValue: { fontSize: 9, color: C.sub },
  totalDescLabel: { fontSize: 9, color: C.red },
  totalDescValue: { fontSize: 9, color: C.red },
  grandRow: {
    flexDirection: "row", justifyContent: "space-between", width: 220,
    borderTopWidth: 1.5, borderTopColor: C.ink, paddingTop: 4, marginTop: 3,
  },
  grandLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink },
  grandValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink },

  footer: {
    position: "absolute", bottom: 24, left: 40, right: 40,
    borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6,
    flexDirection: "row", justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: C.mute },
  footerNote: { marginTop: 20, fontSize: 8, color: C.mute, textAlign: "center" },
});

export function OrcamentoPdfDocument({
  orc,
  logoSrc,
}: {
  orc: OrcamentoForPdf;
  logoSrc?: string;
}) {
  const clienteNome = orc.cliente?.nome || orc.clienteNome?.trim() || "Sem identificação";
  const clienteTelefone = orc.cliente ? orc.cliente.telefone : orc.clienteTelefone;
  const veiculoNome = orc.veiculo
    ? `${orc.veiculo.marca} ${orc.veiculo.modelo}${orc.veiculo.ano ? ` (${orc.veiculo.ano})` : ""}`
    : orc.veiculoDesc;

  const veicLinha: string[] = [];
  if (orc.veiculo?.cor) veicLinha.push(`Cor: ${orc.veiculo.cor}`);
  if (orc.veiculo?.motorizacao) veicLinha.push(`Motor: ${orc.veiculo.motorizacao}`);

  return (
    <Document title={`Orçamento ${orc.numero} - HS Oficina Mecânica`} author="HS Oficina Mecânica">
      <Page size="A4" style={s.page}>
        {/* Cabeçalho */}
        <View style={s.header}>
          <View style={s.brandRow}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {logoSrc ? <Image style={s.logo} src={logoSrc} /> : null}
            <View style={s.brandText}>
              <Text style={s.brandName}>HS OFICINA MECÂNICA</Text>
              <Text style={s.brandLine}>CNPJ: 67.090.409/0001-17</Text>
              <Text style={s.brandLine}>Telefone: (11) 91330-4006</Text>
            </View>
          </View>
          <View>
            <Text style={s.osLabel}>Orçamento</Text>
            <Text style={s.osNum}>Nº {orc.numero}</Text>
            <Text style={s.osDate}>Data: {dia(orc.createdAt)}</Text>
            {orc.validade ? <Text style={s.osDate}>Validade: {dia(orc.validade)}</Text> : null}
            <Text style={s.osStatus}>Status: {STATUS_LABEL[orc.status] ?? orc.status}</Text>
          </View>
        </View>

        <View style={s.rule} />

        {/* Cliente e Veículo */}
        <View style={s.infoBox}>
          <View style={s.infoCol}>
            <Text style={s.boxTitle}>Cliente</Text>
            <Text style={s.boxName}>{clienteNome}</Text>
            {orc.cliente?.cpfCnpj ? <Text style={s.boxLine}>CPF/CNPJ: {orc.cliente.cpfCnpj}</Text> : null}
            {clienteTelefone ? <Text style={s.boxLine}>Telefone: {clienteTelefone}</Text> : null}
            {orc.cliente?.email ? <Text style={s.boxLine}>E-mail: {orc.cliente.email}</Text> : null}
            {orc.cliente?.endereco ? (
              <Text style={s.boxLine}>
                {orc.cliente.endereco}
                {orc.cliente.cidade ? `, ${orc.cliente.cidade}` : ""}
                {orc.cliente.estado ? ` - ${orc.cliente.estado}` : ""}
              </Text>
            ) : null}
          </View>
          {veiculoNome ? (
            <>
              <View style={s.infoDivider} />
              <View style={s.infoCol}>
                <Text style={s.boxTitle}>Veículo</Text>
                <Text style={s.boxName}>{veiculoNome}</Text>
                {orc.veiculo?.placa ? <Text style={s.boxLine}>Placa: {orc.veiculo.placa}</Text> : null}
                {veicLinha.length > 0 ? <Text style={s.boxLine}>{veicLinha.join("  ·  ")}</Text> : null}
              </View>
            </>
          ) : null}
        </View>

        {/* Descrição */}
        {orc.descricao ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Descrição do Serviço</Text>
            <Text style={s.desc}>{orc.descricao}</Text>
          </View>
        ) : null}

        {/* Itens */}
        {orc.itens.length > 0 ? (
          <>
            <View style={s.itensHead} wrap={false}>
              <Text style={s.sectionTitle}>Itens e Serviços</Text>
              <View style={s.thead}>
                <Text style={[s.th, s.cTipo]}>Tipo</Text>
                <Text style={[s.th, s.cDesc]}>Descrição</Text>
                <Text style={[s.th, s.cQtd]}>Qtd</Text>
                <Text style={[s.th, s.cUnit]}>Vlr. Unit.</Text>
                <Text style={[s.th, s.cTotal]}>Total</Text>
              </View>
            </View>
            {orc.itens.map((item) => (
              <View key={item.id} style={s.row} wrap={false}>
                <Text style={s.cTipo}>{TIPO_LABEL[item.tipo] ?? item.tipo}</Text>
                <Text style={s.cDesc}>{item.descricao}</Text>
                <Text style={s.cQtd}>{item.quantidade}</Text>
                <Text style={s.cUnit}>{brl(item.valorUnit)}</Text>
                <Text style={s.cTotal}>{brl(item.valorTotal)}</Text>
              </View>
            ))}

            {/* Totais */}
            <View style={s.totals} wrap={false}>
              {orc.totalPecas > 0 ? (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Peças</Text>
                  <Text style={s.totalValue}>{brl(orc.totalPecas)}</Text>
                </View>
              ) : null}
              {orc.totalMO > 0 ? (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Mão de obra / Serviços</Text>
                  <Text style={s.totalValue}>{brl(orc.totalMO)}</Text>
                </View>
              ) : null}
              {orc.desconto > 0 ? (
                <View style={s.totalRow}>
                  <Text style={s.totalDescLabel}>Desconto</Text>
                  <Text style={s.totalDescValue}>- {brl(orc.desconto)}</Text>
                </View>
              ) : null}
              <View style={s.grandRow}>
                <Text style={s.grandLabel}>TOTAL</Text>
                <Text style={s.grandValue}>{brl(orc.total)}</Text>
              </View>
            </View>
          </>
        ) : null}

        {/* Observações */}
        {orc.obs ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Observações</Text>
            <Text style={s.descObs}>{orc.obs}</Text>
          </View>
        ) : null}

        <Text style={s.footerNote}>Este documento é um orçamento e não possui valor fiscal.</Text>

        {/* Rodapé fixo */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>HS Oficina Mecânica · (11) 91330-4006</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
