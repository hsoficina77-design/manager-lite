"use client";

import { useState } from "react";
import { Botao, Campo, Entrada, PaletaCor, Selecao, corSeguinte } from "./campos";
import { enviar, mensagemDoErro } from "./api";
import type { Categoria } from "./tipos";

/**
 * A categoria do gasto, com criação na hora.
 *
 * Sem isto, criar uma categoria no meio de um lançamento custava fechar o formulário,
 * abrir "Categorias", criar, voltar e digitar tudo de novo — e o caminho barato passava
 * a ser marcar "Outros". Depois de alguns meses "Outros" vira o maior gasto da oficina e
 * não responde nada. O botão aqui é o que faz a categoria certa custar menos que o balaio.
 *
 * A categoria recém-criada entra na lista local na hora: o `router.refresh()` do dono só
 * acontece quando o formulário inteiro é salvo, e até lá a opção precisa existir aqui.
 */
export function SeletorCategoria({
  categorias,
  valor,
  onMudar,
}: {
  categorias: Categoria[];
  valor: string;
  onMudar: (categoriaId: string) => void;
}) {
  const [criadas, setCriadas] = useState<Categoria[]>([]);
  // Oficina sem nenhuma categoria ativa cai direto no formulário de criar: um select
  // vazio com asterisco de obrigatório não diz o que fazer para sair dali.
  const [criando, setCriando] = useState(
    () => !categorias.some((c) => c.ativa || c.id === valor)
  );
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(corSeguinte(categorias.length));
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const lista = [...categorias, ...criadas];
  // A inativa some da lista, menos quando é a que o gasto já usa — senão editar um gasto
  // antigo trocaria a categoria dele em silêncio ao salvar.
  const disponiveis = lista.filter((c) => c.ativa || c.id === valor);

  async function criar() {
    const limpo = nome.trim();
    if (!limpo) return;
    setErro(null);
    setSalvando(true);
    try {
      const nova = await enviar<Categoria>("/api/despesas/categorias", "POST", {
        nome: limpo,
        cor,
      });
      setCriadas((atuais) => [...atuais, nova]);
      onMudar(nova.id);
      setNome("");
      setCor(corSeguinte(lista.length + 1));
      setCriando(false);
    } catch (err) {
      setErro(mensagemDoErro(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Campo rotulo="Categoria">
      <div className="flex gap-2">
        <Selecao
          value={valor}
          onChange={(e) => onMudar(e.target.value)}
          required
          className="min-w-0 flex-1"
        >
          {disponiveis.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
              {c.ativa ? "" : " (inativa)"}
            </option>
          ))}
        </Selecao>
        {!criando && (
          <Botao
            type="button"
            variante="secundario"
            className="shrink-0"
            onClick={() => setCriando(true)}
            title="Criar uma categoria sem sair daqui"
          >
            + Nova
          </Botao>
        )}
      </div>

      {criando && (
        <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2">
          <div className="flex gap-2">
            <PaletaCor valor={cor} onMudar={setCor} />
            <Entrada
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da categoria"
              maxLength={60}
              autoFocus
              className="min-w-0 flex-1"
              // Enter dentro de um formulário submeteria o gasto inteiro com a categoria
              // pela metade; aqui ele cria a categoria, que é o que a pessoa quis.
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  criar();
                }
              }}
            />
          </div>
          <div className="mt-2 flex gap-2">
            <Botao
              type="button"
              className="flex-1"
              disabled={salvando || !nome.trim()}
              onClick={criar}
            >
              {salvando ? "Criando..." : "Criar e usar"}
            </Botao>
            <Botao
              type="button"
              variante="secundario"
              className="flex-1"
              onClick={() => {
                setCriando(false);
                setErro(null);
              }}
            >
              Cancelar
            </Botao>
          </div>
          {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}
        </div>
      )}
    </Campo>
  );
}
