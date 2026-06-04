import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.ordemServico.findMany({
    where: { mecanico: { not: null } },
    select: { mecanico: true },
    distinct: ["mecanico"],
    orderBy: { mecanico: "asc" },
  });

  const mecanicos = rows.map((r) => r.mecanico).filter(Boolean) as string[];
  return NextResponse.json(mecanicos);
}
