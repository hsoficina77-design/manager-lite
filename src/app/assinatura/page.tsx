import { exigirUsuario } from "@/lib/auth";
import { gatewayConfigurado, precoMensalCentavos } from "@/lib/abacatepay";
import AssinaturaPainel from "@/components/plano/AssinaturaPainel";

export const dynamic = "force-dynamic";

export default async function AssinaturaPage() {
  const usuario = await exigirUsuario("/assinatura");

  return (
    <div className="p-4 pt-6 sm:p-6">
      <h1 className="mb-6 font-marca text-2xl font-bold text-tinta">Assinatura do boxOS</h1>
      <AssinaturaPainel
        ehDono={usuario.papel === "ADMIN"}
        situacao={usuario.situacao}
        testeAte={usuario.testeAte?.toISOString() ?? null}
        pagoAte={usuario.pagoAte?.toISOString() ?? null}
        assinaturaAutomatica={usuario.assinaturaAutomatica}
        precoCentavos={precoMensalCentavos()}
        pagamentoDisponivel={gatewayConfigurado()}
      />
    </div>
  );
}
