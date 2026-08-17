import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type Faixa = "0-15" | "16-30" | "31-60" | "60+";

function calcFaixa(dias: number): Faixa {
  if (dias <= 15) return "0-15";
  if (dias <= 30) return "16-30";
  if (dias <= 60) return "31-60";
  return "60+";
}

// Agrega devedores (OS pendentes + dívidas avulsas) por cliente, com aging de inadimplência.
export async function GET() {
  const [ordens, dividas] = await Promise.all([
    prisma.ordemServico.findMany({
      where: { pago: false, status: { not: "CANCELADA" } },
      select: {
        id: true, numero: true, status: true, total: true, valorPago: true, abertura: true,
        veiculo: { select: { marca: true, modelo: true, placa: true } },
        cliente: { select: { id: true, nome: true, apelido: true, telefone: true } },
      },
      orderBy: { abertura: "asc" },
    }),
    prisma.dividaAvulsa.findMany({
      where: { pago: false },
      select: {
        id: true, descricao: true, valor: true, valorPago: true, createdAt: true,
        cliente: { select: { id: true, nome: true, apelido: true, telefone: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  type Veiculo = { marca: string; modelo: string; placa: string | null };
  type OSPendente = { id: string; numero: number; status: string; total: number; valorPago: number; abertura: Date; veiculo: Veiculo };
  type DividaAvulsa = { id: number; descricao: string; valor: number; valorPago: number; createdAt: Date };
  type ClienteDevedor = {
    id: string; nome: string; apelido: string | null; telefone: string | null;
    veiculos: Veiculo[];
    ordens: OSPendente[];
    dividasAvulsas: DividaAvulsa[];
    totalSaldo: number;
    diasEmAberto: number;
    faixa: Faixa;
  };

  const map = new Map<string, ClienteDevedor>();

  for (const os of ordens) {
    const saldo = os.total - os.valorPago;
    if (saldo <= 0) continue;
    const c = os.cliente;
    if (!map.has(c.id)) {
      map.set(c.id, {
        id: c.id, nome: c.nome, apelido: c.apelido, telefone: c.telefone,
        veiculos: [], ordens: [], dividasAvulsas: [], totalSaldo: 0, diasEmAberto: 0, faixa: "0-15",
      });
    }
    const entry = map.get(c.id)!;
    entry.ordens.push(os);
    entry.totalSaldo += saldo;
    const v = os.veiculo;
    if (!entry.veiculos.some((x) => x.placa === v.placa && x.marca === v.marca && x.modelo === v.modelo)) {
      entry.veiculos.push(v);
    }
  }

  for (const div of dividas) {
    const saldo = div.valor - div.valorPago;
    if (saldo <= 0) continue;
    const c = div.cliente;
    if (!map.has(c.id)) {
      map.set(c.id, {
        id: c.id, nome: c.nome, apelido: c.apelido, telefone: c.telefone,
        veiculos: [], ordens: [], dividasAvulsas: [], totalSaldo: 0, diasEmAberto: 0, faixa: "0-15",
      });
    }
    const entry = map.get(c.id)!;
    entry.dividasAvulsas.push(div);
    entry.totalSaldo += saldo;
  }

  const now = Date.now();
  const porFaixa: Record<Faixa, { clientes: number; valor: number }> = {
    "0-15": { clientes: 0, valor: 0 },
    "16-30": { clientes: 0, valor: 0 },
    "31-60": { clientes: 0, valor: 0 },
    "60+": { clientes: 0, valor: 0 },
  };

  for (const entry of map.values()) {
    const datas = [
      ...entry.ordens.map((o) => o.abertura.getTime()),
      ...entry.dividasAvulsas.map((d) => d.createdAt.getTime()),
    ];
    const oldest = Math.min(...datas);
    entry.diasEmAberto = Math.floor((now - oldest) / 86400000);
    entry.faixa = calcFaixa(entry.diasEmAberto);
    porFaixa[entry.faixa].clientes += 1;
    porFaixa[entry.faixa].valor += entry.totalSaldo;
  }

  const clientes = [...map.values()].sort((a, b) => b.totalSaldo - a.totalSaldo);

  const resumo = {
    totalAReceber: clientes.reduce((s, c) => s + c.totalSaldo, 0),
    totalDevedores: clientes.length,
    totalOSPendentes: clientes.reduce((s, c) => s + c.ordens.length, 0),
    totalDividasAvulsas: clientes.reduce((s, c) => s + c.dividasAvulsas.length, 0),
    porFaixa,
  };

  return NextResponse.json({ clientes, resumo });
}
