"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BotaoAjuda, ModalDeAjuda, type TextoDeAjuda } from "@/components/ui/Ajuda";
import {
  Caixa,
  Chave,
  Cofre,
  Despesa,
  Dinheiro,
  Engrenagem,
  Grafico,
  Interrogacao,
  Patio,
  Pessoas,
  PessoaMais,
  Prancheta,
  Recibo,
} from "@/components/ui/Icones";

/*
 * Tela inicial: os atalhos.
 *
 * Mecânico que não lida bem com tecnologia não sabe o que tem atrás de "Caixa" ou de
 * "Dashboard" até entrar. Aqui cada lugar do sistema vira um cartão grande com o nome,
 * uma frase do que tem lá dentro e um "?" com a explicação inteira.
 *
 * Os nomes e os ícones são os mesmos do menu lateral, de propósito: quem aprende o
 * cartão "Caixa" aqui reconhece o mesmo item no menu, e com o tempo deixa de precisar
 * desta tela. Por isso a ordem dos cartões também é a do menu.
 */

type Icone = typeof Patio;

type Tom = "neutro" | "atencao" | "perigo";

/** Números do momento que aparecem nos cartões. Vêm prontos do servidor. */
export type Contagens = {
  patio: number;
  aguardandoPeca: number;
  orcamentosPendentes: number;
  paraRepor: number;
  /** Só existe para quem vê o financeiro. */
  contasEmAberto: number | null;
};

type Permissoes = { podeFinanceiro: boolean; ehDono: boolean };

/* ------------------------------------------------------------------ Começar */

type Acao = {
  href: string;
  titulo: string;
  resumo: string;
  Icone: Icone;
  ajuda: TextoDeAjuda;
  /** Rótulo do botão no pé da explicação. */
  irPara: string;
};

const ACOES: Acao[] = [
  {
    href: "/os/nova",
    titulo: "Nova OS",
    resumo: "O carro chegou para o serviço",
    Icone: Recibo,
    irPara: "Abrir nova OS",
    ajuda: {
      titulo: "Nova OS",
      texto:
        "A OS (ordem de serviço) é a ficha do carro enquanto ele está na oficina: o que o cliente pediu, as peças, a mão de obra e o valor. É ela que você imprime ou manda em PDF para o cliente.",
      passos: [
        "Escolha o cliente e o carro.",
        "Lance as peças e os serviços.",
        "Salve. Quando o carro sair, marque como entregue.",
      ],
      dica: "O cliente e o carro precisam estar cadastrados antes. Se é a primeira vez dele na oficina, comece por Novo cliente.",
    },
  },
  {
    href: "/orcamentos/novo",
    titulo: "Novo orçamento",
    resumo: "Passar o preço antes de fazer",
    Icone: Prancheta,
    irPara: "Fazer orçamento",
    ajuda: {
      titulo: "Novo orçamento",
      texto:
        "O orçamento é o preço que você passa para o cliente antes de mexer no carro. Não precisa ter o cliente cadastrado: dá para anotar só o nome e o telefone.",
      passos: [
        "Coloque o cliente, o carro e o que vai ser feito.",
        "Mande o PDF para o cliente aprovar.",
        "Aprovou? Converta em OS sem digitar tudo de novo.",
      ],
    },
  },
  {
    href: "/clientes/novo",
    titulo: "Novo cliente",
    resumo: "Cadastrar o cliente e o carro",
    Icone: PessoaMais,
    irPara: "Cadastrar cliente",
    ajuda: {
      titulo: "Novo cliente",
      texto:
        "Cadastre o cliente e o carro dele uma vez só. Quando ele voltar, é só procurar pelo nome ou pela placa — o histórico inteiro está lá.",
      dica: "Para começar bastam o nome, o telefone e o carro. O resto dá para completar depois.",
    },
  },
];

/** Os três cartões de criar. Nova OS em destaque: é o gesto mais repetido do dia. */
export function AcoesDoInicio() {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {ACOES.map((acao, i) => (
        <CartaoAcao key={acao.href} acao={acao} destaque={i === 0} />
      ))}
    </div>
  );
}

