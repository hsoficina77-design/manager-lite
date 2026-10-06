import type { Metadata } from "next";
import { DocumentoLegal } from "@/components/DocumentoLegal";
import { CARENCIA_DIAS, DIAS_TESTE } from "@/lib/plano";

export const metadata: Metadata = { title: "Termos de uso · boxOS" };

export default function TermosPage() {
  return (
    <DocumentoLegal titulo="Termos de uso" atualizadoEm="04/10/2026">
      <p>
        Estes termos valem para quem usa o boxOS, sistema de gestão para oficinas mecânicas. Ao criar um acesso, você
        concorda com eles.
      </p>

      <h2>1. Teste grátis</h2>
      <ul>
        <li>Cada oficina pode fazer um teste grátis de {DIAS_TESTE} dias, sem cartão de crédito.</li>
        <li>O teste é limitado a um por pessoa (e-mail e WhatsApp).</li>
        <li>
          Ao fim do teste, o acesso não é apagado: a oficina continua entrando e consultando tudo o que registrou, mas
          não pode criar nem alterar registros até assinar.
        </li>
      </ul>

      <h2>2. Assinatura</h2>
      <ul>
        <li>A assinatura é mensal. No cartão, renova sozinha a cada mês; no Pix, cada pagamento libera 30 dias.</li>
        <li>
          Se um pagamento não for confirmado, a oficina tem {CARENCIA_DIAS} dias de tolerância antes de voltar ao modo
          somente consulta.
        </li>
        <li>Você pode cancelar quando quiser. O acesso completo segue até o fim do período já pago.</li>
      </ul>

      <h2>3. Seus dados são seus</h2>
      <p>
        Clientes, veículos, ordens de serviço e valores registrados pertencem à sua oficina. Cada oficina só enxerga os
        próprios dados. Você pode pedir a exclusão de todos eles a qualquer momento — veja a{" "}
        <a href="/privacidade" className="text-brand-texto underline">
          Política de privacidade
        </a>
        .
      </p>

      <h2>4. Uso adequado</h2>
      <ul>
        <li>Não use o sistema para atividades ilegais nem tente acessar dados de outras oficinas.</li>
        <li>Você é responsável por quem tem acesso à sua oficina e por manter sua senha em segredo.</li>
        <li>Contas criadas para abusar do teste grátis ou do sistema podem ser suspensas.</li>
      </ul>

      <h2>5. Disponibilidade</h2>
      <p>
        Trabalhamos para manter o boxOS no ar e com os dados protegidos, mas podem ocorrer interrupções para manutenção
        ou por falhas de terceiros (hospedagem, internet). Avisaremos com antecedência sobre mudanças relevantes nestes
        termos.
      </p>
    </DocumentoLegal>
  );
}
