"use client";

import { Suspense } from "react";
import OrcamentoForm from "@/components/OrcamentoForm";
import { ExigeEscrita } from "@/components/plano/Bloqueio";

export default function NovoOrcamentoPage() {
  return (
    <ExigeEscrita>
      <Suspense>
        <OrcamentoForm mode="create" />
      </Suspense>
    </ExigeEscrita>
  );
}