function CartaoAcao({ acao, destaque }: { acao: Acao; destaque: boolean }) {
  const { Icone } = acao;
  return (
    // O "?" é irmão do link, não filho: botão dentro de link é HTML inválido, e o
    // toque no "?" abriria a tela em vez da explicação.
    <div
      className={cn(
        "group relative rounded-2xl transition-colors",
        destaque
          ? "bg-brand-600 text-brand-fg hover:bg-brand-700"
          : "border border-linha bg-superficie text-tinta hover:border-linha-forte hover:bg-superficie-2"
      )}
    >
      {/* No celular e no tablet é uma linha larga (ícone, texto, "?"), fácil de
          acertar com o polegar. Lado a lado, em pé, só a partir de `lg`: com o menu
          lateral aberto, três colunas num tablet deixam ~170px por cartão e
          "Novo orçamento" quebra em duas linhas. */}
      <Link
        href={acao.href}
        className="flex min-h-[5rem] items-center gap-4 rounded-2xl p-4 pr-14 lg:min-h-[9.5rem] lg:flex-col lg:items-start lg:justify-between lg:p-5"
      >
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            destaque ? "bg-black/10" : "bg-brand-50 text-brand-texto"
          )}
        >
          <Icone tamanho={24} />
        </span>
        <span className="min-w-0">
          <span className="block text-base font-semibold lg:text-lg">{acao.titulo}</span>
          <span
            className={cn("mt-0.5 block text-sm", destaque ? "text-brand-fg/80" : "text-tinta-3")}
          >
            {acao.resumo}
          </span>
        </span>
      </Link>
      <BotaoAjuda
        ajuda={acao.ajuda}
        acao={{ href: acao.href, rotulo: acao.irPara }}
        sobreMarca={destaque}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 lg:top-2 lg:translate-y-0"
      />
    </div>
  );
}

/* ----------------------------------------------------------------- Destinos */

type Destino = {
  href: string;
  /** O mesmo nome do menu lateral. */
  titulo: string;
  resumo: string;
  /** Quando o resumo fala de coisa que quem não vê o financeiro não vai encontrar. */
  resumoSemFinanceiro?: string;
  Icone: Icone;
  ajuda: TextoDeAjuda;
  /** Esconder é conforto; quem barra de verdade é o proxy. */
  so?: "financeiro" | "dono";
  aviso?: (c: Contagens) => { texto: string; tom: Tom } | null;
};

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

