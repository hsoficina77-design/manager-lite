// Moldura das telas de fora do sistema (login e primeiro acesso).
//
// Roda sem o menu lateral — quem está aqui ainda não entrou — e já mostra a marca da
// oficina, para a pessoa reconhecer onde está antes de digitar a senha.

export default function TelaDeEntrada({
  nome,
  logoUrl,
  titulo,
  descricao,
  children,
  rodape,
}: {
  nome: string;
  logoUrl: string | null;
  titulo: string;
  descricao: string;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}) {
  const inicial = nome.trim().charAt(0).toUpperCase() || "O";

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-100 px-4 py-10 sm:items-center sm:py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={nome} className="h-16 w-16 object-contain" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-black text-brand-fg">
              {inicial}
            </span>
          )}
          <h1 className="mt-3 text-lg font-bold tracking-tight text-zinc-900">{nome}</h1>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">{titulo}</h2>
          <p className="mt-1 text-sm text-zinc-500">{descricao}</p>
          <div className="mt-5">{children}</div>
        </div>

        {rodape && <div className="mt-4 text-center text-xs text-zinc-500">{rodape}</div>}
      </div>
    </div>
  );
}
