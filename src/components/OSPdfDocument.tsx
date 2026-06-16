import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

type Item = {
  id: string; tipo: string; descricao: string; quantidade: number;
  valorUnit: number; valorTotal: number;
};
type Pagamento = {
  id: string; valor: number; formaPagamento: string; data: string; obs: string | null;
};
export type OSForPdf = {
  numero: number; status: string; descricao: string;
  defeitoRelatado?: string | null;
  kmEntrada: number | null; kmSaida: number | null;
  totalPecas: number; totalMO: number; desconto: number; total: number;
  pago: boolean; valorPago: number; obs: string | null;
  mecanico: string | null; nivelCombustivel: string | null; combustivelEmUso: string | null;
  abertura: string; fechamento: string | null;
  cliente: {
    nome: string; telefone: string | null; cpfCnpj: string | null; email: string | null;
    endereco: string | null; cidade: string | null; estado: string | null;
  };
  veiculo: {
    marca: string; modelo: string; placa: string | null; ano: number | null;
    cor: string | null; motorizacao: string | null;
  };
  itens: Item[];
  pagamentos: Pagamento[];
};

const STATUS_LABEL: Record<string, string> = {
  ABERTA: "Aberta", EM_ANDAMENTO: "Em Andamento", AGUARDANDO_PECA: "Aguardando Peça",
  PRONTA: "Pronta", FECHADA: "Fechada", ENTREGUE: "Entregue", CANCELADA: "Cancelada",
};
const NIVEL_LABEL: Record<string, string> = { CHEIO: "Cheio", MEIO: "Meio", VAZIO: "Vazio" };
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

  // Header
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

  // Cliente + Veículo (box único, duas colunas)
  infoBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 12, marginBottom: 12 },
  infoCol: { flex: 1 },
  infoDivider: { width: 1, alignSelf: "stretch", backgroundColor: C.line, marginHorizontal: 12 },
  boxTitle: { fontSize: 7.5, color: C.mute, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 },
  boxName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 3 },
  boxLine: { fontSize: 8.5, color: C.sub, marginBottom: 1.5, lineHeight: 1.3 },

  // Section
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 7.5, color: C.mute, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 },
  desc: { fontSize: 9.5, color: C.ink, lineHeight: 1.45 },
  descObs: { fontSize: 8.5, color: C.sub, marginTop: 4, fontFamily: "Helvetica-Oblique" },

  // Items table
  itensHead: { marginBottom: 0 },
  thead: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: C.ink, paddingBottom: 4, marginBottom: 2 },
  th: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.soft, paddingVertical: 5, alignItems: "flex-start" },
  cTipo: { width: "16%", fontSize: 8, color: C.sub },
  cDesc: { width: "44%", fontSize: 9, color: C.ink, paddingRight: 6 },
  cQtd: { width: "10%", fontSize: 9, color: C.sub, textAlign: "right" },
  cUnit: { width: "15%", fontSize: 9, color: C.sub, textAlign: "right" },
  cTotal: { width: "15%", fontSize: 9, fontFamily: "Helvetica-Bold", color: C.ink, textAlign: "right" },

  // Totals
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

  // Footer
  footer: {
    position: "absolute", bottom: 24, left: 40, right: 40,
    borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6,
    flexDirection: "row", justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: C.mute },
});

