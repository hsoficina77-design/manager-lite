import { getUsuarioAtual, registrarUsoDoApp } from "@/lib/auth";
import { getContaLojaAtual, registrarUsoDoAppNaLoja } from "@/lib/conta-loja";

// A tela foi aberta pelo app instalado (ver `RegistroDoApp` em ui/InstalarApp.tsx).
//
// Pública no proxy pelo mesmo motivo do "Sair": atende a sessão que o navegador tiver —
// da oficina ou da loja (cookie `pp_loja`). Cada uma é conferida aqui, e só carimba a
// própria conta; sem sessão nenhuma, não faz nada. Fica fora do modo só leitura: é
// medição, não gravação da oficina.
export async function POST() {
  const [usuario, contaLoja] = await Promise.all([getUsuarioAtual(), getContaLojaAtual()]);
  await Promise.all([
    usuario ? registrarUsoDoApp(usuario.id) : null,
    contaLoja ? registrarUsoDoAppNaLoja(contaLoja.id) : null,
  ]);
  return new Response(null, { status: 204 });
}