const DESTINOS: Destino[] = [
  {
    href: "/painel",
    titulo: "Dashboard",
    resumo: "O resumo da oficina: pátio, entregas e lucro",
    resumoSemFinanceiro: "O resumo da oficina: carros no pátio e entregas",
    Icone: Patio,
    aviso: (c) => (c.patio > 0 ? { texto: plural(c.patio, "carro no pátio", "carros no pátio"), tom: "neutro" } : null),
    ajuda: {
      titulo: "Dashboard",
      texto:
        "O resumo da oficina numa tela só. Na aba Operação ficam os carros que estão no pátio agora, com o que está parado há mais tempo no topo.",
      dica: "Quem cuida do dinheiro também vê a aba Resultado: quanto a oficina faturou e lucrou no mês.",
    },
  },
  {
    href: "/clientes",
    titulo: "Clientes",
    resumo: "Quem já veio, com os carros e o histórico",
    Icone: Pessoas,
    ajuda: {
      titulo: "Clientes",
      texto:
        "Todos os clientes da oficina. Abrindo um cliente você vê os carros dele, as OS que ele já fez e se ficou devendo alguma coisa.",
      dica: "Dá para procurar pelo nome, pelo apelido ou pela placa do carro.",
    },
  },
  {
    href: "/os",
    titulo: "Ordens de serviço",
    resumo: "Todas as OS, das abertas às entregues",
    Icone: Recibo,
    aviso: (c) =>
      c.aguardandoPeca > 0 ? { texto: `${c.aguardandoPeca} esperando peça`, tom: "atencao" } : null,
    ajuda: {
      titulo: "Ordens de serviço",
      texto:
        "Aqui ficam todas as OS, das que acabaram de abrir às já entregues. Abrindo uma, você muda o andamento, registra o pagamento e imprime.",
      dica: "Para achar uma OS, procure pelo nome do cliente, pela placa ou pelo número.",
    },
  },
  {
    href: "/orcamentos",
    titulo: "Orçamentos",
    resumo: "Preços passados, esperando o sim do cliente",
    Icone: Prancheta,
    // "Pendente" é o nome do status na lista de orçamentos — a palavra que a pessoa vai
    // encontrar ao abrir. E cabe no cartão estreito do celular sem quebrar a pílula.
    aviso: (c) =>
      c.orcamentosPendentes > 0
        ? { texto: plural(c.orcamentosPendentes, "pendente", "pendentes"), tom: "neutro" }
        : null,
    ajuda: {
      titulo: "Orçamentos",
      texto:
        "Todos os orçamentos que a oficina fez. Os pendentes ainda esperam a resposta do cliente. Quando ele aprovar, abra o orçamento e toque em Converter em OS.",
    },
  },
  {
    href: "/mecanicos",
    titulo: "Mecânicos",
    resumo: "A equipe da oficina",
    Icone: Chave,
    ajuda: {
      titulo: "Mecânicos",
      texto:
        "Cadastre quem trabalha na oficina. Assim cada OS leva o nome de quem fez o serviço, e fica fácil saber quem está com qual carro.",
    },
  },
  {
    href: "/produtividade",
    titulo: "Produtividade",
    resumo: "Quanto cada mecânico produziu",
    Icone: Grafico,
    so: "dono",
    ajuda: {
      titulo: "Produtividade",
      texto:
        "Compara o trabalho de cada mecânico no período: quantas OS ele entregou e quanto elas renderam para a oficina.",
      dica: "Só o dono vê esta tela.",
    },
  },
  {
    href: "/estoque",
    titulo: "Estoque",
    resumo: "Peças na prateleira e o que precisa repor",
    Icone: Caixa,
    aviso: (c) =>
      c.paraRepor > 0
        ? { texto: plural(c.paraRepor, "peça para repor", "peças para repor"), tom: "atencao" }
        : null,
    ajuda: {
      titulo: "Estoque",
      texto:
        "Cadastre as peças que a oficina guarda. Quando uma OS é entregue, as peças usadas nela saem do estoque sozinhas.",
      dica: "Coloque um estoque mínimo na peça e ela aparece em \"Precisa repor\" quando estiver acabando.",
    },
  },
  {
    href: "/contas-receber",
    titulo: "Contas a receber",
    resumo: "Quem está devendo e quanto",
    Icone: Dinheiro,
    so: "financeiro",
    aviso: (c) =>
      c.contasEmAberto ? { texto: plural(c.contasEmAberto, "conta em aberto", "contas em aberto"), tom: "perigo" } : null,
    ajuda: {
      titulo: "Contas a receber",
      texto:
        "Todo cliente que levou o carro sem pagar tudo aparece aqui — o fiado. Registre o pagamento quando ele acertar e veja o que cada um ainda deve.",
      dica: "Dívida que não veio de uma OS também pode ser lançada aqui.",
    },
  },
  {
    href: "/despesas",
    titulo: "Controle de gastos",
    resumo: "As contas da oficina: aluguel, luz, fornecedor",
    Icone: Despesa,
    so: "financeiro",
    ajuda: {
      titulo: "Controle de gastos",
      texto:
        "Lance o que a oficina paga: aluguel, luz, água, fornecedor. As contas fixas se repetem todo mês sozinhas, e tudo entra na conta do lucro do Dashboard.",
    },
  },
  {
    href: "/caixa",
    titulo: "Caixa",
    resumo: "O dinheiro que entrou no dia",
    Icone: Cofre,
    so: "financeiro",
    ajuda: {
      titulo: "Caixa",
      texto:
        "O fechamento do dia: tudo o que a oficina recebeu, separado por forma de pagamento — dinheiro, Pix, cartão.",
      dica: "Use no fim do expediente para conferir se o dinheiro da gaveta bate.",
    },
  },
  {
    href: "/configuracoes",
    titulo: "Configurações",
    resumo: "Dados da oficina, logo e acessos",
    Icone: Engrenagem,
    so: "dono",
    ajuda: {
      titulo: "Configurações",
      texto:
        "Nome, endereço, telefone e logo da oficina — é o que sai no topo da OS e do orçamento impressos. Também é onde você cria o acesso de quem trabalha com você.",
      dica: "Só o dono vê esta tela.",
    },
  },
];

