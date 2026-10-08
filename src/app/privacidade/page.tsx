import type { Metadata } from "next";
import { DocumentoLegal } from "@/components/DocumentoLegal";

export const metadata: Metadata = { title: "Política de privacidade · boxOS" };

export default function PrivacidadePage() {
  return (
    <DocumentoLegal titulo="Política de privacidade" atualizadoEm="04/10/2026">
      <p>
        Esta política explica quais dados o boxOS guarda, para quê, e como você pode pedir a exclusão deles, conforme a
        Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
      </p>

      <h2>1. O que coletamos</h2>
      <ul>
        <li>
          <strong>Do cadastro:</strong> nome da oficina, seu nome, e-mail, WhatsApp e senha (guardada só como código
          irreversível, nunca em texto).
        </li>
        <li>
          <strong>Do uso:</strong> o que a oficina registra — clientes, veículos, ordens de serviço, orçamentos, fotos e
          valores.
        </li>
        <li>
          <strong>Do pagamento:</strong> a confirmação do pagamento e os identificadores da cobrança. Nome, e-mail,
          celular e CPF/CNPJ de quem paga vão para o processador de pagamentos (Asaas), que exige esses dados na
          cobrança. Os dados do cartão ficam com o Asaas e não passam pelo boxOS.
        </li>
      </ul>

      <h2>2. Para que usamos</h2>
      <ul>
        <li>Para o sistema funcionar e para você acessar a sua oficina.</li>
        <li>Para entrar em contato sobre o teste, a assinatura e o suporte (e-mail e WhatsApp).</li>
        <li>Não vendemos nem compartilhamos seus dados para publicidade.</li>
      </ul>

      <h2>3. Os dados dos seus clientes</h2>
      <p>
        Os dados de clientes que a oficina cadastra pertencem à oficina, que é a responsável por eles perante os
        próprios clientes. O boxOS apenas os armazena e processa para o sistema funcionar, e nenhuma outra oficina tem
        acesso a eles.
      </p>

      <h2>4. Por quanto tempo guardamos</h2>
      <p>
        Enquanto a oficina tiver acesso — inclusive no modo somente consulta, depois do teste. Você pode pedir a
        exclusão completa a qualquer momento; ela é feita em até 15 dias, exceto o que a lei nos obrigar a manter (como
        registros de pagamento).
      </p>

      <h2>5. Seus direitos</h2>
      <p>
        Você pode pedir acesso, correção, cópia ou exclusão dos seus dados pelos canais de contato do boxOS informados no
        sistema.
      </p>
    </DocumentoLegal>
  );
}
