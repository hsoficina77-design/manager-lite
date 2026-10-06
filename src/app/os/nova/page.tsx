"use client";

import { Suspense } from "react";
import OSForm from "@/components/OSForm";
import { ExigeEscrita } from "@/components/plano/Bloqueio";

export default function NovaOSPage() {
  return (
    <ExigeEscrita>
      <Suspense>
        <OSForm mode="create" />
      </Suspense>
    </ExigeEscrita>
  );
}