const TOM_AVISO: Record<Tom, string> = {
  neutro: "bg-superficie-3 text-tinta-2",
  atencao: "bg-atencao-fraco text-atencao",
  perigo: "bg-perigo-fraco text-perigo",
};

/** Todos os lugares do sistema que a pessoa pode abrir, na ordem do menu. */
export function DestinosDoInicio({
  podeFinanceiro,
  ehDono,
  contagens,
}: Permissoes & { contagens: Contagens }) {
  const visiveis = DESTINOS.filter(
    (d) => !d.so || (d.so === "dono" ? ehDono : podeFinanceiro)
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {visiveis.map((d) => (
        <CartaoDestino
          key={d.href}
          destino={d}
          resumo={!podeFinanceiro && d.resumoSemFinanceiro ? d.resumoSemFinanceiro : d.resumo}
          aviso={d.aviso?.(contagens) ?? null}
        />
      ))}
    </div>
  );
}

function CartaoDestino({
  destino,
  resumo,
  aviso,
}: {
  destino: Destino;
  resumo: string;
  aviso: { texto: string; tom: Tom } | null;
}) {
  const { Icone } = destino;
  return (
    <div className="group relative">
      <Link
        href={destino.href}
        className="flex h-full min-h-[8.5rem] flex-col gap-3 rounded-2xl border border-linha bg-superficie p-4 transition-colors hover:border-linha-forte hover:bg-superficie-2"
      >
        {/* O ícone acende na cor da marca ao passar o mouse ou tocar — o cartão
            responde antes de a tela trocar. */}
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-superficie-3 text-tinta-2 transition-colors group-hover:bg-brand-50 group-hover:text-brand-texto">
          <Icone tamanho={22} />
        </span>
        <span className="block min-w-0">
          <span className="block text-sm font-semibold leading-snug text-tinta sm:text-base">
            {destino.titulo}
          </span>
          <span className="mt-1 block text-xs leading-snug text-tinta-3 sm:text-sm">{resumo}</span>
        </span>
        {/* `mt-auto` assenta o aviso no pé: numa fileira de cartões de altura igual,
            os avisos ficam todos na mesma linha. */}
        {aviso && (
          <span
            className={cn(
              "mt-auto self-start rounded-full px-2 py-0.5 text-xs font-medium",
              TOM_AVISO[aviso.tom]
            )}
          >
            {aviso.texto}
          </span>
        )}
      </Link>
      <BotaoAjuda
        ajuda={destino.ajuda}
        acao={{ href: destino.href, rotulo: `Abrir ${destino.titulo}` }}
        className="absolute right-1 top-1"
      />
    </div>
  );
}

/* ------------------------------------------------------------ Como funciona */

const COMO_FUNCIONA: TextoDeAjuda = {
  titulo: "Como funciona o boxOS",
  texto: "O caminho de um carro na oficina, do começo ao fim:",
  passos: [
    "Cadastre o cliente e o carro — só na primeira vez.",
    "Se o cliente quiser saber o preço antes, faça um orçamento.",
    "Abra a OS e lance as peças e os serviços.",
    "Quando o carro sair, marque a OS como entregue e registre o pagamento.",
  ],
  dica: "Ficou em dúvida sobre alguma parte? Toque no ? do cartão dela, aqui no início.",
};

/**
 * O passo a passo do sistema inteiro. No celular é só o "?", para caber ao lado da
 * saudação sem empurrar os cartões para baixo; no computador leva o texto junto.
 */
export function ComoFunciona() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Como funciona o boxOS"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full border border-linha bg-superficie text-sm font-medium text-tinta-2 transition-colors hover:bg-superficie-2 hover:text-tinta sm:w-auto sm:pl-3 sm:pr-4"
      >
        <Interrogacao tamanho={20} />
        <span className="hidden sm:inline">Como funciona</span>
      </button>

      {/* Sem botão de "ir para": os três cartões de começar estão logo abaixo. */}
      {aberto && <ModalDeAjuda ajuda={COMO_FUNCIONA} onFechar={() => setAberto(false)} />}
    </>
  );
}
