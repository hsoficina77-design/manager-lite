// Cria (ou repõe) dois usuários de teste no banco LOCAL, um de cada papel, para
// exercitar as travas de permissão de ponta a ponta. Não roda em produção: aborta se
// a DATABASE_URL não apontar para localhost.

import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

async function hashSenha(senha) {
  const salt = randomBytes(16);
  const chave = await scryptAsync(Buffer.from(senha.normalize("NFKC"), "utf8"), salt, 64, {
    N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024,
  });
  return ["scrypt", 16384, 8, 1, salt.toString("base64url"), chave.toString("base64url")].join("$");
}

const url = process.env.DATABASE_URL ?? "";
if (!/localhost|127\.0\.0\.1/.test(url)) {
  console.error("Recusado: DATABASE_URL não aponta para o banco local.");
  process.exit(1);
}

const prisma = new PrismaClient();

const contas = [
  { email: "dono@teste.local", nome: "Dono de Teste", papel: "ADMIN", senha: "TesteDono#2026" },
  { email: "op@teste.local", nome: "Operador de Teste", papel: "OPERADOR", senha: "TesteOper#2026" },
];

for (const conta of contas) {
  const senhaHash = await hashSenha(conta.senha);
  await prisma.usuario.upsert({
    where: { email: conta.email },
    update: { senhaHash, papel: conta.papel, ativo: true },
    create: { email: conta.email, nome: conta.nome, papel: conta.papel, senhaHash },
  });
  console.log(`ok ${conta.papel.padEnd(8)} ${conta.email}`);
}

await prisma.$disconnect();
