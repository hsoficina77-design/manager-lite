"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import OrcamentoForm, { type OrcamentoFormInitial } from "@/components/OrcamentoForm";
import { Esqueleto } from "@/components/ui/Dados";

export default function EditarOrcamentoPage() {
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<OrcamentoFormInitial | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    fetch(`/api/orcamentos/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((o: any) => {
        setInitial({
          clienteId: o.clienteId ?? o.cliente?.id ?? "",
          veiculoId: o.veiculoId ?? o.veiculo?.id ?? "",
          clienteNome: o.clienteNome ?? "",
          clienteTelefone: o.clienteTelefone ?? "",
          veiculoDesc: o.veiculoDesc ?? "",
          descricao: o.descricao ?? "",
          validade: o.validade ? String(o.validade).slice(0, 10) : "",
          obs: o.obs ?? "",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          itens: (o.itens ?? []).map((i: any) => ({
            id: i.id,
            tipo: i.tipo,
            descricao: i.descricao,
            quantidade: String(i.quantidade),
            valorUnit: String(i.valorUnit),
            custoUnit: i.custoUnit != null ? String(i.custoUnit) : "",
          })),
        });
      })
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6">
        <Esqueleto className="h-9 w-40" />
        <Esqueleto className="h-64 w-full" />
      </div>
    );
  if (erro || !initial) return <div className="p-6 text-sm text-tinta-3">Orçamento não encontrado.</div>;

  return (
    <Suspense>
      <OrcamentoForm mode="edit" orcamentoId={id} initial={initial} />
    </Suspense>
  );
}
