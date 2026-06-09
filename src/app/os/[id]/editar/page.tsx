"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import OSForm, { type OSFormInitial } from "@/components/OSForm";

export default function EditarOSPage() {
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<OSFormInitial | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    fetch(`/api/os/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((os: any) => {
        setInitial({
          clienteId: os.clienteId ?? os.cliente?.id ?? "",
          veiculoId: os.veiculoId ?? os.veiculo?.id ?? "",
          descricao: os.descricao ?? "",
          kmEntrada: os.kmEntrada != null ? String(os.kmEntrada) : "",
          obs: os.obs ?? "",
          mecanicoId: os.mecanicoId ?? "",
          nivelCombustivel: os.nivelCombustivel ?? "",
          combustivelEmUso: os.combustivelEmUso ?? "",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          itens: (os.itens ?? []).map((i: any) => ({
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

  if (loading) return <div className="p-6 text-sm text-zinc-400">Carregando...</div>;
  if (erro || !initial) return <div className="p-6 text-sm text-zinc-400">OS não encontrada.</div>;

  return (
    <Suspense>
      <OSForm mode="edit" osId={id} initial={initial} />
    </Suspense>
  );
}
