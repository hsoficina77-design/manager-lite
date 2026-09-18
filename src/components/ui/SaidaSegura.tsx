"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Botao } from "./Botao";
import { Modal } from "./Modal";

/* ==========================================================================
   Aviso de saída com alteração não salva.

   Antes, sair de uma OS meio preenchida era um toque só e sem pergunta: o
   polegar encosta em "Pátio" na barra de baixo e a tela vai embora. O rascunho
   local (ver `useDraft`) segurava o texto, mas quem estava com quinze itens
   lançados não tinha como saber disso — parecia trabalho perdido.

   Aqui a tela que tem edição pendente se registra, e o provider passa a vigiar
   as quatro maneiras de sair:

     link do sistema    menu lateral, barra do celular, seta de voltar
     voltar do aparelho botão físico/gesto do Android e do navegador
     fechar a aba       recarregar, fechar, digitar outro endereço
     sair da conta      o botão de logout do menu

   As três primeiras abrem o modal com as opções salvar / sair mesmo assim /
   continuar. A de fechar a aba é do navegador: ele só deixa mostrar a caixa
   padrão dele, sem texto nosso.

   ── Sobre o "voltar" ──────────────────────────────────────────────────────
   O navegador não deixa cancelar um "voltar" depois que ele acontece. O jeito
   de ganhar tempo é deixar uma entrada extra no histórico apontando para a
   própria tela (a sentinela): o voltar consome ela, o `popstate` nos avisa e aí
   dá para perguntar. O preço é que a tela atual passa a ocupar duas entradas —
   quem sai daqui e volta depois pode precisar de um toque a mais no voltar.
   Como as duas entradas são o mesmo endereço, nenhuma tela errada aparece.
   ========================================================================== */

type Registro = {
  /** Há alteração que ainda não foi para o servidor. */
  sujo: boolean;
  /** Salva e devolve `true` se deu certo. Sem isto, o modal só oferece sair. */
  salvar?: () => Promise<boolean>;
  /** O que exatamente está em jogo. Vale citar o rascunho, quando existe. */
  aviso?: string;
  /** Telas que mexem no próprio histórico desligam a guarda do "voltar". */
  guardarVoltar: boolean;
};

type Contexto = {
  registrar: (registro: Registro | null) => void;
  /** `true` quando dá para sair: nada pendente, ou o usuário decidiu sair. */
  pedirSaida: () => Promise<boolean>;
};

const SaidaContexto = createContext<Contexto | null>(null);

/**
 * Pergunta antes de sair, para ações que não são um link — o "Sair" do menu, por
 * exemplo. Fora de uma tela com edição pendente devolve `true` na hora.
 */
export function usePedirSaida() {
  const ctx = useContext(SaidaContexto);
  return ctx?.pedirSaida ?? PODE_SAIR;
}

const PODE_SAIR = () => Promise.resolve(true);

/**
 * Declara que esta tela tem (ou pode ter) alteração não salva.
 *
 *     useSaidaSegura({
 *       sujo: temAlteracao,
 *       salvar: async () => { ... return true; },
 *       aviso: "O que você digitou fica como rascunho neste aparelho.",
 *     });
 */
export function useSaidaSegura(opcoes: {
  sujo: boolean;
  salvar?: () => Promise<boolean>;
  aviso?: string;
  /** `false` em telas que empilham histórico por conta própria. */
  guardarVoltar?: boolean;
}) {
  const ctx = useContext(SaidaContexto);
  const { sujo, aviso, guardarVoltar = true } = opcoes;
  const temSalvar = !!opcoes.salvar;

  // `salvar` fecha sobre o estado da tela, então nasce de novo a cada tecla
  // digitada. Se entrasse nas dependências, o registro se refaria a cada
  // caractere; o ref aponta sempre para a versão mais nova e o efeito de baixo
  // só roda quando algo muda de verdade.
  const salvarRef = useRef(opcoes.salvar);
  useEffect(() => {
    salvarRef.current = opcoes.salvar;
  });

  useEffect(() => {
    if (!ctx) return;
    ctx.registrar({
      sujo,
      aviso,
      guardarVoltar,
      salvar: temSalvar ? () => salvarRef.current!() : undefined,
    });
    return () => ctx.registrar(null);
  }, [ctx, sujo, aviso, guardarVoltar, temSalvar]);
}

