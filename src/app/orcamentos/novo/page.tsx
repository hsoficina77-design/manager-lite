"use client";

import { Suspense } from "react";
import OrcamentoForm from "@/components/OrcamentoForm";

export default function NovoOrcamentoPage() {
  return (
    <Suspense>
      <OrcamentoForm mode="create" />
    </Suspense>
  );
}
