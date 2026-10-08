import { exigirUsuario } from "@/lib/auth";
import { ehClienteAsaas, gatewayConfigurado, precoMensalCentavos } from "@/lib/asaas";
import { dadosDeCobranca } from "@/lib/sistema";
import AssinaturaPainel from "@/components/plano/AssinaturaPainel";

export const dynamic = "force-dynamic";

export default async function AssinaturaPage() {
  const usuario = await exigirUsuario("/assinatura");
  const ehDono = usuario.papel === "ADMIN";
  // O Asaas exige CPF/CNPJ no cliente: pede na primeira cobrança, sugerindo o CNPJ da oficina.
  const cobranca = ehDono ? await dadosDeCobranca(usuario.oficinaId) : null;

  return (
    <div className="p-4 pt-6 sm:p-6">
      <h1 className="mb-6 font-marca text-2xl font-bold text-tinta">Assinatura do boxOS</h1>
      <AssinaturaPainel
        ehDono={ehDono}
        situacao={usuario.situacao}
        testeAte={usuario.testeAte?.toISOString() ?? null}
        pagoAte={usuario.pagoAte?.toISOString() ?? null}
        assinaturaAutomatica={usuario.assinaturaAutomatica}
        precoCentavos={precoMensalCentavos()}
        pagamentoDisponivel={gatewayConfigurado()}
        pedeDocumento={Boolean(cobranca) && !ehClienteAsaas(cobranca?.gatewayClienteId ?? null)}
        documentoSugerido={cobranca?.configuracao?.cnpj ?? ""}
      />
    </div>
  );
}
