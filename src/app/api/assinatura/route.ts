import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import {
  ErroGateway,
  cancelarAssinatura,
  criarCliente,
  criarCobranca,
  ehClienteAsaas,
  gatewayConfigurado,
  normalizarCpfCnpj,
} from "@/lib/asaas";
import { dadosDeCobranca, esquecerAssinatura, salvarClienteGateway } from "@/lib/sistema";
import { lerJsonCru, respostaDeValidacao } from "@/lib/validacao";

// Assinatura do boxOS. Esta rota está em `ROTAS_LIVRES_NO_BLOQUEIO` (lib/plano.ts): é
// justamente a oficina em modo só leitura que precisa conseguir pagar.

/** Situação do plano — a tela de "pagamento recebido" consulta até a liberação chegar. */
export async function GET() {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { usuario } = guarda;
  return NextResponse.json({
    situacao: usuario.situacao,
    pagoAte: usuario.pagoAte,
    assinaturaAutomatica: usuario.assinaturaAutomatica,
  });
}

/**
 * Abre a cobrança e devolve a `url` da fatura do Asaas.
 * Corpo: `{ forma: "cartao" | "pix", cpfCnpj?: string }` — o CPF/CNPJ só na primeira vez,
 * quando o cliente ainda não existe no Asaas (ele exige um dos dois).
 */
export async function POST(request: Request) {
  const guarda = await guardaApi({ dono: true });
  if (guarda.resposta) return guarda.resposta;
  const { usuario } = guarda;

  if (!gatewayConfigurado()) {
    return NextResponse.json(
      { error: "O pagamento online ainda não está disponível. Fale com a gente pelo WhatsApp." },
      { status: 503 }
    );
  }

  let corpo: { forma?: unknown; cpfCnpj?: unknown } | null;
  try {
    corpo = (await lerJsonCru(request)) as { forma?: unknown; cpfCnpj?: unknown } | null;
  } catch (err) {
    return respostaDeValidacao(err) ?? NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }
  const forma = corpo?.forma;
  if (forma !== "cartao" && forma !== "pix") {
    return NextResponse.json({ error: "Escolha cartão ou Pix" }, { status: 400 });
  }

  // O endereço de volta é o público. Sem APP_URL, o do navegador — o do servidor, por
  // trás do proxy do Railway, é interno e não abre do lado de fora.
  const appUrl = (process.env.APP_URL || request.headers.get("origin") || "").replace(/\/$/, "");
  if (!appUrl) return NextResponse.json({ error: "APP_URL não definida" }, { status: 500 });

  try {
    const oficina = await dadosDeCobranca(usuario.oficinaId);
    if (forma === "cartao" && oficina.gatewayAssinaturaId) {
      return NextResponse.json({ error: "Esta oficina já tem uma assinatura no cartão ativa." }, { status: 409 });
    }

    let clienteId = oficina.gatewayClienteId;
    if (!ehClienteAsaas(clienteId)) {
      const cpfCnpj = normalizarCpfCnpj(corpo?.cpfCnpj);
      if (!cpfCnpj) return NextResponse.json({ error: "Informe um CPF ou CNPJ válido" }, { status: 400 });
      clienteId = await criarCliente({
        nome: usuario.nome,
        email: usuario.email,
        celular: oficina.whatsapp,
        cpfCnpj,
        oficinaId: usuario.oficinaId,
      });
      await salvarClienteGateway(usuario.oficinaId, clienteId);
    }

    const url = await criarCobranca({ forma, clienteId, oficinaId: usuario.oficinaId, appUrl });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[pagamento] falha ao abrir cobrança:", err);
    const mensagem =
      err instanceof ErroGateway
        ? "O serviço de pagamento não respondeu como esperado. Tente de novo em alguns minutos."
        : "Erro ao abrir o pagamento";
    return NextResponse.json({ error: mensagem }, { status: 502 });
  }
}

/** Cancela a renovação automática do cartão. O mês já pago continua valendo. */
export async function DELETE() {
  const guarda = await guardaApi({ dono: true });
  if (guarda.resposta) return guarda.resposta;
  const { usuario } = guarda;

  try {
    const oficina = await dadosDeCobranca(usuario.oficinaId);
    if (!oficina.gatewayAssinaturaId) {
      return NextResponse.json({ error: "Não há assinatura no cartão para cancelar." }, { status: 404 });
    }
    await cancelarAssinatura(oficina.gatewayAssinaturaId);
    await esquecerAssinatura(usuario.oficinaId);
    return NextResponse.json({ ok: true, pagoAte: oficina.pagoAte });
  } catch (err) {
    console.error("[pagamento] falha ao cancelar assinatura:", err);
    return NextResponse.json({ error: "Não foi possível cancelar agora. Tente de novo." }, { status: 502 });
  }
}
