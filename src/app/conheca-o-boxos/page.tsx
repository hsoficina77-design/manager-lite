import { exigirUsuario } from "@/lib/auth";
import { DIAS_TESTE } from "@/lib/plano";
import { urlBoxOS } from "@/lib/produto";
import { produtoDaRequisicao } from "@/lib/produto-servidor";
import { LogoBoxOS } from "@/components/marca/LogoBoxOS";
import { AtivarBoxOS } from "@/components/peca-peca/VitrineBoxOS";

// A vitrine do boxOS para a oficina que só tem o Peça Peça: o que ela ganha, e o botão
// que começa o teste grátis com o mesmo login. É também para onde vai quem tem só o
// Peça Peça e abre uma tela do boxOS.

export const dynamic = "force-dynamic";

const O_QUE_TEM = [
  { titulo: "Orçamento direto da cotação", texto: "As peças escolhidas viram orçamento com a sua margem, num toque." },
  { titulo: "OS e orçamento com a sua marca", texto: "PDF pronto para mandar no WhatsApp do cliente." },
  { titulo: "Clientes e carros", texto: "Histórico de cada carro e de cada cliente, em um lugar só." },
  { titulo: "Caixa e contas a receber", texto: "Quem pagou, quem deve e quanto sobrou no mês." },
];

export default async function ConhecaOBoxOSPage() {
  const usuario = await exigirUsuario();
  const produto = await produtoDaRequisicao();
  const enderecoDoBoxOS = produto === "peca-peca" ? urlBoxOS() : "";

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4 sm:p-6">
      <div>
        <LogoBoxOS className="text-3xl text-tinta" />
        <h1 className="mt-4 text-xl font-bold text-tinta">A gestão da sua oficina, junto com as cotações</h1>
        <p className="mt-1 text-sm text-tinta-2">
          O boxOS é o sistema da oficina, do mesmo time do Peça Peça. Mesmo login, e as suas cotações continuam onde
          estão.
        </p>
      </div>

      <ul className="space-y-2">
        {O_QUE_TEM.map((item) => (
          <li key={item.titulo} className="rounded-xl border border-linha bg-superficie p-4">
            <p className="font-semibold text-tinta">{item.titulo}</p>
            <p className="mt-0.5 text-sm text-tinta-2">{item.texto}</p>
          </li>
        ))}
      </ul>

      {usuario.usaBoxOS ? (
        <p className="rounded-xl border border-ok-linha bg-ok-fraco p-4 text-sm text-ok">
          A sua oficina já tem o boxOS.{" "}
          <a href={enderecoDoBoxOS || "/"} className="font-semibold underline">
            Abrir o boxOS
          </a>
        </p>
      ) : usuario.papel === "ADMIN" ? (
        <AtivarBoxOS diasTeste={DIAS_TESTE} />
      ) : (
        <p className="rounded-xl border border-linha bg-superficie-2 p-4 text-sm text-tinta-2">
          Quem ativa o boxOS é o dono da oficina.
        </p>
      )}
    </div>
  );
}
