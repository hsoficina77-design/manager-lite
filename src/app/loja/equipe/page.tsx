import type { Metadata } from "next";
import { exigirContaLoja } from "@/lib/conta-loja";
import { Equipe } from "@/components/peca-peca/Equipe";

export const metadata: Metadata = { title: "Equipe · Peça Peça" };

// Quem cuida da equipe da loja: convida, liga e desliga acessos, dá novo acesso.
export default async function EquipeDaLojaPage() {
  const conta = await exigirContaLoja("loja.equipe");
  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <Equipe api="/api/loja/equipe" meusAcessos={conta.permissoes} euId={conta.id} />
    </div>
  );
}
