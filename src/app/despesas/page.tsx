import { exigirDono } from "@/lib/auth";
import { mesDeGastos, pontoDeEquilibrio, resumirMes } from "@/lib/despesas";
import { chaveMes, ehPeriodoAtual } from "@/lib/periodo";
import { ControleDeGastos } from "@/components/despesas/ControleDeGastos";

/**
 * Controle de gastos do mês (`?mes=AAAA-MM`).
 *
 * Componente de servidor porque o ponto de equilíbrio cruza gasto com faturamento das
 * OS — dado que o operador não pode ver e que não faria sentido buscar do navegador. A
 * interação toda mora no componente de tela, que recarrega com `router.refresh()`.
 *
 * Abrir o mês é o que materializa os lançamentos das despesas fixas dele; ver
 * `lib/despesas.garantirLancamentos` para o porquê de a leitura poder escrever.
 */
export default async function DespesasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  await exigirDono();
  const { mes } = await searchParams;

  const { janela, lancamentos, cancelados, categorias, regras } = await mesDeGastos(mes);
  const resumo = resumirMes(lancamentos);
  const equilibrio = await pontoDeEquilibrio(janela, resumo.total);

  return (
    <ControleDeGastos
      mes={chaveMes(janela.inicio)}
      competencia={janela.inicio}
      rotuloMes={janela.label}
      ehMesAtual={ehPeriodoAtual(janela)}
      lancamentos={lancamentos}
      cancelados={cancelados}
      categorias={categorias}
      regras={regras}
      equilibrio={equilibrio}
    />
  );
}
