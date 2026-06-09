"use client";

import { Suspense } from "react";
import OSForm from "@/components/OSForm";

export default function NovaOSPage() {
  return (
    <Suspense>
      <OSForm mode="create" />
    </Suspense>
  );
}
