import { LogoBoxOS } from "./marca/LogoBoxOS";

// Moldura das telas de fora do sistema (login, primeiro acesso e convite).
//
// Roda sem o menu lateral — quem está aqui ainda não entrou — e mostra a marca do
// sistema, boxOS. Não há oficina a mostrar: o mesmo endereço atende todas, e só o
// e-mail digitado diz de qual oficina é a pessoa.

export default function TelaDeEntrada({
  titulo,
  descricao,
  children,
  rodape,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-fundo px-4 py-10 sm:items-center sm:py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 flex justify-center text-tinta">
          <LogoBoxOS className="text-4xl" />
        </h1>

        <div className="rounded-2xl border border-linha bg-superficie p-6 shadow-sm">
          <h2 className="text-base font-semibold text-tinta">{titulo}</h2>
          <p className="mt-1 text-sm text-tinta-3">{descricao}</p>
          <div className="mt-5">{children}</div>
        </div>

        {rodape && <div className="mt-4 text-center text-xs text-tinta-3">{rodape}</div>}
      </div>
    </div>
  );
}
