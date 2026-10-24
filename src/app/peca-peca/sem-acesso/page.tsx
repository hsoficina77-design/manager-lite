import { exigirUsuario } from "@/lib/auth";
import { Cabecalho } from "@/components/peca-peca/ui";

// Operador sem o acesso "Financeiro": o preço da loja é o custo da peça, e quem não
// vê custo no boxOS também não vê aqui.
export default async function SemAcessoPage() {
  await exigirUsuario();
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Cabecalho titulo="Peça Peça" />
      <p className="max-w-lg rounded-xl border border-linha bg-superficie p-4 text-sm text-tinta-2">
        As cotações mostram quanto a peça custa na loja. Por isso só o dono da oficina — ou quem tem o acesso
        &quot;Financeiro&quot; — usa o Peça Peça. Peça ao dono para liberar, se precisar.
      </p>
    </div>
  );
}
