import Link from "next/link";
import TelaDeEntrada from "@/components/TelaDeEntrada";
import { MENSAGEM_BALCAO_COM_LOGIN } from "./regras";

/** O link antigo do balcão, de uma loja que já tem login: manda entrar no painel. */
export function BalcaoComLogin() {
  return (
    <TelaDeEntrada produto="peca-peca" titulo="O balcão mudou de lugar" descricao={MENSAGEM_BALCAO_COM_LOGIN}>
      <Link
        href="/login?next=/loja"
        className="block w-full rounded-lg bg-brand-600 py-2.5 text-center text-sm font-medium text-brand-fg hover:bg-brand-700"
      >
        Entrar no balcão
      </Link>
    </TelaDeEntrada>
  );
}
