import Link from "next/link";
import { lerConvite } from "@/lib/sistema";
import TelaDeEntrada from "@/components/TelaDeEntrada";
import CadastroOficinaForm from "@/components/CadastroOficinaForm";

export const dynamic = "force-dynamic";

const MOTIVO = {
  usado: {
    titulo: "Convite já usado",
    texto: "Este link já criou uma oficina. Se foi você, entre com o e-mail e a senha que cadastrou.",
  },
  vencido: {
    titulo: "Convite vencido",
    texto: "Este link passou da validade. Peça um novo a quem te convidou.",
  },
  inexistente: {
    titulo: "Convite não encontrado",
    texto: "Confira se o link foi copiado inteiro, ou peça um novo a quem te convidou.",
  },
} as const;

export default async function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { situacao, convite } = await lerConvite(token);

  if (situacao !== "valido") {
    const motivo = MOTIVO[situacao];
    return (
      <TelaDeEntrada titulo={motivo.titulo} descricao={motivo.texto}>
        <Link
          href="/login"
          className="block w-full rounded-lg bg-brand-600 py-2.5 text-center text-sm font-medium text-brand-fg hover:bg-brand-700"
        >
          Ir para o login
        </Link>
      </TelaDeEntrada>
    );
  }

  return (
    <TelaDeEntrada
      titulo="Cadastre a sua oficina"
      descricao="Você foi convidado. Crie a oficina e o seu acesso de dono — depois você cadastra a equipe por dentro do sistema."
      rodape="Guarde bem esta senha: enquanto você for o único dono da oficina, não há como redefini-la pela tela."
    >
      <CadastroOficinaForm convite={{ token, nomeOficina: convite?.nomeOficina ?? null }} />
    </TelaDeEntrada>
  );
}
