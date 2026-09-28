import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { blocosDoTexto, type Trecho } from "@/lib/texto-formatado";

// Versão para o PDF do mesmo texto que TextoFormatado mostra na tela.

const s = StyleSheet.create({
  texto: { fontSize: 9.5, color: "#18181b", lineHeight: 1.45 },
  negrito: { fontFamily: "Helvetica-Bold" },
  titulo: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#18181b", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 4, marginBottom: 2 },
  item: { flexDirection: "row", marginBottom: 1 },
  subItem: { paddingLeft: 16 },
  marca: { width: 16, fontSize: 9.5, color: "#52525b", lineHeight: 1.45 },
  itemTexto: { flex: 1, fontSize: 9.5, color: "#18181b", lineHeight: 1.45 },
  espaco: { height: 6 },
});

function trechos(lista: Trecho[]) {
  return lista.map((t, i) =>
    t.negrito ? <Text key={i} style={s.negrito}>{t.texto}</Text> : t.texto,
  );
}

export function TextoFormatadoPdf({ texto }: { texto: string }) {
  return (
    <View>
      {blocosDoTexto(texto).map((b, i) => {
        if (b.tipo === "espaco") return <View key={i} style={s.espaco} />;
        if (b.tipo === "titulo") {
          // Título não fica sozinho no pé da página, longe do que ele apresenta.
          return <Text key={i} style={s.titulo} minPresenceAhead={30}>{trechos(b.trechos)}</Text>;
        }
        if (b.tipo === "numerado" || b.tipo === "marcador") {
          return (
            <View key={i} style={b.nivel > 0 ? [s.item, s.subItem] : s.item} wrap={false}>
              <Text style={s.marca}>{b.tipo === "numerado" ? `${b.numero}.` : "•"}</Text>
              <Text style={s.itemTexto}>{trechos(b.trechos)}</Text>
            </View>
          );
        }
        return <Text key={i} style={s.texto}>{trechos(b.trechos)}</Text>;
      })}
    </View>
  );
}