export function SaidaSeguraProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [perguntando, setPerguntando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const registroRef = useRef<Registro | null>(null);
  const resolverRef = useRef<((sair: boolean) => void) | null>(null);
  // Ligado só no instante em que nós mesmos chamamos `history.back()`, para o
  // `popstate` seguinte não perguntar de novo.
  const liberado = useRef(false);

  useEffect(() => {
    registroRef.current = registro;
  }, [registro]);

  const registrar = useCallback((novo: Registro | null) => {
    setRegistro((anterior) => (novo === null && anterior === null ? anterior : novo));
  }, []);

  const pedirSaida = useCallback(() => {
    if (!registroRef.current?.sujo) return Promise.resolve(true);
    // Já perguntando: qualquer outro caminho de saída espera a resposta.
    if (resolverRef.current) return Promise.resolve(false);
    setErro("");
    setPerguntando(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const responder = useCallback((sair: boolean) => {
    setPerguntando(false);
    setSalvando(false);
    resolverRef.current?.(sair);
    resolverRef.current = null;
  }, []);

  // "Estamos em cima da sentinela?" sai do próprio navegador, não de um estado
  // nosso: um `ref` continuaria dizendo "sim" se a tela saísse por um caminho
  // que não passa por aqui (um `refresh`, um redirecionamento), e o próximo
  // `irPara` engoliria uma entrada de histórico que não é dele.
  const naSentinela = () => window.history.state?.__saidaSegura === true;

  const porSentinela = useCallback(() => {
    if (naSentinela()) return;
    // Repetir o `history.state` é o que faz o Next tratar isto como entrada
    // dele e não recalcular rota nenhuma — ver o patch de `pushState` em
    // next/dist/client/components/app-router.js.
    window.history.pushState(
      { ...window.history.state, __saidaSegura: true },
      "",
      window.location.href
    );
  }, []);

  const irPara = useCallback(
    (destino: string) => {
      // Com a sentinela no ar, a tela atual ocupa duas entradas do histórico.
      // Trocar a sentinela pelo destino devolve o par ao normal: um "voltar"
      // reencontra o formulário, em vez de dois.
      if (naSentinela()) router.replace(destino);
      else router.push(destino);
    },
    [router]
  );

  const sujo = registro?.sujo ?? false;

  // ── Fechar a aba, recarregar, digitar outro endereço ──────────────────────
  // Texto é do navegador; só dá para pedir a pergunta.
  useEffect(() => {
    if (!sujo) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [sujo]);

  // ── Qualquer link do sistema ──────────────────────────────────────────────
  // Na fase de captura, antes do React: o clique para aqui e o <Link> do Next
  // nem chega a navegar. Só existe enquanto há edição pendente.
  useEffect(() => {
    if (!sujo) return;

    function aoClicar(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      // Ctrl/Cmd/Shift abrem em outra aba: esta tela continua onde está.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const alvo = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!alvo || alvo.hasAttribute("download")) return;
      if (alvo.target && alvo.target !== "_self") return;

      const url = new URL(alvo.href, window.location.href);
      // `blob:` (download de PDF), `tel:`, `mailto:`, `https://wa.me` de outro
      // domínio — nada disso troca a tela de baixo.
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      if (url.origin !== window.location.origin) return;
      // Só a âncora mudou: é rolagem dentro da própria tela.
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      const destino = url.pathname + url.search + url.hash;
      void pedirSaida().then((sair) => {
        if (sair) irPara(destino);
      });
    }

    document.addEventListener("click", aoClicar, true);
    return () => document.removeEventListener("click", aoClicar, true);
  }, [sujo, pedirSaida, irPara]);

  // ── Voltar do aparelho e do navegador ─────────────────────────────────────
  useEffect(() => {
    if (!sujo || !registro?.guardarVoltar) return;
    porSentinela();

    function aoVoltar() {
      // Chegamos aqui porque o voltar consumiu a sentinela.
      if (liberado.current) {
        liberado.current = false;
        return;
      }
      void pedirSaida().then((sair) => {
        if (!sair) {
          porSentinela();
          return;
        }
        liberado.current = true;
        window.history.back();
      });
    }

    window.addEventListener("popstate", aoVoltar);
    return () => window.removeEventListener("popstate", aoVoltar);
  }, [sujo, registro?.guardarVoltar, pedirSaida, porSentinela]);

  const valor = useMemo(() => ({ registrar, pedirSaida }), [registrar, pedirSaida]);

  async function salvarESair() {
    if (!registro?.salvar) return;
    setErro("");
    setSalvando(true);
    try {
      const ok = await registro.salvar();
      if (!ok) {
        setSalvando(false);
        setErro("Não deu para salvar. Confira a tela antes de sair.");
        return;
      }
      responder(true);
    } catch {
      setSalvando(false);
      setErro("Não deu para salvar. Confira a tela antes de sair.");
    }
  }

  return (
    <SaidaContexto.Provider value={valor}>
      {children}

      {perguntando && (
        <Modal
          titulo="Sair sem salvar?"
          largura="max-w-lg"
          onFechar={() => responder(false)}
          rodape={
            // No celular as ações empilham em largura cheia e a mais provável
            // fica em cima, ao alcance do polegar; no computador viram uma
            // linha, com a principal à direita. `flex-wrap` porque três rótulos
            // por extenso não cabem lado a lado em toda tela.
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <Botao
                variante="secundario"
                onClick={() => responder(false)}
                disabled={salvando}
                data-foco-inicial
              >
                Continuar editando
              </Botao>
              <Botao variante="perigo" onClick={() => responder(true)} disabled={salvando}>
                Sair sem salvar
              </Botao>
              {registro?.salvar && (
                <Botao variante="primario" onClick={salvarESair} disabled={salvando}>
                  {salvando ? "Salvando..." : "Salvar e sair"}
                </Botao>
              )}
            </div>
          }
        >
          <p className="text-sm text-tinta-2">
            {registro?.aviso ?? "O que você mudou nesta tela ainda não foi salvo."}
          </p>
          {erro && (
            <p className="mt-3 rounded-lg bg-perigo-fraco px-3 py-2 text-sm text-perigo">{erro}</p>
          )}
        </Modal>
      )}
    </SaidaContexto.Provider>
  );
}
