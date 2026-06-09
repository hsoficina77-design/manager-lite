// Backfill único: converte os nomes de mecânico (texto livre) das OS antigas
// em registros Mecanico e preenche OrdemServico.mecanicoId.
// Rodar uma vez após `prisma db push`:  node scripts/migrate-mecanicos.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ordens = await prisma.ordemServico.findMany({
    where: { mecanico: { not: null }, mecanicoId: null },
    select: { id: true, mecanico: true },
  });

  if (ordens.length === 0) {
    console.log("Nada a migrar.");
    return;
  }

  // Agrupa nomes distintos (case-insensitive, trim).
  const porChave = new Map(); // chave normalizada -> nome exibido
  for (const o of ordens) {
    const nome = (o.mecanico ?? "").trim();
    if (!nome) continue;
    const chave = nome.toLowerCase();
    if (!porChave.has(chave)) porChave.set(chave, nome);
  }

  // Reaproveita mecânicos já existentes com o mesmo nome.
  const existentes = await prisma.mecanico.findMany({ select: { id: true, nome: true } });
  const idPorChave = new Map(existentes.map((m) => [m.nome.trim().toLowerCase(), m.id]));

  for (const [chave, nome] of porChave) {
    if (!idPorChave.has(chave)) {
      const novo = await prisma.mecanico.create({ data: { nome } });
      idPorChave.set(chave, novo.id);
      console.log(`Criado mecânico: ${nome}`);
    }
  }

  let atualizadas = 0;
  for (const o of ordens) {
    const chave = (o.mecanico ?? "").trim().toLowerCase();
    const mecanicoId = idPorChave.get(chave);
    if (!mecanicoId) continue;
    await prisma.ordemServico.update({ where: { id: o.id }, data: { mecanicoId } });
    atualizadas++;
  }

  console.log(`Mecânicos: ${porChave.size}. OS atualizadas: ${atualizadas}.`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
