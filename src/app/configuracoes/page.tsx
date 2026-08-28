import ConfiguracoesPainel from "@/components/ConfiguracoesPainel";

export const dynamic = "force-dynamic";

// Sem padding aqui: o painel controla o próprio espaçamento para a barra de
// título poder grudar no topo de ponta a ponta.
export default function ConfiguracoesPage() {
  return <ConfiguracoesPainel />;
}