export function OSPdfDocument({ os, logoSrc }: { os: OSForPdf; logoSrc?: string }) {
  const veicLinha2: string[] = [];
  if (os.veiculo.cor) veicLinha2.push(`Cor: ${os.veiculo.cor}`);
  if (os.veiculo.motorizacao) veicLinha2.push(`Motor: ${os.veiculo.motorizacao}`);
  if (os.kmEntrada != null) veicLinha2.push(`KM entrada: ${os.kmEntrada.toLocaleString("pt-BR")}`);
  if (os.kmSaida != null) veicLinha2.push(`KM saída: ${os.kmSaida.toLocaleString("pt-BR")}`);
  if (os.nivelCombustivel) veicLinha2.push(`Combustível: ${NIVEL_LABEL[os.nivelCombustivel] ?? os.nivelCombustivel}`);
  if (os.combustivelEmUso) veicLinha2.push(`Em uso: ${os.combustivelEmUso}`);

  return (
    <Document title={`OS ${os.numero} - HS Oficina Mecânica`} author="HS Oficina Mecânica">
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
            <Text style={s.osLabel}>Ordem de Serviço</Text>
            <Text style={s.osNum}>Nº {os.numero}</Text>
            <Text style={s.osDate}>Abertura: {dia(os.abertura)}</Text>
            {os.fechamento ? <Text style={s.osDate}>Fechamento: {dia(os.fechamento)}</Text> : null}
            <Text style={s.osStatus}>Status: {STATUS_LABEL[os.status] ?? os.status}</Text>
          </View>
        </View>

        <View style={s.rule} />

        {/* Cliente e Veículo */}
        <View style={s.infoBox}>
          <View style={s.infoCol}>
            <Text style={s.boxTitle}>Cliente</Text>
            <Text style={s.boxName}>{os.cliente.nome}</Text>
            {os.cliente.cpfCnpj ? <Text style={s.boxLine}>CPF/CNPJ: {os.cliente.cpfCnpj}</Text> : null}
            {os.cliente.telefone ? <Text style={s.boxLine}>Telefone: {os.cliente.telefone}</Text> : null}
            {os.cliente.email ? <Text style={s.boxLine}>E-mail: {os.cliente.email}</Text> : null}
            {os.cliente.endereco ? (
              <Text style={s.boxLine}>
                {os.cliente.endereco}
                {os.cliente.cidade ? `, ${os.cliente.cidade}` : ""}
                {os.cliente.estado ? ` - ${os.cliente.estado}` : ""}
              </Text>
            ) : null}
          </View>
          <View style={s.infoDivider} />
          <View style={s.infoCol}>
            <Text style={s.boxTitle}>Veículo</Text>
            <Text style={s.boxName}>
              {os.veiculo.marca} {os.veiculo.modelo}{os.veiculo.ano ? ` (${os.veiculo.ano})` : ""}
            </Text>
            {os.veiculo.placa ? <Text style={s.boxLine}>Placa: {os.veiculo.placa}</Text> : null}
            {veicLinha2.length > 0 ? <Text style={s.boxLine}>{veicLinha2.join("  ·  ")}</Text> : null}
            {os.mecanico ? <Text style={s.boxLine}>Mecânico responsável: {os.mecanico}</Text> : null}
          </View>
        </View>

        {/* Defeito relatado */}
        {os.defeitoRelatado ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Defeito Relatado pelo Cliente</Text>
            <Text style={s.desc}>{os.defeitoRelatado}</Text>
          </View>
        ) : null}

        {/* Descrição */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Descrição do Serviço</Text>
          <Text style={s.desc}>{os.descricao}</Text>
          {os.obs ? <Text style={s.descObs}>Observações: {os.obs}</Text> : null}
        </View>

        {/* Itens */}
        {os.itens.length > 0 ? (
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
            {os.itens.map((item) => (
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
              {os.totalPecas > 0 ? (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Peças</Text>
                  <Text style={s.totalValue}>{brl(os.totalPecas)}</Text>
                </View>
              ) : null}
              {os.totalMO > 0 ? (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Mão de obra / Serviços</Text>
                  <Text style={s.totalValue}>{brl(os.totalMO)}</Text>
                </View>
              ) : null}
              {os.desconto > 0 ? (
                <View style={s.totalRow}>
                  <Text style={s.totalDescLabel}>Desconto</Text>
                  <Text style={s.totalDescValue}>- {brl(os.desconto)}</Text>
                </View>
              ) : null}
              <View style={s.grandRow}>
                <Text style={s.grandLabel}>TOTAL</Text>
                <Text style={s.grandValue}>{brl(os.total)}</Text>
              </View>
            </View>
          </>
        ) : null}

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
