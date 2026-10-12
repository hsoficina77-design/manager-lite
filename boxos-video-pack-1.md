# boxOS — pacote visual para o vídeo · parte 1 de 5

**Esta parte:** Mapa das telas, tokens, marca e componentes base.

Pacote gerado em 07/10/2026 a partir do repositório do boxOS, só por leitura: nenhum arquivo do projeto foi alterado. Serve para recriar as telas num vídeo animado, fora do repositório.

Partes: 1. Mapa das telas, tokens, marca e componentes base · 2. Pátio (Dashboard e lista de OS) · 3. Orçamento, OS aberta e documento da OS · 4. Fiado e painel financeiro · 5. Dados fictícios. Os tokens, a marca e os componentes base estão na parte 1, e os dados fictícios na parte 5.

## Índice (todas as partes)

| Parte | Arquivo | Conteúdo | Tamanho aprox. |
|---|---|---|---|
| **1** ← | `src/app/globals.css` | íntegro | 17,8 KB |
| **1** ← | `tailwind.config.ts` | íntegro | 4,2 KB |
| **1** ← | `src/app/layout.tsx` | trecho: Poppins e variável de fonte | 0,9 KB |
| **1** ← | `src/components/marca/LogoBoxOS.tsx` | íntegro | 3,5 KB |
| **1** ← | `public/brand/boxOS_horizontal.svg` | íntegro | 1,0 KB |
| **1** ← | `public/brand/boxOS_horizontal_fundo_escuro.svg` | íntegro | 1,0 KB |
| **1** ← | `public/brand/boxOS_horizontal_mono_branco.svg` | íntegro | 1,0 KB |
| **1** ← | `public/brand/boxOS_horizontal_mono_preto.svg` | íntegro | 1,0 KB |
| **1** ← | `public/brand/boxOS_icone_app.svg` | íntegro | 0,9 KB |
| **1** ← | `public/brand/boxOS_simbolo.svg` | íntegro | 0,8 KB |
| **1** ← | `public/brand/favicon_16.svg` | íntegro | 0,5 KB |
| **1** ← | `src/components/ui/Icones.tsx` | íntegro | 8,5 KB |
| **1** ← | `src/components/ui/Botao.tsx` | íntegro | 2,5 KB |
| **1** ← | `src/lib/constants.ts` | trecho: corStatus() e OS_STATUS | 1,8 KB |
| **1** ← | `src/lib/cor-documento.ts` | íntegro | 4,8 KB |
| **1** ← | `src/app/layout.tsx` | trecho: casca do app (menu + conteúdo) | 1,4 KB |
| **1** ← | `src/components/Sidebar.tsx` | lógica de dados removida | 11,8 KB |
| **1** ← | `src/components/ui/BarraInferior.tsx` | íntegro | 3,2 KB |
| **1** ← | `src/components/ui/Dados.tsx` | íntegro | 7,7 KB |
| **1** ← | `src/components/ui/Campos.tsx` | íntegro | 6,2 KB |
| **1** ← | `src/components/ui/Modal.tsx` | íntegro | 5,3 KB |
| **1** ← | `src/components/ui/Avisos.tsx` | íntegro | 5,8 KB |
| **1** ← | `src/components/MaisDaLista.tsx` | íntegro | 1,1 KB |
| **1** ← | `src/components/ui/TextoFormatado.tsx` | íntegro | 2,7 KB |
| **1** ← | `src/components/CopiarVeiculo.tsx` | íntegro | 4,3 KB |
| **1** ← | `src/lib/utils.ts` | íntegro | 5,5 KB |
| **1** ← | `src/lib/configuracao.ts` | íntegro | 3,9 KB |
| 2 | `src/app/page.tsx` | lógica de dados removida | 29,9 KB |
| 2 | `src/app/os/page.tsx` | lógica de dados removida | 12,9 KB |
| 2 | `src/lib/os-periodo.ts` | íntegro | 1,5 KB |
| 2 | `src/lib/periodo.ts` | íntegro | 12,6 KB |
| 2 | `src/lib/texto-formatado.ts` | íntegro | 7,2 KB |
| 3 | `src/app/orcamentos/[id]/page.tsx` | lógica de dados removida | 21,3 KB |
| 3 | `src/components/BaixarOrcamento.tsx` | lógica de dados removida | 1,5 KB |
| 3 | `src/app/os/[id]/page.tsx` | lógica de dados removida | 43,5 KB |
| 3 | `src/components/CabecalhoDocumento.tsx` | lógica de dados removida | 2,2 KB |
| 3 | `src/components/Fotos.tsx` | lógica de dados removida | 24,5 KB |
| 3 | `src/components/BaixarOS.tsx` | lógica de dados removida | 1,4 KB |
| 3 | `src/components/BaixarDocumento.tsx` | íntegro | 10,5 KB |
| 3 | `src/lib/formato-download.ts` | íntegro | 1,4 KB |
| 3 | `src/components/OSPdfDocument.tsx` | íntegro | 16,7 KB |
| 3 | `src/components/TextoFormatadoPdf.tsx` | íntegro | 1,8 KB |
| 3 | `src/lib/pdf-para-imagem.ts` | íntegro | 3,9 KB |
| 4 | `src/app/contas-receber/page.tsx` | lógica de dados removida | 31,2 KB |
| 4 | `src/components/BaixarComprovante.tsx` | lógica de dados removida | 4,0 KB |
| 4 | `src/components/ComprovantePagamentoPdfDocument.tsx` | íntegro | 12,5 KB |
| 4 | `src/components/ClienteSelect.tsx` | íntegro | 8,2 KB |
| 4 | `src/app/despesas/page.tsx` | lógica de dados removida | 1,5 KB |
| 4 | `src/components/despesas/ControleDeGastos.tsx` | lógica de dados removida | 33,2 KB |
| 4 | `src/components/despesas/campos.tsx` | íntegro | 3,5 KB |
| 4 | `src/components/despesas/tipos.ts` | íntegro | 1,4 KB |
| 4 | `src/lib/despesas-comum.ts` | íntegro | 8,3 KB |
| 5 | `dados-ficticios.json` | gerado para o vídeo: não existe no repositório | 48,9 KB |

---

## 1. Mapa das telas

Todas as rotas do app (Next.js App Router, pasta `src/app/`). O menu lateral mostra Dashboard, Clientes, Ordens de serviço (com Orçamentos), Mecânicos (com Produtividade), Estoque, Contas a receber, Controle de gastos e Caixa. No celular, uma barra inferior leva aos destinos do dia.

| Rota | Arquivo | O que é |
|---|---|---|
| `/` | `src/app/page.tsx` | Dashboard em duas abas: **Resultado** (faturado, ticket médio, recebido, lucro bruto e líquido, DRE simplificado e distribuição no período) e **Operação** (pátio com dias parado, a receber, devedores e números de hoje). |
| `/os` | `src/app/os/page.tsx` | Lista de ordens de serviço com as abas Todas, Pátio e Entregues, busca, filtros e ordenação. |
| `/os/nova` | `src/app/os/nova/page.tsx` | Abertura de OS: cliente, veículo, recepção (km e combustível), itens, mecânico. |
| `/os/[id]` | `src/app/os/[id]/page.tsx` | OS aberta: o documento como o cliente vê, mais uma coluna interna com lucro, pagamento, desconto e fotos. |
| `/os/[id]/editar` | `src/app/os/[id]/editar/page.tsx` | Edição da OS, com o mesmo formulário da abertura. |
| `/orcamentos` | `src/app/orcamentos/page.tsx` | Lista de orçamentos por status: Pendente, Aprovado, Recusado e Convertido. |
| `/orcamentos/novo` | `src/app/orcamentos/novo/page.tsx` | Novo orçamento. Aceita rascunho sem cliente cadastrado. |
| `/orcamentos/[id]` | `src/app/orcamentos/[id]/page.tsx` | Orçamento em formato de documento, com o botão **Converter em OS**. |
| `/orcamentos/[id]/editar` | `src/app/orcamentos/[id]/editar/page.tsx` | Edição do orçamento. |
| `/clientes` | `src/app/clientes/page.tsx` | Lista de clientes com busca por nome, apelido e placa. |
| `/clientes/novo` | `src/app/clientes/novo/page.tsx` | Cadastro de cliente e veículo; o CEP preenche o endereço. |
| `/clientes/[id]` | `src/app/clientes/[id]/page.tsx` | Ficha do cliente: veículos, histórico de OS, totais e extrato de pagamentos. |
| `/mecanicos` | `src/app/mecanicos/page.tsx` | Equipe de mecânicos. |
| `/mecanicos/[id]` | `src/app/mecanicos/[id]/page.tsx` | Ficha do mecânico: OS do mês, faturamento, lucro e meta mensal. |
| `/produtividade` | `src/app/produtividade/page.tsx` | Comparativo dos mecânicos por mês, semestre ou ano, com metas e evolução (só para o dono). |
| `/estoque` | `src/app/estoque/page.tsx` | Peças da prateleira: custo, preço, saldo, aviso de reposição e movimentos. |
| `/contas-receber` | `src/app/contas-receber/page.tsx` | Fiado: devedores por faixa de atraso, recebimentos, dívidas avulsas, comprovante e extrato. |
| `/despesas` | `src/app/despesas/page.tsx` | Controle de gastos do mês: fixos e variáveis, por categoria, e **ponto de equilíbrio**. |
| `/caixa` | `src/app/caixa/page.tsx` | Fechamento de caixa do dia, por forma de pagamento. |
| `/configuracoes` | `src/app/configuracoes/page.tsx` | Painel da oficina: dados, logo, cor dos documentos, textos do documento e reserva de lucro. |
| `/configuracoes/usuarios` | `src/app/configuracoes/usuarios/page.tsx` | Acessos da equipe e permissões (ver financeiro, excluir). |
| `/configuracoes/plataforma` | `src/app/configuracoes/plataforma/page.tsx` | Painel de quem administra o boxOS: oficinas, convites e cadastros do teste. |
| `/assinatura` | `src/app/assinatura/page.tsx` | Situação do plano e pagamento da assinatura. |
| `/assinatura/obrigado` | `src/app/assinatura/obrigado/page.tsx` | Espera a confirmação do pagamento. |
| `/login` | `src/app/login/page.tsx` | Tela de entrada. |
| `/primeiro-acesso` | `src/app/primeiro-acesso/page.tsx` | Cria o primeiro usuário (dono) num sistema novo. |
| `/convite/[token]` | `src/app/convite/[token]/page.tsx` | Cadastro de oficina por convite. |
| `/teste` | `src/app/teste/page.tsx` | Cadastro do teste grátis de 5 dias (link da bio do Instagram). |
| `/termos` | `src/app/termos/page.tsx` | Termos de uso. |
| `/privacidade` | `src/app/privacidade/page.tsx` | Política de privacidade. |

## 2. Tokens e estilo global

Cores, tema claro/escuro, classes de status e de tempo em aberto, piso dos formulários e regras de impressão estão no `globals.css`. O Tailwind (v3.4, sem bloco `@theme`) só dá nome às variáveis. A fonte da marca entra pelo `layout.tsx`.

### src/app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================================================
   Tokens de cor
   ----------------------------------------------------------------------------
   Duas famílias, com papéis separados de propósito:

   brand-* / menu-*  identidade do boxOS: o laranja da logo (#F2A900) sobre
                     branco no tema claro e sobre grafite no escuro. Fixa — a
                     oficina não escolhe cor; a marca do software é uma só.
   tudo o resto      significado: superfície, tinta, linha, e os três semáforos
                     (ok, atenção, perigo).

   Perigo é token próprio e não deriva da marca: "Excluir" nunca pode parecer
   "Nova OS", e as ações destrutivas são sempre contornadas, nunca sólidas.

   O tema escuro troca só os valores destas variáveis. Nenhum componente usa
   `dark:` — se um token existe, ele já funciona nos dois temas.
   ========================================================================== */

@layer base {
  :root {
    /* Sem isto, o navegador não sabe que a página tem tema escuro próprio e
       tenta adivinhar — no Chrome/Android isso repinta o fundo e a borda dos
       campos de formulário com a paleta dele, por cima das cores daqui,
       deixando fundo quase branco com letra cinza-clara ilegível. */
    color-scheme: light;

    /* --- identidade boxOS ---------------------------------------------------
       Escala do laranja da logo, ancorada no 600 = #F2A900 (AMARELO_BOXOS em
       marca/LogoBoxOS.tsx). Sobre o 600 o texto é tinta escura: branco sobre
       este laranja dá 2:1. */
    --brand-50: 255 250 240;
    --brand-100: 255 245 223;
    --brand-200: 255 237 196;
    --brand-300: 255 226 157;
    --brand-400: 255 207 97;
    --brand-500: 255 189 36;
    --brand-600: 242 169 0;
    --brand-700: 201 140 0;
    --brand-800: 166 117 3;
    --brand-900: 143 102 8;
    --brand-950: 84 61 7;
    --brand-fg: 24 24 27;
    /* A marca como texto (link, número da OS, aba ativa): o laranja escurecido até
       4,8:1 sobre branco — o puro dá 2:1. No escuro ele já lê bem como está. */
    --brand-texto: 150 105 0;

    /* Menu branco, com a logo na versão principal (hastes grafite). */
    --menu-bg: 255 255 255;
    --menu-fg: 30 35 41;
    --menu-borda: 220 226 232;
    --menu-hover: 239 241 244;
    --menu-texto: 61 71 82;

    /* --- neutros -----------------------------------------------------------
       Levemente puxados para o azul-ardósia. Cinza puro é o cinza que ninguém
       escolheu; este tem temperatura e conversa com o azul dos status. */
    --fundo: 239 241 244;
    --superficie: 255 255 255;
    --superficie-2: 245 247 249;
    --superficie-3: 232 236 240;

    /* Tinta secundária em 5,7:1 sobre branco. O antigo zinc-400 dava 2,5:1 e
       zinc-500 dava 4,4:1 — os dois reprovam no mínimo AA de 4,5:1. */
    --tinta: 20 24 29;
    --tinta-2: 61 71 82;
    --tinta-3: 91 104 117;

    --linha: 220 226 232;
    --linha-forte: 195 204 213;

    /* Botão de contraste (o antigo zinc-800): inverte junto com o tema. */
    --contraste: 31 41 51;
    --contraste-fg: 255 255 255;

    /* --- semáforo --------------------------------------------------------- */
    --ok: 22 124 74;
    --ok-fraco: 230 244 236;
    --ok-linha: 183 223 200;
    --ok-fg: 255 255 255;

    --atencao: 154 97 0;
    --atencao-fraco: 253 243 224;
    --atencao-linha: 235 207 155;
    --atencao-fg: 255 255 255;

    --perigo: 192 39 31;
    --perigo-fraco: 252 236 235;
    --perigo-linha: 240 191 188;
    --perigo-fg: 255 255 255;

    /* --- status da OS ------------------------------------------------------
       Quatro matizes distintos, não quatro degraus do mesmo cinza. O que precisa
       parar o olho é Ag. Peça: é o único bloqueado esperando decisão do dono, e
       o único com anel saturado. Entregue e Cancelada recuam. */
    --st-aberta-bg: 237 241 245;
    --st-aberta-fg: 61 71 82;
    --st-aberta-anel: 211 219 227;

    --st-andamento-bg: 220 235 250;
    --st-andamento-fg: 15 76 129;
    --st-andamento-anel: 169 205 236;

    --st-peca-bg: 252 235 203;
    --st-peca-fg: 122 74 0;
    --st-peca-anel: 224 169 60;

    --st-entregue-bg: 226 243 233;
    --st-entregue-fg: 26 102 64;
    --st-entregue-anel: 186 223 201;

    --st-inerte-bg: 240 241 243;
    --st-inerte-fg: 119 129 140;
    --st-inerte-anel: 220 224 229;

    /* --- tempo em aberto ---------------------------------------------------
       O aging é uma rampa de quatro passos, e o semáforo de três não dava conta:
       colapsar "16-30 dias" e "31-60 dias" na mesma cor apagaria a faixa que
       separa o atraso novo do atraso velho. */
    --idade-0-bg: 237 241 245; --idade-0-fg: 91 104 117;  --idade-0-ponto: 148 163 178;
    --idade-1-bg: 226 243 233; --idade-1-fg: 26 102 64;   --idade-1-ponto: 34 160 96;
    --idade-2-bg: 253 246 214; --idade-2-fg: 122 92 0;    --idade-2-ponto: 214 170 20;
    --idade-3-bg: 253 235 217; --idade-3-fg: 143 74 8;    --idade-3-ponto: 226 122 30;
    --idade-4-bg: 252 232 230; --idade-4-fg: 165 34 27;   --idade-4-ponto: 214 55 46;
  }

  /* Tema escuro por preferência do sistema, a menos que a pessoa tenha
     escolhido claro explicitamente. */
  @media (prefers-color-scheme: dark) {
    :root:not([data-tema="claro"]) {
      color-scheme: dark;

      /* Os tons claros da marca viram âmbar escuro: são fundo de item selecionado e
       de aviso (`bg-brand-50 text-brand-texto`), e um creme no meio da tela
       escura ofuscaria e apagaria o texto em laranja por cima. */
    --brand-50: 48 39 18;
    --brand-100: 61 49 20;
    --brand-200: 90 70 22;
    --brand-300: 134 99 19;
    --brand-texto: 242 169 0;

    /* Menu grafite, com a logo na versão de fundo escuro (hastes brancas). */
    --menu-bg: 30 35 41;
    --menu-fg: 255 255 255;
    --menu-borda: 56 65 76;
    --menu-hover: 64 75 88;
    --menu-texto: 170 171 174;

      --fundo: 14 19 23;
      --superficie: 22 29 36;
      --superficie-2: 28 36 44;
      --superficie-3: 38 48 58;

      --tinta: 230 236 242;
      --tinta-2: 180 193 205;
      --tinta-3: 139 153 167;

      --linha: 42 52 62;
      --linha-forte: 58 71 83;

      --contraste: 230 236 242;
      --contraste-fg: 20 24 29;

      --ok: 78 203 139;
      --ok-fraco: 18 41 31;
      --ok-linha: 36 80 58;
      --ok-fg: 8 26 17;

      --atencao: 229 169 63;
      --atencao-fraco: 43 33 19;
      --atencao-linha: 86 65 29;
      --atencao-fg: 31 22 6;

      --perigo: 242 134 126;
      --perigo-fraco: 44 23 21;
      --perigo-linha: 87 42 38;
      --perigo-fg: 38 15 13;

      --st-aberta-bg: 35 44 53;
      --st-aberta-fg: 180 193 205;
      --st-aberta-anel: 51 63 74;

      --st-andamento-bg: 18 50 77;
      --st-andamento-fg: 140 196 239;
      --st-andamento-anel: 30 86 135;

      --st-peca-bg: 58 42 12;
      --st-peca-fg: 240 190 98;
      --st-peca-anel: 138 100 16;

      --st-entregue-bg: 19 48 36;
      --st-entregue-fg: 111 208 155;
      --st-entregue-anel: 35 90 61;

      --st-inerte-bg: 30 37 44;
      --st-inerte-fg: 125 136 148;
      --st-inerte-anel: 44 53 62;

      --idade-0-bg: 35 44 53;  --idade-0-fg: 155 168 181; --idade-0-ponto: 106 121 136;
      --idade-1-bg: 19 48 36;  --idade-1-fg: 111 208 155; --idade-1-ponto: 52 178 114;
      --idade-2-bg: 52 44 12;  --idade-2-fg: 226 195 88;  --idade-2-ponto: 190 158 40;
      --idade-3-bg: 56 37 17;  --idade-3-fg: 236 165 100; --idade-3-ponto: 208 116 44;
      --idade-4-bg: 51 27 25;  --idade-4-fg: 242 145 137; --idade-4-ponto: 214 84 74;
    }
  }

  /* Escolha explícita do usuário vence os dois lados. */
  :root[data-tema="escuro"] {
    color-scheme: dark;

    /* Os tons claros da marca viram âmbar escuro: são fundo de item selecionado e
       de aviso (`bg-brand-50 text-brand-texto`), e um creme no meio da tela
       escura ofuscaria e apagaria o texto em laranja por cima. */
    --brand-50: 48 39 18;
    --brand-100: 61 49 20;
    --brand-200: 90 70 22;
    --brand-300: 134 99 19;
    --brand-texto: 242 169 0;

    /* Menu grafite, com a logo na versão de fundo escuro (hastes brancas). */
    --menu-bg: 30 35 41;
    --menu-fg: 255 255 255;
    --menu-borda: 56 65 76;
    --menu-hover: 64 75 88;
    --menu-texto: 170 171 174;

    --fundo: 14 19 23;
    --superficie: 22 29 36;
    --superficie-2: 28 36 44;
    --superficie-3: 38 48 58;

    --tinta: 230 236 242;
    --tinta-2: 180 193 205;
    --tinta-3: 139 153 167;

    --linha: 42 52 62;
    --linha-forte: 58 71 83;

    --contraste: 230 236 242;
    --contraste-fg: 20 24 29;

    --ok: 78 203 139;
    --ok-fraco: 18 41 31;
    --ok-linha: 36 80 58;
    --ok-fg: 8 26 17;

    --atencao: 229 169 63;
    --atencao-fraco: 43 33 19;
    --atencao-linha: 86 65 29;
    --atencao-fg: 31 22 6;

    --perigo: 242 134 126;
    --perigo-fraco: 44 23 21;
    --perigo-linha: 87 42 38;
    --perigo-fg: 38 15 13;

    --st-aberta-bg: 35 44 53;
    --st-aberta-fg: 180 193 205;
    --st-aberta-anel: 51 63 74;

    --st-andamento-bg: 18 50 77;
    --st-andamento-fg: 140 196 239;
    --st-andamento-anel: 30 86 135;

    --st-peca-bg: 58 42 12;
    --st-peca-fg: 240 190 98;
    --st-peca-anel: 138 100 16;

    --st-entregue-bg: 19 48 36;
    --st-entregue-fg: 111 208 155;
    --st-entregue-anel: 35 90 61;

    --st-inerte-bg: 30 37 44;
    --st-inerte-fg: 125 136 148;
    --st-inerte-anel: 44 53 62;

    --idade-0-bg: 35 44 53;  --idade-0-fg: 155 168 181; --idade-0-ponto: 106 121 136;
    --idade-1-bg: 19 48 36;  --idade-1-fg: 111 208 155; --idade-1-ponto: 52 178 114;
    --idade-2-bg: 52 44 12;  --idade-2-fg: 226 195 88;  --idade-2-ponto: 190 158 40;
    --idade-3-bg: 56 37 17;  --idade-3-fg: 236 165 100; --idade-3-ponto: 208 116 44;
    --idade-4-bg: 51 27 25;  --idade-4-fg: 242 145 137; --idade-4-ponto: 214 84 74;
  }

  /* Folha do documento (OS e orçamento na tela). É o único lugar com a cor da
     oficina: `estiloDoDocumento` (src/lib/cor-documento.ts) escreve as três
     variáveis no `style` do elemento; sem elas vale o laranja boxOS. O texto
     usa a versão que lê bem sobre a folha de cada tema. */
  .documento {
    --doc-cor: 242 169 0;
    --doc-texto-claro: 150 105 0;
    --doc-texto-noturno: 242 169 0;
    --doc-texto: var(--doc-texto-claro);
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-tema="claro"]) .documento {
      --doc-texto: var(--doc-texto-noturno);
    }
  }
  :root[data-tema="escuro"] .documento {
    --doc-texto: var(--doc-texto-noturno);
  }

  * {
    scrollbar-width: thin;
    scrollbar-color: rgb(var(--linha-forte)) transparent;
  }

  /* Piso de cor para campos de formulário. Sem isto, um input sem as classes
     `bg-superficie text-tinta` herda o preto-sobre-branco do navegador — some
     no tema escuro. `:where()` mantém especificidade zero: qualquer utilitário
     do Tailwind ainda vence. */
  :where(input:not([type="checkbox"]):not([type="radio"]), select, textarea) {
    background-color: rgb(var(--superficie));
    color: rgb(var(--tinta));
  }
  :where(input, textarea)::placeholder {
    color: rgb(var(--tinta-3));
    opacity: 1;
  }

  /* Autofill do Chrome: pinta o campo de amarelo-claro com texto preto e ignora
     `background-color`. A sombra interna cobre esse fundo e o `-webkit-text-fill`
     devolve a tinta do tema. */
  :where(input:-webkit-autofill, input:-webkit-autofill:focus, textarea:-webkit-autofill) {
    -webkit-text-fill-color: rgb(var(--tinta));
    -webkit-box-shadow: 0 0 0 1000px rgb(var(--superficie)) inset;
    caret-color: rgb(var(--tinta));
  }

  /* Evita zoom automático do iOS ao focar inputs (fontes < 16px) */
  @media (max-width: 767px) {
    input,
    select,
    textarea {
      font-size: 16px;
    }

    /* Alvo de toque de 44 px, a mesma régua que o botão do sistema segue.
       Os campos ficavam em torno de 38 px — abaixo do confortável justamente
       nos formulários preenchidos em pé, com o celular numa das mãos.
       Vale aqui, e não na classe base de `Campos.tsx`, porque vinte campos
       espalhados pelos formulários de OS, orçamento, cliente e gastos
       desenham as próprias classes sem passar por aquele arquivo; o piso
       alcança todos. `:where()` mantém especificidade zero, então qualquer
       utilitário do Tailwind ainda vence quando o campo precisa ser outro.
       Cor e arquivo ficam de fora: não são caixas de digitar, e esticá-los
       deformaria a amostra de cor do painel de configurações. */
    :where(
      input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="color"]):not([type="file"]),
      select,
      textarea
    ) {
      min-height: 2.75rem;
    }
  }

  /* Títulos de tela na fonte da marca (Poppins). Regra única em vez de uma classe
     em cada `h1` espalhado pelas telas. O nome da oficina no topo dos documentos
     também é um `h1` e sai daqui com `font-sans`: a identidade ali é da oficina. */
  h1 {
    font-family: var(--fonte-marca), ui-sans-serif, system-ui, sans-serif;
  }

  /* Foco visível e consistente. Antes cada componente resolvia por conta —
     inputs com anel, botões e links com nada. */
  :focus-visible {
    outline: 2px solid rgb(var(--brand-texto));
    outline-offset: 2px;
    border-radius: 4px;
  }
}

@layer components {
  /* Pílula de status da OS. Vive aqui, e não em classes do Tailwind espalhadas,
     porque as duas versões de tema precisam sair do mesmo lugar. */
  .status {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.25rem;
    white-space: nowrap;
    box-shadow: inset 0 0 0 1px var(--anel);
    background-color: var(--bg);
    color: var(--fg);
  }
  .status-aberta    { --bg: rgb(var(--st-aberta-bg));    --fg: rgb(var(--st-aberta-fg));    --anel: rgb(var(--st-aberta-anel)); }
  .status-andamento { --bg: rgb(var(--st-andamento-bg)); --fg: rgb(var(--st-andamento-fg)); --anel: rgb(var(--st-andamento-anel)); }
  .status-peca      { --bg: rgb(var(--st-peca-bg));      --fg: rgb(var(--st-peca-fg));      --anel: rgb(var(--st-peca-anel)); }
  .status-entregue  { --bg: rgb(var(--st-entregue-bg));  --fg: rgb(var(--st-entregue-fg));  --anel: rgb(var(--st-entregue-anel)); }
  .status-inerte    { --bg: rgb(var(--st-inerte-bg));    --fg: rgb(var(--st-inerte-fg));    --anel: rgb(var(--st-inerte-anel)); }

  /* Faixa de tempo em aberto. `--ponto` colore a bolinha que antecede o rótulo. */
  .idade {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    border-radius: 9999px;
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    background-color: var(--bg);
    color: var(--fg);
  }
  .idade-0 { --bg: rgb(var(--idade-0-bg)); --fg: rgb(var(--idade-0-fg)); --ponto: rgb(var(--idade-0-ponto)); }
  .idade-1 { --bg: rgb(var(--idade-1-bg)); --fg: rgb(var(--idade-1-fg)); --ponto: rgb(var(--idade-1-ponto)); }
  .idade-2 { --bg: rgb(var(--idade-2-bg)); --fg: rgb(var(--idade-2-fg)); --ponto: rgb(var(--idade-2-ponto)); }
  .idade-3 { --bg: rgb(var(--idade-3-bg)); --fg: rgb(var(--idade-3-fg)); --ponto: rgb(var(--idade-3-ponto)); }
  .idade-4 { --bg: rgb(var(--idade-4-bg)); --fg: rgb(var(--idade-4-fg)); --ponto: rgb(var(--idade-4-ponto)); }
  .idade-ponto { display: inline-block; width: 0.375rem; height: 0.375rem; border-radius: 9999px; background-color: var(--ponto); }

  /* Esqueleto de carregamento — reserva a altura para a tela não saltar. */
  .esqueleto {
    background-color: rgb(var(--superficie-3));
    border-radius: 0.375rem;
    animation: pulsar 1.4s ease-in-out infinite;
  }
}

@keyframes pulsar {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}

@keyframes drawer-in {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}

@layer utilities {
  .animate-in {
    animation: drawer-in 0.2s ease-out;
  }

  /* Área segura do iPhone: barras coladas no rodapé precisam do respiro do
     indicador de home, senão o botão fica sob a faixa do sistema. */
  .pb-segura { padding-bottom: env(safe-area-inset-bottom, 0px); }
  .mb-segura { margin-bottom: env(safe-area-inset-bottom, 0px); }
  .h-barra-inferior { height: calc(3.5rem + env(safe-area-inset-bottom, 0px)); }
  .pt-segura { padding-top: env(safe-area-inset-top, 0px); }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgb(var(--linha-forte));
    border-radius: 3px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media print {
  .no-print {
    display: none !important;
  }

  /* O documento impresso é sempre claro, mesmo com o app em tema escuro. */
  :root {
    --superficie: 255 255 255;
    --superficie-2: 245 247 249;
    --superficie-3: 232 236 240;
    --tinta: 20 24 29;
    --tinta-2: 61 71 82;
    --tinta-3: 91 104 117;
    --linha: 220 226 232;
    --linha-forte: 195 204 213;
    --brand-50: 255 250 240;
    --brand-100: 255 245 223;
    --brand-200: 255 237 196;
    --brand-300: 255 226 157;
    --brand-texto: 150 105 0;
  }

  /* Impresso é papel branco: o número volta à versão escura da cor. */
  .documento {
    --doc-texto: var(--doc-texto-claro) !important;
  }

  body {
    background: #ffffff !important;
  }

  /* Esconde elementos do layout (sidebar etc.) que não fazem parte do documento */
  .print-hide-layout {
    display: none !important;
  }

  .print-doc {
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
  }

  /* Fotos vão em páginas próprias, fora do ajuste A4 aplicado ao .print-doc */
  .print-fotos {
    break-before: page;
    page-break-before: always;
  }

  .print-fotos img {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  @page {
    margin: 14mm;
  }
}
```

### tailwind.config.ts

```ts
import type { Config } from "tailwindcss";

const marca = (passo: string) => `rgb(var(--brand-${passo}) / <alpha-value>)`;
const cor = (nome: string) => `rgb(var(--${nome}) / <alpha-value>)`;

const config: Config = {
  // O tema escuro é resolvido por variáveis CSS em globals.css, não pela variante
  // `dark:` do Tailwind — assim nenhum componente precisa declarar duas cores.
  // O seletor fica aqui só para plugins que perguntem por ele.
  darkMode: ["class", '[data-tema="escuro"]'],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    // `src/lib` também: é lá que ficam as tabelas de domínio que devolvem classe
    // pronta — `corStatus` e `corMargem`, por exemplo. Sem esta linha o Tailwind
    // não enxerga `status-peca` em lugar nenhum e remove a pílula do CSS, e o
    // status da OS sai sem cor de fundo.
    "./src/lib/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Laranja do boxOS, fixo para todas as oficinas. A escala e as trocas do
        // tema escuro moram em globals.css.
        brand: {
          50: marca("50"),
          100: marca("100"),
          200: marca("200"),
          300: marca("300"),
          400: marca("400"),
          500: marca("500"),
          600: marca("600"),
          700: marca("700"),
          800: marca("800"),
          900: marca("900"),
          950: marca("950"),
          DEFAULT: marca("600"),
          // Texto legível sobre a cor da marca (tinta escura sobre o laranja).
          fg: "rgb(var(--brand-fg) / <alpha-value>)",
          // A marca usada como texto sobre a superfície (link, número da OS, aba
          // ativa): escurecida no tema claro até ler bem sobre branco.
          texto: "rgb(var(--brand-texto) / <alpha-value>)",
        },
        // Cor da oficina, só dentro da folha do documento (classe `documento`).
        doc: {
          DEFAULT: cor("doc-cor"),
          texto: cor("doc-texto"),
        },
        // Menu lateral: branco no tema claro, grafite no escuro.
        menu: {
          DEFAULT: cor("menu-bg"),
          fg: cor("menu-fg"),
          texto: cor("menu-texto"),
          borda: cor("menu-borda"),
          hover: cor("menu-hover"),
        },

        // --- neutros semânticos ------------------------------------------------
        // Trocam de valor no tema escuro sem que o componente saiba disso.
        fundo: cor("fundo"),
        superficie: {
          DEFAULT: cor("superficie"),
          2: cor("superficie-2"),
          3: cor("superficie-3"),
        },
        tinta: {
          DEFAULT: cor("tinta"),
          2: cor("tinta-2"),
          3: cor("tinta-3"),
        },
        linha: {
          DEFAULT: cor("linha"),
          forte: cor("linha-forte"),
        },
        contraste: {
          DEFAULT: cor("contraste"),
          fg: cor("contraste-fg"),
        },

        // --- semáforo ----------------------------------------------------------
        // Independentes da marca de propósito: "Excluir" não pode ter a mesma cor
        // de "Nova OS".
        ok: {
          DEFAULT: cor("ok"),
          fraco: cor("ok-fraco"),
          linha: cor("ok-linha"),
          fg: cor("ok-fg"),
        },
        atencao: {
          DEFAULT: cor("atencao"),
          fraco: cor("atencao-fraco"),
          linha: cor("atencao-linha"),
          fg: cor("atencao-fg"),
        },
        perigo: {
          DEFAULT: cor("perigo"),
          fraco: cor("perigo-fraco"),
          linha: cor("perigo-linha"),
          fg: cor("perigo-fg"),
        },
      },
      spacing: {
        // Altura da barra de navegação inferior do celular, usada pelo respiro
        // que as telas reservam para não terminar embaixo dela.
        "barra-inferior": "3.5rem",
      },
      fontFamily: {
        // Poppins, a fonte da marca boxOS. Só na logo e nos títulos de tela — texto
        // corrido, tabelas e valores continuam na fonte do sistema, que lê melhor
        // número pequeno. A variável é declarada pelo `next/font` no layout raiz.
        marca: ["var(--fonte-marca)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

### src/app/layout.tsx — Poppins e variável de fonte

_Trecho do arquivo; `// …` marca o que foi pulado._

```tsx
import { Poppins } from "next/font/google";

// …

import "./globals.css";

// …

// Fonte da marca boxOS, só para a logo e os títulos (ver `font-marca` no Tailwind).
// O `next/font` baixa o arquivo no build e o serve daqui — o navegador não chama o Google.
const poppins = Poppins({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--fonte-marca",
});

// …

  return (
    <html lang="pt-BR" className={poppins.variable}>
      <head>
        {/* Claro ou escuro antes da primeira pintura — senão a tela nasce
            branca e pisca para escura no primeiro render. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      {/* `100dvh` em vez de `100vh`: no iOS a unidade antiga conta a altura com a
          barra de endereço escondida, e o fim de cada tela ficava cortado. */}
      <body className="min-h-[100dvh] bg-fundo text-tinta antialiased">
```

## 3. Marca

O laranja `#F2A900` e o grafite `#1E2329` saem de `LogoBoxOS.tsx`. Os SVGs abaixo são os arquivos do pacote de identidade, copiados em `public/brand/`.

### src/components/marca/LogoBoxOS.tsx

```tsx
// Marca do sistema (boxOS). A logo da oficina só aparece nos documentos que ela emite;
// menu, telas de entrada, aba do navegador e ícone do app são sempre boxOS.
//
// Desenho copiado do pacote de identidade (boxOS_logo_pacote_v3, pasta svg/). A moldura
// e o anel são sempre amarelos; as hastes e o "box" seguem `currentColor`. Assim a mesma
// logo vira a versão "fundo escuro" num menu escuro e a versão principal num menu claro,
// sem precisar escolher entre dois arquivos.

import { cn } from "@/lib/utils";

// As cores do boxOS são fixas e valem no sistema inteiro (os documentos levam a cor da
// oficina — ver `lib/cor-documento.ts`). Na tela elas chegam pelos tokens
// `brand-*`/`menu-*` de globals.css; estas constantes servem a quem não lê CSS (SVG da
// logo, metadados do navegador).
export const AMARELO_BOXOS = "#F2A900";
export const GRAFITE_BOXOS = "#1E2329";

/** O elevador de box, nas coordenadas originais do pacote (72 × 60). */
function Desenho({ corHastes }: { corHastes: string }) {
  return (
    <>
      <path
        d="M2 54 V11 Q2 3 10 3 H62 Q70 3 70 11 V54 L63 58 V10 H9 V58 Z"
        fill={AMARELO_BOXOS}
      />
      <g fill={corHastes}>
        <rect x="15" y="18" width="4.5" height="38" />
        <rect x="52.5" y="18" width="4.5" height="38" />
        <rect x="13.5" y="16" width="7.5" height="3.5" rx="1" />
        <rect x="51" y="16" width="7.5" height="3.5" rx="1" />
        <rect x="12.5" y="54.5" width="9.5" height="3.5" rx="1" />
        <rect x="50" y="54.5" width="9.5" height="3.5" rx="1" />
        <rect x="19" y="38" width="9" height="3.8" rx="1" />
        <rect x="44" y="38" width="9" height="3.8" rx="1" />
        <rect x="24.2" y="35" width="4" height="5.5" rx="0.8" />
        <rect x="43.8" y="35" width="4" height="5.5" rx="0.8" />
      </g>
      <circle cx="36" cy="27.3" r="8.5" fill="none" stroke={AMARELO_BOXOS} strokeWidth="6" />
    </>
  );
}

/** Só o símbolo. O tamanho vem do `className` (`h-8 w-8`, por exemplo). */
export function SimboloBoxOS({ className }: { className?: string }) {
  return (
    // viewBox justo no desenho — o do pacote tem respiro que desalinharia o símbolo
    // do texto ao lado.
    <svg viewBox="1 2 70 57" aria-hidden className={cn("shrink-0", className)}>
      <Desenho corHastes="currentColor" />
    </svg>
  );
}

/** Ícone de app: o símbolo sobre o quadrado grafite arredondado. */
export function IconeBoxOS({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="boxOS" className={cn("shrink-0", className)}>
      <rect width="64" height="64" rx="14" fill={GRAFITE_BOXOS} />
      <g transform="translate(9.3 11.5) scale(0.63)">
        <Desenho corHastes="#FFFFFF" />
      </g>
    </svg>
  );
}

/**
 * Símbolo + "boxOS". Tudo em `em`: o tamanho do texto no `className` (`text-xl`,
 * `text-3xl`...) define o tamanho da logo inteira, mantendo a proporção do pacote.
 */
export function LogoBoxOS({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="boxOS"
      className={cn("inline-flex shrink-0 items-center gap-[0.25em] leading-none", className)}
    >
      {/* Largura explícita (70/57 da altura): `w-auto` em SVG inline cai em 300px
          em alguns navegadores. */}
      <SimboloBoxOS className="h-[1.15em] w-[1.41em]" />
      <span aria-hidden className="font-marca font-bold tracking-[-0.01em]">
        box<span style={{ color: AMARELO_BOXOS }}>OS</span>
      </span>
    </span>
  );
}
```

### public/brand/boxOS_horizontal.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="422" viewBox="0 0 250 66"><g transform="translate(2 3)"><path d="M2 54 V11 Q2 3 10 3 H62 Q70 3 70 11 V54 L63 58 V10 H9 V58 Z" fill="#F2A900"/>
<g fill="#1E2329">
<rect x="15" y="18" width="4.5" height="38"/><rect x="52.5" y="18" width="4.5" height="38"/>
<rect x="13.5" y="16" width="7.5" height="3.5" rx="1"/><rect x="51" y="16" width="7.5" height="3.5" rx="1"/>
<rect x="12.5" y="54.5" width="9.5" height="3.5" rx="1"/><rect x="50" y="54.5" width="9.5" height="3.5" rx="1"/>
<rect x="19" y="38" width="9" height="3.8" rx="1"/><rect x="44" y="38" width="9" height="3.8" rx="1"/>
<rect x="24.2" y="35" width="4" height="5.5" rx="0.8"/><rect x="43.8" y="35" width="4" height="5.5" rx="0.8"/>
</g><circle cx="36" cy="27.3" r="8.5" fill="none" stroke="#F2A900" stroke-width="6"/></g><text x="86" y="54" font-family="Poppins" font-weight="700" font-size="48" fill="#1E2329" letter-spacing="-0.5">box<tspan fill="#F2A900">OS</tspan></text></svg>
```

### public/brand/boxOS_horizontal_fundo_escuro.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="422" viewBox="0 0 250 66"><g transform="translate(2 3)"><path d="M2 54 V11 Q2 3 10 3 H62 Q70 3 70 11 V54 L63 58 V10 H9 V58 Z" fill="#F2A900"/>
<g fill="#FFFFFF">
<rect x="15" y="18" width="4.5" height="38"/><rect x="52.5" y="18" width="4.5" height="38"/>
<rect x="13.5" y="16" width="7.5" height="3.5" rx="1"/><rect x="51" y="16" width="7.5" height="3.5" rx="1"/>
<rect x="12.5" y="54.5" width="9.5" height="3.5" rx="1"/><rect x="50" y="54.5" width="9.5" height="3.5" rx="1"/>
<rect x="19" y="38" width="9" height="3.8" rx="1"/><rect x="44" y="38" width="9" height="3.8" rx="1"/>
<rect x="24.2" y="35" width="4" height="5.5" rx="0.8"/><rect x="43.8" y="35" width="4" height="5.5" rx="0.8"/>
</g><circle cx="36" cy="27.3" r="8.5" fill="none" stroke="#F2A900" stroke-width="6"/></g><text x="86" y="54" font-family="Poppins" font-weight="700" font-size="48" fill="#FFFFFF" letter-spacing="-0.5">box<tspan fill="#F2A900">OS</tspan></text></svg>
```

### public/brand/boxOS_horizontal_mono_branco.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="422" viewBox="0 0 250 66"><g transform="translate(2 3)"><path d="M2 54 V11 Q2 3 10 3 H62 Q70 3 70 11 V54 L63 58 V10 H9 V58 Z" fill="#FFFFFF"/>
<g fill="#FFFFFF">
<rect x="15" y="18" width="4.5" height="38"/><rect x="52.5" y="18" width="4.5" height="38"/>
<rect x="13.5" y="16" width="7.5" height="3.5" rx="1"/><rect x="51" y="16" width="7.5" height="3.5" rx="1"/>
<rect x="12.5" y="54.5" width="9.5" height="3.5" rx="1"/><rect x="50" y="54.5" width="9.5" height="3.5" rx="1"/>
<rect x="19" y="38" width="9" height="3.8" rx="1"/><rect x="44" y="38" width="9" height="3.8" rx="1"/>
<rect x="24.2" y="35" width="4" height="5.5" rx="0.8"/><rect x="43.8" y="35" width="4" height="5.5" rx="0.8"/>
</g><circle cx="36" cy="27.3" r="8.5" fill="none" stroke="#FFFFFF" stroke-width="6"/></g><text x="86" y="54" font-family="Poppins" font-weight="700" font-size="48" fill="#FFFFFF" letter-spacing="-0.5">box<tspan fill="#FFFFFF">OS</tspan></text></svg>
```

### public/brand/boxOS_horizontal_mono_preto.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="422" viewBox="0 0 250 66"><g transform="translate(2 3)"><path d="M2 54 V11 Q2 3 10 3 H62 Q70 3 70 11 V54 L63 58 V10 H9 V58 Z" fill="#000"/>
<g fill="#000">
<rect x="15" y="18" width="4.5" height="38"/><rect x="52.5" y="18" width="4.5" height="38"/>
<rect x="13.5" y="16" width="7.5" height="3.5" rx="1"/><rect x="51" y="16" width="7.5" height="3.5" rx="1"/>
<rect x="12.5" y="54.5" width="9.5" height="3.5" rx="1"/><rect x="50" y="54.5" width="9.5" height="3.5" rx="1"/>
<rect x="19" y="38" width="9" height="3.8" rx="1"/><rect x="44" y="38" width="9" height="3.8" rx="1"/>
<rect x="24.2" y="35" width="4" height="5.5" rx="0.8"/><rect x="43.8" y="35" width="4" height="5.5" rx="0.8"/>
</g><circle cx="36" cy="27.3" r="8.5" fill="none" stroke="#000" stroke-width="6"/></g><text x="86" y="54" font-family="Poppins" font-weight="700" font-size="48" fill="#000" letter-spacing="-0.5">box<tspan fill="#000">OS</tspan></text></svg>
```

### public/brand/boxOS_icone_app.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1E2329"/><g transform="translate(9.3 11.5) scale(0.63)"><path d="M2 54 V11 Q2 3 10 3 H62 Q70 3 70 11 V54 L63 58 V10 H9 V58 Z" fill="#F2A900"/>
<g fill="#FFFFFF">
<rect x="15" y="18" width="4.5" height="38"/><rect x="52.5" y="18" width="4.5" height="38"/>
<rect x="13.5" y="16" width="7.5" height="3.5" rx="1"/><rect x="51" y="16" width="7.5" height="3.5" rx="1"/>
<rect x="12.5" y="54.5" width="9.5" height="3.5" rx="1"/><rect x="50" y="54.5" width="9.5" height="3.5" rx="1"/>
<rect x="19" y="38" width="9" height="3.8" rx="1"/><rect x="44" y="38" width="9" height="3.8" rx="1"/>
<rect x="24.2" y="35" width="4" height="5.5" rx="0.8"/><rect x="43.8" y="35" width="4" height="5.5" rx="0.8"/>
</g><circle cx="36" cy="27.3" r="8.5" fill="none" stroke="#F2A900" stroke-width="6"/></g></svg>
```

### public/brand/boxOS_simbolo.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 -6 72 72"><path d="M2 54 V11 Q2 3 10 3 H62 Q70 3 70 11 V54 L63 58 V10 H9 V58 Z" fill="#F2A900"/>
<g fill="#1E2329">
<rect x="15" y="18" width="4.5" height="38"/><rect x="52.5" y="18" width="4.5" height="38"/>
<rect x="13.5" y="16" width="7.5" height="3.5" rx="1"/><rect x="51" y="16" width="7.5" height="3.5" rx="1"/>
<rect x="12.5" y="54.5" width="9.5" height="3.5" rx="1"/><rect x="50" y="54.5" width="9.5" height="3.5" rx="1"/>
<rect x="19" y="38" width="9" height="3.8" rx="1"/><rect x="44" y="38" width="9" height="3.8" rx="1"/>
<rect x="24.2" y="35" width="4" height="5.5" rx="0.8"/><rect x="43.8" y="35" width="4" height="5.5" rx="0.8"/>
</g><circle cx="36" cy="27.3" r="8.5" fill="none" stroke="#F2A900" stroke-width="6"/></svg>
```

### public/brand/favicon_16.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="3.5" fill="#1E2329"/>
<path d="M1.5 14 V4 Q1.5 2 3.5 2 H12.5 Q14.5 2 14.5 4 V14 H12.5 V4 H3.5 V14 Z" fill="#F2A900"/>
<g fill="#FFFFFF"><rect x="4.5" y="6" width="1.5" height="8"/><rect x="10" y="6" width="1.5" height="8"/><rect x="5.5" y="11" width="1.8" height="1.3"/><rect x="8.7" y="11" width="1.8" height="1.3"/></g>
<circle cx="8" cy="8.6" r="2.2" fill="#F2A900"/></svg>
```

### src/components/ui/Icones.tsx

```tsx
// Ícones do sistema.
//
// Existem porque metade da interface desenhava seta, fechar e alerta com
// caracteres de texto — ←, →, ✕, ▲, ▼, ⚠, ✓ — em dezesseis arquivos. Cada
// plataforma desenha esses glifos num peso e num alinhamento diferentes, e
// nenhum combinava com os SVG que o projeto já mantinha na Sidebar e no
// ClienteSelect. Agora é um traço só, herdando `currentColor` e o tamanho do
// contexto.

type Props = {
  /** Lado do quadrado do ícone, em px. */
  tamanho?: number;
  className?: string;
};

function Base({
  tamanho = 16,
  className,
  children,
  preenchido = false,
}: Props & { children: React.ReactNode; preenchido?: boolean }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill={preenchido ? "currentColor" : "none"}
      stroke={preenchido ? "none" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

export const SetaEsquerda = (p: Props) => (
  <Base {...p}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </Base>
);

export const SetaDireita = (p: Props) => (
  <Base {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Base>
);

export const Voltar = (p: Props) => (
  <Base {...p}>
    <path d="m15 18-6-6 6-6" />
  </Base>
);

export const Avancar = (p: Props) => (
  <Base {...p}>
    <path d="m9 18 6-6-6-6" />
  </Base>
);

export const Fechar = (p: Props) => (
  <Base {...p}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Base>
);

export const Chevron = (p: Props) => (
  <Base {...p}>
    <path d="m6 9 6 6 6-6" />
  </Base>
);

export const Alerta = (p: Props) => (
  <Base {...p}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Base>
);

export const Confere = (p: Props) => (
  <Base {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Base>
);

export const Busca = (p: Props) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Base>
);

export const Lixeira = (p: Props) => (
  <Base {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </Base>
);

export const Lapis = (p: Props) => (
  <Base {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Base>
);

export const Desfazer = (p: Props) => (
  <Base {...p}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
  </Base>
);

export const Olho = ({ fechado, ...p }: Props & { fechado?: boolean }) => (
  <Base {...p}>
    {fechado ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <path d="m1 1 22 22" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </Base>
);

export const Engrenagem = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Base>
);

export const Sair = (p: Props) => (
  <Base {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Base>
);

export const Menu = (p: Props) => (
  <Base {...p}>
    <path d="M3 6h18" />
    <path d="M3 12h18" />
    <path d="M3 18h18" />
  </Base>
);

export const Sino = (p: Props) => (
  <Base {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Base>
);

export const Mais = (p: Props) => (
  <Base {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Base>
);

/* --- ícones da barra de navegação do celular ------------------------------- */

export const Patio = (p: Props) => (
  <Base {...p}>
    <path d="M5 17h14" />
    <path d="M6.5 17V9.5L8 6h8l1.5 3.5V17" />
    <path d="M5 9.5h14" />
    <circle cx="8" cy="17" r="1.6" />
    <circle cx="16" cy="17" r="1.6" />
  </Base>
);

export const Dinheiro = (p: Props) => (
  <Base {...p}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 12h.01" />
    <path d="M18 12h.01" />
  </Base>
);

export const Recibo = (p: Props) => (
  <Base {...p}>
    <path d="M5 3v18l2.5-1.6L10 21l2-1.6L14 21l2.5-1.6L19 21V3z" />
    <path d="M9 8h6" />
    <path d="M9 12h6" />
  </Base>
);

/** Dinheiro saindo — a aba de Gastos, para não repetir o ícone de Dinheiro (entrada)
 *  nem o de Menu (hambúrguer), que ficavam emprestados de outras abas. */
export const Despesa = (p: Props) => (
  <Base {...p}>
    <path d="M12 2v13" />
    <path d="m7 11 5 5 5-5" />
    <path d="M4 21h16" />
  </Base>
);

/* --- ícones do menu lateral -------------------------------------------------
   Existem pelo mesmo motivo de `Despesa`: no menu, Clientes, Contas a receber e
   Caixa desenhavam a mesma nota de dinheiro, Gastos repetia o recibo das OS e
   Mecânicos usava o hambúrguer do próprio botão de menu. Ícone que se repete não
   distingue nada — quem procura "Caixa" acaba lendo os sete rótulos. */

/** Clientes. */
export const Pessoas = (p: Props) => (
  <Base {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Base>
);

/** Mecânicos — chave de boca. */
export const Chave = (p: Props) => (
  <Base {...p}>
    <path d="M14.7 6.3a4.5 4.5 0 0 0 5.9 5.9l-8 8a2.8 2.8 0 0 1-4-4l8-8a4.5 4.5 0 0 0-1.9-1.9Z" />
  </Base>
);

/** Estoque — caixa de peça na prateleira. */
export const Caixa = (p: Props) => (
  <Base {...p}>
    <path d="M21 8v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
    <rect x="2" y="4" width="20" height="4" rx="1" />
    <path d="M10 12h4" />
  </Base>
);

/** Caixa — o cofre da oficina. */
export const Cofre = (p: Props) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="15" rx="2" />
    <circle cx="10.5" cy="11.5" r="3.5" />
    <path d="M10.5 11.5h.01" />
    <path d="M18 9.5v4" />
    <path d="M6 19v2" />
    <path d="M18 19v2" />
  </Base>
);

/* --- tema ------------------------------------------------------------------ */

export const Sol = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Base>
);

export const Lua = (p: Props) => (
  <Base {...p}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </Base>
);

export const Monitor = (p: Props) => (
  <Base {...p}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
  </Base>
);

// ── Barra de formatação de texto ───────────────────────────────────────────

export const Negrito = (p: Props) => (
  <Base {...p}>
    <path d="M6 12h9a4 4 0 0 1 0 8H6V4h8a4 4 0 0 1 0 8" />
  </Base>
);

export const Titulo = (p: Props) => (
  <Base {...p}>
    <path d="M6 12h12" />
    <path d="M6 20V4" />
    <path d="M18 20V4" />
  </Base>
);

export const ListaMarcadores = (p: Props) => (
  <Base {...p}>
    <path d="M9 6h11" />
    <path d="M9 12h11" />
    <path d="M9 18h11" />
    <circle cx="4" cy="6" r="1" />
    <circle cx="4" cy="12" r="1" />
    <circle cx="4" cy="18" r="1" />
  </Base>
);

export const ListaNumerada = (p: Props) => (
  <Base {...p}>
    <path d="M10 6h11" />
    <path d="M10 12h11" />
    <path d="M10 18h11" />
    <path d="M4 6h1v4" />
    <path d="M4 10h2" />
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
  </Base>
);
```

### src/components/ui/Botao.tsx

```tsx
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Botão do sistema.
 *
 * Duas regras que a interface não seguia:
 *
 * 1. Alvo de toque. Trinta e quatro botões usavam `px-2.5 py-1.5 text-xs`, que dá
 *    cerca de 30 px — e eram justamente os de dinheiro: Receber, Pagar, Estornar,
 *    Excluir. Aqui o mínimo é 44 px no celular; o tamanho `denso` encolhe só a
 *    partir de `sm`, onde existe mouse.
 *
 * 2. Ação destrutiva nunca é sólida. Numa oficina de identidade vermelha, um
 *    "Excluir" preenchido fica igual a "Nova OS". Perigo é sempre contornado.
 */

const VARIANTES = {
  primario: "border-transparent bg-brand-600 text-brand-fg hover:bg-brand-700",
  secundario: "border-linha-forte bg-superficie text-tinta-2 hover:bg-superficie-2",
  contraste: "border-transparent bg-contraste text-contraste-fg hover:opacity-90",
  sucesso: "border-transparent bg-ok text-ok-fg hover:opacity-90",
  perigo: "border-perigo-linha bg-superficie text-perigo hover:bg-perigo-fraco",
  fantasma: "border-transparent bg-transparent text-tinta-2 hover:bg-superficie-2",
} as const;

const TAMANHOS = {
  // Padrão: confortável no dedo em qualquer tela.
  normal: "min-h-11 px-4 py-2 text-sm",
  // Denso: 44 px no celular, 36 px onde há mouse. Para linhas de lista.
  denso: "min-h-11 px-3 py-2 text-sm sm:min-h-9 sm:px-2.5 sm:py-1.5 sm:text-xs",
  // Ícone quadrado.
  icone: "h-11 w-11 p-0 sm:h-9 sm:w-9",
} as const;

export type VarianteBotao = keyof typeof VARIANTES;
export type TamanhoBotao = keyof typeof TAMANHOS;

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

export function classesBotao(
  variante: VarianteBotao = "primario",
  tamanho: TamanhoBotao = "normal",
  className?: string
) {
  return cn(BASE, VARIANTES[variante], TAMANHOS[tamanho], className);
}

export function Botao({
  variante = "primario",
  tamanho = "normal",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
}) {
  return <button {...props} className={classesBotao(variante, tamanho, className)} />;
}

/** Mesma aparência do botão, para quando a ação é navegar. */
export function BotaoLink({
  variante = "primario",
  tamanho = "normal",
  className,
  ...props
}: React.ComponentProps<typeof Link> & {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
}) {
  return <Link {...props} className={classesBotao(variante, tamanho, className)} />;
}
```

### src/lib/constants.ts — corStatus() e OS_STATUS

_Trecho do arquivo; `// …` marca o que foi pulado._

```ts
// Ciclo de vida da OS. `ENTREGUE` é o único marco de conclusão que existe: é a data
// de entrega que decide em que semana/mês o serviço conta como produção.
//
// `PRONTA` e `FECHADA` foram removidas do fluxo: as duas tentavam codificar
// "terminei mas ainda não recebi" num campo que não é sobre dinheiro. Recebimento
// já é um eixo separado (`pago` / `valorPago`), então OS entregue e não paga é
// representável sem precisar de status próprio.
// A cor é uma escala de significado, não degraus de um cinza só. Antes os quatro
// status vivos eram zinc-100/200/300 e um preto: distinguir o carro travado
// esperando peça do carro já entregue exigia ler pílula por pílula, que é
// exatamente o trabalho que a cor deveria poupar numa lista de vinte OS.
//
// Agora cada estado tem matiz próprio, e o peso segue a urgência:
//   Ag. Peça    âmbar com anel saturado — é o único bloqueado, esperando decisão
//   Em Andamento azul — trabalho acontecendo, estado normal do pátio
//   Aberta      neutro — chegou, ninguém pôs a mão ainda
//   Entregue    verde discreto — encerrado, deve recuar
//   Cancelada   apagado — existe, mas não é trabalho
//
// As classes moram em globals.css porque cada uma precisa de um valor no tema
// claro e outro no escuro.
export const OS_STATUS = [
  { value: "ABERTA", label: "Aberta", cor: "status status-aberta" },
  { value: "EM_ANDAMENTO", label: "Em andamento", cor: "status status-andamento" },
  { value: "AGUARDANDO_PECA", label: "Ag. peça", cor: "status status-peca" },
  { value: "ENTREGUE", label: "Entregue", cor: "status status-entregue" },
  { value: "CANCELADA", label: "Cancelada", cor: "status status-inerte" },
] as const;

// …

export function corStatus(status: string): string {
  return OS_STATUS.find((s) => s.value === status)?.cor ?? "status status-inerte";
}
```

### src/lib/cor-documento.ts

```ts
// Cor da oficina nos documentos que ela emite (OS, orçamento, comprovante).
//
// É o único lugar onde a oficina escolhe cor: o sistema em si é sempre laranja boxOS
// (globals.css). Nos documentos a cor marca o filete do cabeçalho e o número, ao lado
// da logo da oficina. Arquivo puro, sem Prisma — os PDFs e a tela usam os mesmos derivados.

import type { CSSProperties } from "react";

export const COR_DOCUMENTO_PADRAO = "#f2a900"; // laranja boxOS

/** Sugestões prontas para quem não tem a cor da marca na ponta da língua. */
export const PALETA_DOCUMENTO = [
  { nome: "boxOS", cor: "#f2a900" },
  { nome: "Vermelho", cor: "#dc2626" },
  { nome: "Laranja", cor: "#ea580c" },
  { nome: "Verde", cor: "#16a34a" },
  { nome: "Teal", cor: "#0d9488" },
  { nome: "Azul", cor: "#2563eb" },
  { nome: "Índigo", cor: "#4f46e5" },
  { nome: "Roxo", cor: "#7c3aed" },
  { nome: "Rosa", cor: "#db2777" },
  { nome: "Grafite", cor: "#3f3f46" },
] as const;

const HEX = /^#[0-9a-fA-F]{6}$/;

export function corValida(valor: unknown): valor is string {
  return typeof valor === "string" && HEX.test(valor.trim());
}

/** Cor utilizável ou o padrão — nunca deixa texto solto virar CSS. */
export function normalizaCor(valor: unknown): string {
  return corValida(valor) ? valor.trim().toLowerCase() : COR_DOCUMENTO_PADRAO;
}

type RGB = { r: number; g: number; b: number }; // 0-255
type HSL = { h: number; s: number; l: number }; // h 0-360, s/l 0-100

function hexParaRgb(hex: string): RGB {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbParaHex({ r, g, b }: RGB): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

function rgbParaHsl({ r, g, b }: RGB): HSL {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslParaRgb({ h, s, l }: HSL): RGB {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0]
    : h < 120 ? [x, c, 0]
    : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c]
    : h < 300 ? [x, 0, c]
    : [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function luminancia({ r, g, b }: RGB): number {
  const canal = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a: RGB, b: RGB): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

// O papel é branco; na tela, no tema escuro, a folha fica na `--superficie` escura.
const PAPEL: RGB = { r: 255, g: 255, b: 255 };
const FOLHA_ESCURA: RGB = { r: 22, g: 29, b: 36 };
// Um pouco acima do 4,5:1 do AA, para o número da OS ler bem em qualquer cor.
const CONTRASTE_TEXTO = 4.8;

/**
 * A cor no tom mais próximo que ainda se lê como texto sobre o fundo: escurece
 * (papel) ou clareia (folha escura) só o necessário. Vermelho e azul saem quase
 * iguais; o laranja boxOS vira um âmbar escuro — puro, ele dá 2:1 sobre branco.
 */
function comoTexto(hex: string, fundo: RGB, sentido: 1 | -1): RGB {
  const hsl = rgbParaHsl(hexParaRgb(hex));
  let cor = hexParaRgb(hex);
  for (let l = hsl.l; l >= 0 && l <= 100; l += sentido) {
    cor = hslParaRgb({ ...hsl, l });
    if (contraste(cor, fundo) >= CONTRASTE_TEXTO) break;
  }
  return cor;
}

/** A cor do documento como texto sobre o papel branco — o número da OS no PDF. */
export function corDeTextoNoPapel(hex: string): string {
  return rgbParaHex(comoTexto(normalizaCor(hex), PAPEL, -1));
}

const triplo = ({ r, g, b }: RGB) => `${r} ${g} ${b}`;

/**
 * Variáveis da folha do documento na tela, para o `style` do elemento com a classe
 * `documento`. Quem escolhe entre a versão clara e a noturna do texto é globals.css,
 * conforme o tema.
 */
export function estiloDoDocumento(hex: string | null | undefined): CSSProperties {
  const cor = normalizaCor(hex);
  return {
    "--doc-cor": triplo(hexParaRgb(cor)),
    "--doc-texto-claro": triplo(comoTexto(cor, PAPEL, -1)),
    "--doc-texto-noturno": triplo(comoTexto(cor, FOLHA_ESCURA, 1)),
  } as CSSProperties;
}
```

## 4. Telas do vídeo — 4.0 Componentes compartilhados

As telas estão nas partes 2 a 4. Aqui ficam os componentes que mais de uma delas usa: a casca do app (menu lateral, barra do celular), os blocos de métrica, os campos, o modal, os avisos, a descrição formatada, o botão "Copiar carro" e os utilitários de formatação.

### src/app/layout.tsx — casca do app (menu + conteúdo)

_Trecho do arquivo; `// …` marca o que foi pulado._

```tsx
async function AppComMenu({
  usuario,
  config,
  children,
}: {
  usuario: NonNullable<Awaited<ReturnType<typeof getUsuarioAtual>>>;
  config: Awaited<ReturnType<typeof getConfiguracao>>;
  children: React.ReactNode;
}) {
  // [removido: busca de dados] — `pendingCount`: OS entregues sem quitar + dívidas avulsas
  // abertas (o contador vermelho do menu). Dados fictícios: `sidebar.pendingCount`.

  // Quem rola agora é o documento, não um `main` de altura travada.
  //
  // O shell era `h-screen overflow-hidden` com a rolagem dentro do `main`, e isso
  // custava duas coisas no celular: a barra de endereço nunca recolhia, porque a
  // página em si não rolava, e `position: sticky` media a partir do topo do
  // `main` — que fica atrás do cabeçalho fixo.
  //
  // O respiro no rodapé é a altura da barra de navegação do celular mais a área
  // segura do aparelho, para nenhuma tela terminar embaixo dela.
  return (
    <>
      <Sidebar
        pendingCount={pendingCount}
        nome={nomeDoMenu(config)}
        usuario={{ nome: usuario.nome, papel: usuario.papel, podeFinanceiro: usuario.podeFinanceiro }}
      />
      <main className="pt-14 pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))] md:pb-0 md:pl-56 md:pt-0">
        <AvisoDePlano usuario={usuario} />
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <BloqueioDeAcao />
    </>
  );
}
```

### src/components/Sidebar.tsx

_Lógica de dados removida (comentários `// [removido: …]`); JSX, classes e estrutura intactos._

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { labelPapel, type Papel } from "@/lib/permissoes";
import { LogoBoxOS, SimboloBoxOS } from "./marca/LogoBoxOS";
import { BarraInferior } from "./ui/BarraInferior";
import { NotificacaoSino } from "./ui/Notificacoes";
import { usePedirSaida } from "./ui/SaidaSegura";
import { SeletorTema } from "./ui/Tema";
import {
  Caixa,
  Chave,
  Chevron,
  Cofre,
  Despesa,
  Dinheiro,
  Engrenagem,
  Fechar,
  Menu as IconeMenu,
  Patio,
  Pessoas,
  Recibo,
  Sair,
} from "./ui/Icones";

type IconeNav = typeof Patio;

type LinkDef = {
  href: string;
  label: string;
  exact?: boolean;
  badge?: number;
  children?: LinkDef[];
  Icone?: IconeNav;
  /** Só o dono vê. Esconder é conforto; quem barra de verdade é o proxy. */
  dono?: boolean;
  /** Dono ou operador com o checkbox "Financeiro". */
  financeiro?: boolean;
};

export function Sidebar({
  pendingCount = 0,
  nome = "Minha Oficina",
  usuario,
}: {
  pendingCount?: number;
  nome?: string;
  usuario: { nome: string; papel: Papel; podeFinanceiro: boolean };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const pedirSaida = usePedirSaida();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saindo, setSaindo] = useState(false);

  const ehDono = usuario.papel === "ADMIN";

  // Fecha o drawer ao navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Trava o scroll do body e fecha no Escape enquanto o drawer está aberto
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [open]);

  // Um ícone por destino, e o mesmo ícone que a barra inferior do celular usa
  // para o mesmo lugar — quem aprende a nota de dinheiro como "A receber" no
  // celular reencontra a mesma nota no menu do computador.
  const todosOsLinks: LinkDef[] = [
    { href: "/", label: "Dashboard", exact: true, Icone: Patio },
    { href: "/clientes", label: "Clientes", Icone: Pessoas },
    {
      href: "/os",
      label: "Ordens de serviço",
      Icone: Recibo,
      children: [{ href: "/orcamentos", label: "Orçamentos" }],
    },
    {
      href: "/mecanicos",
      label: "Mecânicos",
      Icone: Chave,
      children: [{ href: "/produtividade", label: "Produtividade", dono: true }],
    },
    // Aberto ao operador: é ele que precisa saber se tem a peça na prateleira ao
    // montar a OS. Custo e lucro da tela somem sozinhos — a API os apaga na resposta.
    { href: "/estoque", label: "Estoque", Icone: Caixa },
    {
      href: "/contas-receber",
      label: "Contas a receber",
      badge: pendingCount,
      financeiro: true,
      Icone: Dinheiro,
    },
    { href: "/despesas", label: "Controle de gastos", financeiro: true, Icone: Despesa },
    { href: "/caixa", label: "Caixa", financeiro: true, Icone: Cofre },
  ];

  const permitido = (link: LinkDef) =>
    (ehDono || !link.dono) && (usuario.podeFinanceiro || !link.financeiro);

  const links = todosOsLinks
    .filter(permitido)
    .map((link) => ({ ...link, children: link.children?.filter(permitido) }));

  async function sair() {
    // Sair da conta é o único jeito de deixar a tela que não é um link — sem
    // isto, o logout levaria embora a OS meio preenchida sem perguntar nada.
    if (!(await pedirSaida())) return;
    // [removido: autenticação] — encerrava a sessão (POST /api/auth/logout) e voltava para /login.
  }

  const isLinkActive = (link: LinkDef) =>
    link.exact ? pathname === link.href : pathname.startsWith(link.href);

  const toggleExpand = (href: string) =>
    setExpanded((prev) => ({ ...prev, [href]: !prev[href] }));

  // O menu é do sistema: logo boxOS em cima e a oficina logo abaixo, pequena — a
  // logo da oficina fica para os documentos. As hastes e o "box" seguem a cor do
  // texto do menu: grafite no menu branco do tema claro, brancas no grafite do escuro.
  const brand = (
    <div className="min-w-0 text-menu-fg">
      <LogoBoxOS className="text-2xl" />
      <p className="mt-1.5 truncate text-xs font-medium text-menu-texto">{nome}</p>
    </div>
  );

  // O contador de pendências é perigo, não marca: em laranja ele se confundiria
  // com o item ativo. O anel na cor do fundo o descola do ícone ao lado.
  const contador = (n: number, className?: string) => (
    <span
      className={cn(
        "rounded-full bg-perigo px-1.5 py-0.5 text-center text-xs font-bold text-perigo-fg ring-2 ring-menu",
        className
      )}
    >
      {n > 99 ? "99+" : n}
    </span>
  );

  const nav = (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {links.map((link) => {
        const isActive = isLinkActive(link);
        const childActive = link.children?.some(isLinkActive) ?? false;
        const hasChildren = !!link.children?.length;
        const isExpanded = expanded[link.href] ?? (isActive || childActive);
        const Icone = link.Icone;
        return (
          <div key={link.href}>
            <div
              className={cn(
                "flex items-center rounded-md transition-colors",
                isActive && !childActive
                  ? "bg-brand-600 text-brand-fg"
                  : "text-menu-texto hover:bg-menu-hover hover:text-menu-fg"
              )}
            >
              <Link
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className="flex min-h-11 flex-1 items-center gap-2.5 px-3 py-2.5 text-sm font-medium"
              >
                {Icone && <Icone tamanho={17} className="shrink-0 opacity-80" />}
                <span className="min-w-0 flex-1 truncate">{link.label}</span>
                {link.badge != null && link.badge > 0 && contador(link.badge)}
              </Link>
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleExpand(link.href)}
                  aria-label={isExpanded ? `Recolher ${link.label}` : `Expandir ${link.label}`}
                  aria-expanded={isExpanded}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-current hover:text-menu-fg"
                >
                  <Chevron
                    tamanho={16}
                    className={cn("transition-transform", isExpanded && "rotate-180")}
                  />
                </button>
              )}
            </div>
            {link.children && isExpanded && (
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-menu-borda pl-2">
                {link.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    aria-current={isLinkActive(child) ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center rounded-md px-3 py-2 text-sm transition-colors",
                      isLinkActive(child)
                        ? "bg-brand-600 font-medium text-brand-fg"
                        : "text-menu-texto hover:bg-menu-hover hover:text-menu-fg"
                    )}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  // Quem está logado, tema, configurações (só o dono) e a saída — separados da operação.
  const rodape = (
    <div className="space-y-2 border-t border-menu-borda p-3 pb-segura">
      <SeletorTema />

      {ehDono && (
        <Link
          href="/configuracoes"
          className={cn(
            "flex min-h-11 items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/configuracoes")
              ? "bg-brand-600 text-brand-fg"
              : "text-menu-texto hover:bg-menu-hover hover:text-menu-fg"
          )}
        >
          <Engrenagem tamanho={16} className="shrink-0" />
          Configurações
        </Link>
      )}

      <div className="flex items-center gap-2 rounded-md px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-menu-fg">{usuario.nome}</p>
          <p className="text-xs text-menu-texto">{labelPapel(usuario.papel)}</p>
        </div>
        <button
          type="button"
          onClick={sair}
          disabled={saindo}
          title="Sair"
          aria-label="Sair"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-menu-texto hover:bg-menu-hover hover:text-menu-fg disabled:opacity-50"
        >
          <Sair tamanho={18} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Menu lateral do desktop. Fixo, porque agora quem rola é o documento. */}
      {/* A borda separa o menu branco do fundo no tema claro. */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-menu-borda bg-menu text-menu-fg md:flex">
        <div className="flex items-center justify-between gap-2 border-b border-menu-borda px-4 py-5">
          {brand}
          <NotificacaoSino papel={usuario.papel} className="-mr-1" painelDesktop="esquerda" />
        </div>
        {nav}
        {rodape}
      </aside>

      {/* Barra superior do celular */}
      <header className="no-print fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-menu-borda bg-menu px-4 text-menu-fg md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-menu-texto hover:bg-menu-hover hover:text-menu-fg active:bg-menu-hover"
        >
          <IconeMenu tamanho={22} />
        </button>
        {/* No celular não cabe a logo inteira e o nome: fica o símbolo boxOS. */}
        <span role="img" aria-label="boxOS" className="text-menu-fg">
          <SimboloBoxOS className="h-7 w-[2.15rem]" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight text-menu-fg">
          {nome}
        </span>
        {pendingCount > 0 && (
          <Link href="/contas-receber" aria-label={`${pendingCount} contas a receber`}>
            {contador(pendingCount, "shrink-0")}
          </Link>
        )}
        <NotificacaoSino papel={usuario.papel} />
      </header>

      {/* Gaveta do celular */}
      {open && (
        <div className="no-print fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="animate-in absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col bg-menu text-menu-fg shadow-xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-menu-borda px-4 py-5">
              {brand}
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-menu-texto hover:bg-menu-hover hover:text-menu-fg active:bg-menu-hover"
              >
                <Fechar tamanho={20} />
              </button>
            </div>
            {nav}
            {rodape}
          </aside>
        </div>
      )}

      {/* Navegação inferior — os destinos do dia sem passar pela gaveta */}
      <BarraInferior />
    </>
  );
}
```

### src/components/ui/BarraInferior.tsx

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Despesa, Dinheiro, Mais, Patio, Recibo } from "./Icones";

/**
 * Navegação inferior do celular.
 *
 * Antes toda navegação passava pelo hambúrguer: ir do pátio para contas a
 * receber custava três toques — abrir a gaveta, achar o item numa lista só de
 * texto, tocar. Numa oficina, com o celular numa das mãos, esse é o gesto mais
 * repetido do dia.
 *
 * Cinco posições fixas, sempre as mesmas, nesta ordem: Pátio, OS, Nova OS,
 * A receber, Gastos. Antes os dois últimos trocavam para Clientes/Mecânicos
 * quando quem estava logado era o operador, e havia um botão de menu que nunca
 * chegava a aparecer (a lista de itens tinha sempre 4, então a condição que o
 * mostraria nunca era verdadeira) — o resultado prático eram cinco posições
 * que pareciam mudar de lugar. Agora a barra é a mesma para todo mundo; quem
 * não é dono e toca em A receber ou Gastos é devolvido ao pátio pelo proxy
 * (ver src/proxy.ts), do mesmo jeito que aconteceria clicando o link direto.
 *
 * Some na impressão e no desktop, onde o menu lateral já resolve.
 */

type Item = {
  href: string;
  label: string;
  Icone: typeof Patio;
  /** Casa exata; sem isto "/" acenderia em toda tela. */
  exato?: boolean;
};

const ANTES: Item[] = [
  { href: "/", label: "Pátio", Icone: Patio, exato: true },
  { href: "/os", label: "OS", Icone: Recibo },
];

const DEPOIS: Item[] = [
  { href: "/contas-receber", label: "A receber", Icone: Dinheiro },
  { href: "/despesas", label: "Gastos", Icone: Despesa },
];

export function BarraInferior() {
  const pathname = usePathname();

  const ativo = (i: Item) => (i.exato ? pathname === i.href : pathname.startsWith(i.href));

  return (
    <nav
      aria-label="Navegação principal"
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-superficie/95 pb-segura backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-5">
        {ANTES.map((i) => (
          <BotaoBarra key={i.href} item={i} ativo={ativo(i)} />
        ))}

        {/* Ação primária no centro, onde o polegar alcança sem reposicionar a mão. */}
        <Link
          href="/os/nova"
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 text-brand-texto"
          aria-label="Nova OS"
        >
          <span className="flex h-8 w-12 items-center justify-center rounded-full bg-brand-600 text-brand-fg">
            <Mais tamanho={20} />
          </span>
          <span className="text-xs font-medium leading-none">Nova OS</span>
        </Link>

        {DEPOIS.map((i) => (
          <BotaoBarra key={i.href} item={i} ativo={ativo(i)} />
        ))}
      </div>
    </nav>
  );
}

function BotaoBarra({ item, ativo }: { item: Item; ativo: boolean }) {
  const { Icone } = item;
  return (
    <Link
      href={item.href}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 transition-colors",
        ativo ? "text-brand-texto" : "text-tinta-3"
      )}
    >
      <Icone tamanho={19} />
      <span className="text-xs leading-none">{item.label}</span>
    </Link>
  );
}
```

### src/components/ui/Dados.tsx

```tsx
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Blocos de leitura.

   Duas correções vivem aqui.

   A primeira é de repetição: existiam nove componentes diferentes desenhando o
   mesmo cartão de número — StatCard, SummaryCard, MetricCard, dois Metric, dois
   Metrica, Cartao e Mini. Como eram cópias, já tinham divergido: uns em
   `text-2xl`, outros em `text-lg`, um com numeral tabular e o resto sem.

   A segunda é de hierarquia: toda região da tela era o mesmo cartão branco com
   borda. Borda, raio e fundo dizem "objeto separado", e gastá-los em tudo anula
   os três. Agora um grupo de números é UM objeto com divisórias internas, não
   cinco cartões idênticos empilhados; a moldura fica para o que de fato é uma
   unidade à parte.
   ========================================================================== */

export type TomMetrica = "neutro" | "ok" | "atencao" | "perigo";

const TOM_TEXTO: Record<TomMetrica, string> = {
  neutro: "text-tinta",
  ok: "text-ok",
  atencao: "text-atencao",
  perigo: "text-perigo",
};

/** Um número com rótulo. Sem moldura própria — quem molda é o container. */
export function Metrica({
  rotulo,
  valor,
  sub,
  tom = "neutro",
  tamanho = "normal",
  title,
}: {
  rotulo: string;
  valor: string;
  sub?: string;
  tom?: TomMetrica;
  tamanho?: "normal" | "grande";
  title?: string;
}) {
  return (
    <div className="min-w-0" title={title}>
      <p className="truncate text-xs text-tinta-3">{rotulo}</p>
      <p
        className={cn(
          "mt-0.5 font-bold tabular-nums",
          tamanho === "grande" ? "text-2xl" : "text-base",
          TOM_TEXTO[tom]
        )}
      >
        {valor}
      </p>
      {sub && <p className="mt-0.5 truncate text-xs text-tinta-3">{sub}</p>}
    </div>
  );
}

/**
 * Faixa de números: uma superfície só, dividida por filetes.
 *
 * É o que substitui as fileiras de cartões repetidos no dashboard, em contas a
 * receber, no caixa, na produtividade e no controle de gastos.
 */
export function FaixaMetricas({
  colunas = 4,
  className,
  children,
}: {
  colunas?: 2 | 3 | 4 | 5 | 6;
  className?: string;
  children: React.ReactNode;
}) {
  const grade = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  }[colunas];

  // As divisórias não saem de `divide-x`/`divide-y`. Aquelas regras desenham a
  // linha em todo filho menos o primeiro, sem saber em que coluna cada um caiu —
  // e a faixa quebra em duas colunas no celular. O resultado eram filetes soltos:
  // um traço horizontal sob a borda de cima, na segunda métrica da primeira
  // fileira, e um traço vertical colado na borda esquerda a cada fileira nova.
  //
  // Aqui a linha vem de `border-l`/`border-t` em TODOS os filhos, e a grade
  // inteira anda 1px para cima e para a esquerda: as bordas da primeira fileira e
  // da primeira coluna caem exatamente em cima da moldura e desaparecem, sobrando
  // só as de dentro. Vale para qualquer número de colunas, em qualquer largura, e
  // a métrica órfã da última fileira (5 números em 2 colunas) fica limpa.
  return (
    <div className={cn("overflow-hidden rounded-xl border border-linha bg-superficie", className)}>
      <div
        className={cn(
          "-ml-px -mt-px grid [&>*]:border-l [&>*]:border-t [&>*]:border-linha [&>*]:p-4",
          grade
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Métrica que leva a algum lugar. Mesmo desenho, com estado de toque. */
export function MetricaLink({
  href,
  ...props
}: React.ComponentProps<typeof Metrica> & { href: string }) {
  return (
    <Link href={href} className="block min-w-0 transition-colors hover:bg-superficie-2">
      <Metrica {...props} />
    </Link>
  );
}

/**
 * Superfície de conteúdo — o cartão de verdade, para o que é mesmo uma unidade
 * separada: um formulário, uma lista, um painel de ferramenta.
 */
export function Painel({
  titulo,
  ajuda,
  acao,
  className,
  children,
}: {
  titulo?: string;
  ajuda?: string;
  acao?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-linha bg-superficie p-4 sm:p-5", className)}>
      {(titulo || acao) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {titulo && <h2 className="font-semibold text-tinta">{titulo}</h2>}
            {ajuda && <p className="mt-0.5 text-xs text-tinta-3">{ajuda}</p>}
          </div>
          {acao && <div className="shrink-0">{acao}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Cabeçalho de seção sobre o fundo da página — sem moldura. */
export function Secao({
  titulo,
  ajuda,
  acao,
  children,
}: {
  titulo: string;
  ajuda?: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold text-tinta">{titulo}</h2>
          {ajuda && <p className="text-xs text-tinta-3">{ajuda}</p>}
        </div>
        {acao && <div className="shrink-0">{acao}</div>}
      </div>
      {children}
    </section>
  );
}

/**
 * Estado vazio com saída.
 *
 * O controle de gastos já fazia certo: explica e oferece o botão. Todos os
 * outros eram uma linha cinza e nada mais, então as primeiras telas de uma
 * oficina recém-instalada eram becos sem ação.
 */
export function Vazio({
  titulo,
  texto,
  acao,
  compacto,
}: {
  titulo: string;
  texto?: string;
  acao?: React.ReactNode;
  compacto?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-linha-forte bg-superficie px-6 text-center",
        compacto ? "py-8" : "py-12"
      )}
    >
      <p className="font-medium text-tinta-2">{titulo}</p>
      {texto && <p className="mx-auto mt-1 max-w-sm text-sm text-tinta-3">{texto}</p>}
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  );
}

/* --- carregamento --------------------------------------------------------- */

/** Bloco cinza que reserva a altura do que está por vir. */
export function Esqueleto({ className }: { className?: string }) {
  return <div className={cn("esqueleto", className)} aria-hidden="true" />;
}

/** Lista em carregamento: mesma altura de linha do conteúdo real, para a tela
 *  não saltar quando os dados chegam. */
export function EsqueletoLista({ linhas = 5 }: { linhas?: number }) {
  return (
    <div
      className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie"
      role="status"
      aria-label="Carregando"
    >
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Esqueleto className="h-8 w-10 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Esqueleto className="h-3.5 w-1/3" />
            <Esqueleto className="h-3 w-2/3" />
          </div>
          <Esqueleto className="h-6 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function EsqueletoFaixa({ colunas = 4 }: { colunas?: 2 | 3 | 4 | 5 | 6 }) {
  return (
    <FaixaMetricas colunas={colunas}>
      {Array.from({ length: colunas }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Esqueleto className="h-3 w-16" />
          <Esqueleto className="h-6 w-24" />
        </div>
      ))}
    </FaixaMetricas>
  );
}
```

### src/components/ui/Campos.tsx

```tsx
"use client";

import { useEffect, useId, useState } from "react";
import { cn, formatarValorBR, paraNumero } from "@/lib/utils";

// A altura mínima de toque não está aqui: vale para todo campo do sistema, e
// metade deles ainda desenha as próprias classes sem passar por este arquivo.
// Quem garante os 44 px no celular é o piso em globals.css.
export const BASE_CAMPO =
  "w-full rounded-lg border border-linha-forte bg-superficie px-3 py-2 text-sm text-tinta placeholder:text-tinta-3 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-superficie-2 disabled:text-tinta-3";

export function Campo({
  rotulo,
  ajuda,
  erro,
  obrigatorio,
  className,
  children,
}: {
  rotulo: string;
  ajuda?: string;
  erro?: string;
  obrigatorio?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-tinta-2">
        {rotulo}
        {obrigatorio && <span className="ml-0.5 text-perigo">*</span>}
      </span>
      {children}
      {erro ? (
        <span className="mt-1 block text-xs text-perigo">{erro}</span>
      ) : (
        ajuda && <span className="mt-1 block text-xs text-tinta-3">{ajuda}</span>
      )}
    </label>
  );
}

export function Entrada(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(BASE_CAMPO, props.className)} />;
}

export function Selecao(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(BASE_CAMPO, props.className)} />;
}

export function Area(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(BASE_CAMPO, "resize-y", props.className)} />;
}

/**
 * Campo de dinheiro.
 *
 * Substitui os dezenove `type="number"` que recusavam a vírgula decimal. Aqui o
 * campo é texto — então aceita `1.250,50`, `1250,50` e `1250.50` — e o valor que
 * sai para o formulário é sempre canônico com ponto, para o `Number()` de quem
 * chama continuar valendo.
 *
 * `inputMode="decimal"` mantém o teclado numérico do Android, e ao sair do campo
 * o texto é reescrito no formato brasileiro para a pessoa conferir o que ficou.
 */
export function CampoDinheiro({
  valor,
  onChange,
  onEnter,
  className,
  id,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  /** Valor canônico, com ponto decimal. String vazia = campo em branco. */
  valor: string;
  onChange: (canonico: string) => void;
  onEnter?: () => void;
}) {
  const gerado = useId();
  const campoId = id ?? gerado;
  const [texto, setTexto] = useState(() => (valor === "" ? "" : formatarValorBR(paraNumero(valor))));
  const [focado, setFocado] = useState(false);

  // Enquanto o campo não está em foco, ele reflete o valor de fora — é assim que
  // "aplicar desconto" ou reabrir um modal mostram o número certo.
  useEffect(() => {
    if (focado) return;
    setTexto(valor === "" ? "" : formatarValorBR(paraNumero(valor)));
  }, [valor, focado]);

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-tinta-3"
      >
        R$
      </span>
      <input
        {...props}
        id={campoId}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={texto}
        onFocus={(e) => {
          setFocado(true);
          props.onFocus?.(e);
        }}
        onChange={(e) => {
          // Só o que pode compor um valor. Impede letra e símbolo colados sem
          // recusar o que a pessoa está no meio de digitar.
          const bruto = e.target.value.replace(/[^\d.,]/g, "");
          setTexto(bruto);
          onChange(bruto === "" ? "" : String(paraNumero(bruto)));
        }}
        onBlur={(e) => {
          setFocado(false);
          const n = paraNumero(texto);
          setTexto(texto.trim() === "" ? "" : formatarValorBR(n));
          props.onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter();
          }
          props.onKeyDown?.(e);
        }}
        className={cn(BASE_CAMPO, "pl-9 text-right tabular-nums", className)}
      />
    </div>
  );
}

/**
 * Quantidade — mesmo problema do campo de dinheiro, sem o "R$".
 *
 * Meia hora de mão de obra se escreve `0,5` aqui, e `type="number"` recusava a
 * vírgula do mesmo jeito.
 */
export function CampoQuantidade({
  valor,
  onChange,
  onEnter,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  valor: string;
  onChange: (canonico: string) => void;
  onEnter?: () => void;
}) {
  const [texto, setTexto] = useState(() => valor.replace(".", ","));
  const [focado, setFocado] = useState(false);

  useEffect(() => {
    if (focado) return;
    setTexto(valor.replace(".", ","));
  }, [valor, focado]);

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={texto}
      onFocus={(e) => {
        setFocado(true);
        props.onFocus?.(e);
      }}
      onChange={(e) => {
        const bruto = e.target.value.replace(/[^\d.,]/g, "");
        setTexto(bruto);
        onChange(bruto === "" ? "" : String(paraNumero(bruto)));
      }}
      onBlur={(e) => {
        setFocado(false);
        setTexto(texto.trim() === "" ? "" : String(paraNumero(texto)).replace(".", ","));
        props.onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onEnter) {
          e.preventDefault();
          onEnter();
        }
        props.onKeyDown?.(e);
      }}
      className={cn(BASE_CAMPO, "text-right tabular-nums", className)}
    />
  );
}

export function Aviso({ children, tipo = "erro" }: { children: React.ReactNode; tipo?: "erro" | "atencao" }) {
  if (!children) return null;
  return (
    <p
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        tipo === "erro"
          ? "border-perigo-linha bg-perigo-fraco text-perigo"
          : "border-atencao-linha bg-atencao-fraco text-atencao"
      )}
    >
      {children}
    </p>
  );
}
```

### src/components/ui/Modal.tsx

```tsx
"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { Fechar } from "./Icones";

/**
 * Casca única dos modais.
 *
 * Antes eram treze sobreposições `fixed inset-0` espalhadas, e o comportamento
 * variava: três fechavam no Escape, nenhuma prendia o foco, nenhuma declarava
 * `aria-modal`, e só a gaveta do menu travava a rolagem — então abrir o modal de
 * pagamento e rolar movia a página atrás dele.
 *
 * Aqui isso é resolvido uma vez:
 *
 *   Escape        fecha
 *   Tab           circula dentro do modal, sem escapar para a página
 *   rolagem       travada no corpo enquanto aberto
 *   foco          entra no modal ao abrir e volta para o gatilho ao fechar
 *
 * `items-start` + `overflow-y-auto` no fundo e `my-auto` no cartão são a
 * convenção daqui: no Android o teclado encolhe a viewport, e um modal centrado
 * sem rolagem esconde o botão de salvar sem deixar como chegar nele.
 */
export function Modal({
  titulo,
  descricao,
  largura = "max-w-md",
  onFechar,
  children,
  rodape,
}: {
  titulo: string;
  descricao?: string;
  largura?: string;
  onFechar: () => void;
  children: React.ReactNode;
  /** Ações fixas no pé do modal, fora da área que rola. */
  rodape?: React.ReactNode;
}) {
  const cartaoRef = useRef<HTMLDivElement>(null);
  const tituloId = useId();
  const descricaoId = useId();

  // Guarda quem tinha o foco para devolver ao fechar. Sem isso, fechar um modal
  // no teclado joga o foco para o início da página.
  const origemRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    origemRef.current = document.activeElement as HTMLElement | null;
    return () => origemRef.current?.focus?.();
  }, []);

  // Trava a rolagem do fundo, compensando a largura da barra para a página não
  // "pular" ao abrir no desktop.
  useEffect(() => {
    const { body } = document;
    const larguraBarra = window.innerWidth - document.documentElement.clientWidth;
    const overflowAnterior = body.style.overflow;
    const paddingAnterior = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (larguraBarra > 0) body.style.paddingRight = `${larguraBarra}px`;
    return () => {
      body.style.overflow = overflowAnterior;
      body.style.paddingRight = paddingAnterior;
    };
  }, []);

  // Foco inicial: o primeiro campo, ou o próprio cartão quando não há nenhum.
  useEffect(() => {
    const alvo =
      cartaoRef.current?.querySelector<HTMLElement>(
        "[data-foco-inicial], input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled])"
      ) ?? cartaoRef.current;
    alvo?.focus?.();
  }, []);

  // Escape fecha, Tab circula.
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onFechar();
        return;
      }
      if (e.key !== "Tab") return;
      const focaveis = cartaoRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focaveis || focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      const ativo = document.activeElement;
      if (e.shiftKey && (ativo === primeiro || !cartaoRef.current?.contains(ativo))) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && ativo === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
    document.addEventListener("keydown", aoTeclar, true);
    return () => document.removeEventListener("keydown", aoTeclar, true);
  }, [onFechar]);

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div
        ref={cartaoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descricao ? descricaoId : undefined}
        tabIndex={-1}
        className={cn(
          "my-auto flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-2xl bg-superficie shadow-xl outline-none",
          largura
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-linha px-5 py-4">
          <div className="min-w-0">
            <h2 id={tituloId} className="font-semibold text-tinta">
              {titulo}
            </h2>
            {descricao && (
              <p id={descricaoId} className="mt-0.5 text-xs text-tinta-3">
                {descricao}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-tinta-3 transition-colors hover:bg-superficie-2 hover:text-tinta"
          >
            <Fechar tamanho={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {rodape && (
          <div className="border-t border-linha px-5 py-4 pb-segura">{rodape}</div>
        )}
      </div>
    </div>
  );
}
```

### src/components/ui/Avisos.tsx

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Modal } from "./Modal";
import { Botao } from "./Botao";
import { Alerta, Confere, Fechar } from "./Icones";

/* ==========================================================================
   Confirmação e aviso — no lugar de confirm() e alert() do navegador.

   Eram dezenove chamadas nativas convivendo com modais próprios muito melhores:
   o de estorno explica o que acontece com o saldo e o que não muda no status,
   enquanto excluir uma OS caía numa caixa cinza do sistema, fora do tema e sem
   dizer o valor envolvido.

   Aqui a confirmação é uma promessa, então o local de chamada continua lendo
   quase como antes:

       if (!(await confirmar({ titulo: "Excluir esta OS?", ... }))) return;
   ========================================================================== */

type PedidoConfirmacao = {
  titulo: string;
  /** O que exatamente vai acontecer. Vale citar valores e consequências. */
  texto?: React.ReactNode;
  /** Rótulo do botão que confirma. Diga a ação, não "OK". */
  acao?: string;
  cancelar?: string;
  /** Ação destrutiva: botão contornado em vermelho. */
  perigo?: boolean;
};

type Toast = { id: number; mensagem: string; tipo: "ok" | "erro" };

type Contexto = {
  confirmar: (pedido: PedidoConfirmacao) => Promise<boolean>;
  avisar: (mensagem: string, tipo?: "ok" | "erro") => void;
};

const AvisosContexto = createContext<Contexto | null>(null);

export function useConfirmar() {
  const ctx = useContext(AvisosContexto);
  if (!ctx) throw new Error("useConfirmar precisa do AvisosProvider no layout.");
  return ctx.confirmar;
}

export function useAvisar() {
  const ctx = useContext(AvisosContexto);
  if (!ctx) throw new Error("useAvisar precisa do AvisosProvider no layout.");
  return ctx.avisar;
}

export function AvisosProvider({ children }: { children: React.ReactNode }) {
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);
  const proximoId = useRef(1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Sem isso, sair da tela com um toast no ar deixa o timer disparando contra um
  // componente desmontado.
  useEffect(() => {
    const atuais = timers.current;
    return () => atuais.forEach(clearTimeout);
  }, []);

  const confirmar = useCallback((p: PedidoConfirmacao) => {
    setPedido(p);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const responder = useCallback((ok: boolean) => {
    setPedido(null);
    resolverRef.current?.(ok);
    resolverRef.current = null;
  }, []);

  const avisar = useCallback((mensagem: string, tipo: "ok" | "erro" = "ok") => {
    const id = proximoId.current++;
    setToasts((atuais) => [...atuais, { id, mensagem, tipo }]);
    const t = setTimeout(
      () => setToasts((atuais) => atuais.filter((x) => x.id !== id)),
      tipo === "erro" ? 6000 : 3000
    );
    timers.current.push(t);
  }, []);

  const valor = useMemo(() => ({ confirmar, avisar }), [confirmar, avisar]);

  return (
    <AvisosContexto.Provider value={valor}>
      {children}

      {pedido && (
        <Modal
          titulo={pedido.titulo}
          largura="max-w-sm"
          onFechar={() => responder(false)}
          rodape={
            <div className="flex gap-2">
              <Botao
                variante={pedido.perigo ? "perigo" : "primario"}
                className="flex-1"
                onClick={() => responder(true)}
                data-foco-inicial
              >
                {pedido.acao ?? "Confirmar"}
              </Botao>
              <Botao variante="secundario" className="flex-1" onClick={() => responder(false)}>
                {pedido.cancelar ?? "Cancelar"}
              </Botao>
            </div>
          }
        >
          {typeof pedido.texto === "string" ? (
            <p className="text-sm text-tinta-2">{pedido.texto}</p>
          ) : (
            pedido.texto ?? (
              <p className="text-sm text-tinta-2">Esta ação não pode ser desfeita.</p>
            )
          )}
        </Modal>
      )}

      {/* No celular o toast vem de baixo, acima da barra de navegação: em cima ele
          cobria o botão de menu e o contador de pendências do cabeçalho fixo. */}
      {toasts.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-auto sm:items-end sm:pb-0"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl px-4 py-3 text-sm shadow-lg sm:w-auto",
                t.tipo === "erro"
                  ? "bg-perigo-fraco text-perigo ring-1 ring-perigo-linha"
                  : "bg-contraste text-contraste-fg"
              )}
            >
              <span className="mt-0.5 shrink-0">
                {t.tipo === "erro" ? <Alerta tamanho={16} /> : <Confere tamanho={16} />}
              </span>
              <span className="min-w-0 flex-1">{t.mensagem}</span>
              <button
                type="button"
                onClick={() => setToasts((a) => a.filter((x) => x.id !== t.id))}
                aria-label="Dispensar"
                className="-my-1 -mr-1 shrink-0 rounded p-1 opacity-70 hover:opacity-100"
              >
                <Fechar tamanho={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </AvisosContexto.Provider>
  );
}
```

### src/components/MaisDaLista.tsx

```tsx
"use client";

import { useState } from "react";
import { Chevron } from "@/components/ui/Icones";

// As linhas chegam prontas do servidor — o período já foi carregado inteiro para
// somar o DRE, então "mostrar mais" é só revelar o que já está aqui, sem ida ao
// banco. Vem em lotes para que um mês de sessenta entregas não empurre o rodapé
// da página a sessenta linhas de rolagem no celular.
export function MaisDaLista({
  linhas,
  passo = 10,
  rotulo = "Mostrar mais",
}: {
  linhas: React.ReactNode[];
  /** Quantas linhas cada clique revela. */
  passo?: number;
  rotulo?: string;
}) {
  const [visiveis, setVisiveis] = useState(0);
  const restantes = linhas.length - visiveis;

  return (
    <>
      {linhas.slice(0, visiveis)}
      {restantes > 0 && (
        <button
          type="button"
          onClick={() => setVisiveis((v) => v + passo)}
          className="flex w-full min-h-11 items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium text-brand-texto transition-colors hover:bg-superficie-2"
        >
          {rotulo} · faltam {restantes} <Chevron tamanho={14} />
        </button>
      )}
    </>
  );
}
```

### src/components/ui/TextoFormatado.tsx

```tsx
import { blocosDoTexto, type Bloco, type Trecho } from "@/lib/texto-formatado";

// Mostra na tela a descrição do serviço com títulos, negrito e listas.
// As marcas estão explicadas em lib/texto-formatado.ts.

function Trechos({ trechos }: { trechos: Trecho[] }) {
  return (
    <>
      {trechos.map((t, i) =>
        t.negrito ? (
          <strong key={i} className="font-semibold text-tinta">{t.texto}</strong>
        ) : (
          <span key={i}>{t.texto}</span>
        ),
      )}
    </>
  );
}

/** Agrupa itens de lista vizinhos para virarem um <ol>/<ul> de verdade. */
type Grupo =
  | { tipo: "lista"; numerada: boolean; itens: Extract<Bloco, { tipo: "numerado" | "marcador" }>[] }
  | { tipo: "bloco"; bloco: Exclude<Bloco, { tipo: "numerado" | "marcador" }> };

function agrupa(blocos: Bloco[]): Grupo[] {
  const grupos: Grupo[] = [];
  for (const b of blocos) {
    if (b.tipo === "numerado" || b.tipo === "marcador") {
      const ultimo = grupos[grupos.length - 1];
      // Sub-item fica no grupo do item de cima, mesmo que o tipo da lista mude.
      if (ultimo?.tipo === "lista" && (b.nivel > 0 || ultimo.numerada === (b.tipo === "numerado"))) {
        ultimo.itens.push(b);
      } else {
        grupos.push({ tipo: "lista", numerada: b.tipo === "numerado", itens: [b] });
      }
    } else {
      grupos.push({ tipo: "bloco", bloco: b });
    }
  }
  return grupos;
}

export function TextoFormatado({ texto, className = "" }: { texto: string; className?: string }) {
  const grupos = agrupa(blocosDoTexto(texto));
  return (
    <div className={`space-y-1 text-sm leading-relaxed text-tinta break-words ${className}`}>
      {grupos.map((g, i) => {
        if (g.tipo === "lista") {
          return (
            <ul key={i} className="space-y-0.5">
              {g.itens.map((item, j) => (
                <li key={j} className={`flex gap-2 ${item.nivel > 0 ? "pl-6" : ""}`}>
                  <span className="w-5 shrink-0 text-right tabular-nums text-tinta-2" aria-hidden="true">
                    {item.tipo === "numerado" ? `${item.numero}.` : "•"}
                  </span>
                  <span className="min-w-0 flex-1"><Trechos trechos={item.trechos} /></span>
                </li>
              ))}
            </ul>
          );
        }
        const b = g.bloco;
        if (b.tipo === "espaco") return <div key={i} className="h-2" aria-hidden="true" />;
        if (b.tipo === "titulo") {
          return (
            <p key={i} className="pt-1 font-bold uppercase tracking-wide text-tinta">
              <Trechos trechos={b.trechos} />
            </p>
          );
        }
        return <p key={i}><Trechos trechos={b.trechos} /></p>;
      })}
    </div>
  );
}
```

### src/components/CopiarVeiculo.tsx

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { textoVeiculo, type VeiculoInfo } from "@/lib/constants";

/** Copia para a área de transferência, com plano B para navegador sem Clipboard API
 *  (o celular da oficina acessando por http na rede local cai nesse caso). */
async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // segue para o plano B
  }
  try {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/** Botão "copiar dados do carro" — o texto sai pronto para colar no WhatsApp da auto peça. */
export default function CopiarVeiculo({
  veiculo,
  label = "Copiar carro",
  className,
  comoItem = false,
}: {
  veiculo: VeiculoInfo;
  label?: string;
  className?: string;
  /** Renderiza como linha de menu (largura cheia, sem borda) em vez de botão-pílula. */
  comoItem?: boolean;
}) {
  const [estado, setEstado] = useState<"parado" | "copiado" | "falhou">("parado");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const texto = textoVeiculo(veiculo);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copiar() {
    const ok = await copiarTexto(texto);
    setEstado(ok ? "copiado" : "falhou");
    if (timer.current) clearTimeout(timer.current);
    // O aviso de falha fica mais tempo: junto dele aparece o texto para copiar na mão.
    timer.current = setTimeout(() => setEstado("parado"), ok ? 2000 : 15000);
  }

  return (
    <div
      className={cn(
        "no-print flex flex-col items-start gap-1",
        comoItem ? "w-full" : "inline-flex",
        className
      )}
    >
      <button
        type="button"
        onClick={copiar}
        title={`Copiar para enviar à auto peça:\n\n${texto}`}
        aria-live="polite"
        className={cn(
          "text-sm transition-colors",
          comoItem
            ? cn(
                "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left",
                estado === "copiado" ? "text-ok" : "text-tinta-2 hover:bg-superficie-2"
              )
            : cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5",
                estado === "copiado"
                  ? "border-ok-linha bg-ok-fraco text-ok"
                  : "border-linha-forte text-tinta-2 hover:bg-superficie-2"
              )
        )}
      >
        {estado === "copiado" ? (
          <CheckIcon tamanho={comoItem ? 16 : 14} />
        ) : (
          <CopyIcon tamanho={comoItem ? 16 : 14} />
        )}
        {estado === "copiado" ? "Copiado!" : label}
      </button>

      {estado === "falhou" && (
        <div className="w-full max-w-xs">
          <p className="mb-1 text-xs text-atencao">
            O navegador bloqueou a cópia — selecione o texto abaixo e copie.
          </p>
          <textarea
            readOnly
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            value={texto}
            rows={texto.split("\n").length}
            className="w-full resize-none rounded-lg border border-linha-forte px-2 py-1.5 text-xs text-tinta-2"
          />
        </div>
      )}
    </div>
  );
}

function CopyIcon({ tamanho = 14 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ tamanho = 14 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
```

### src/lib/utils.ts

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { anoVeiculo } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Como a linha de lista fala do recebimento da OS.
 *
 * Antes era só "Pago" ou "Pendente" embaixo do total, e "Pendente" ao lado de
 * R$ 2.900,00 dava a entender que o cliente devia os 2.900 — mesmo quando ele já
 * tinha deixado 1.900. O que está em aberto é o saldo, então é ele que aparece.
 * Sem nenhum pagamento o rótulo continua sendo "Pendente": repetir o total logo
 * abaixo dele não diria nada de novo.
 */
export function situacaoRecebimento(os: {
  total: number;
  valorPago?: number | null;
  pago: boolean;
}): { texto: string; cor: string } {
  if (os.pago) return { texto: "Pago", cor: "text-ok" };
  const recebido = os.valorPago ?? 0;
  const saldo = Math.max(0, os.total - recebido);
  return {
    texto: recebido > 0 ? `Falta ${formatCurrency(saldo)}` : "Pendente",
    cor: "text-perigo",
  };
}

/** Valor sem o "R$" — para dentro de campos, onde o prefixo já está desenhado. */
export function formatarValorBR(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Lê um valor digitado em português e devolve número.
 *
 * Os campos de dinheiro usavam `type="number"`, que só aceita ponto como
 * separador decimal: quem digitava `1250,50` — como se escreve aqui — entregava
 * um campo inválido, que virava vazio no envio sem mensagem nenhuma.
 *
 * Regras de desambiguação:
 *   "1250,50"     vírgula é decimal                    → 1250.5
 *   "1.250,50"    ponto é milhar, vírgula é decimal    → 1250.5
 *   "1.50"        último grupo com 1-2 dígitos: decimal → 1.5
 *   "1.500"       último grupo com 3 dígitos: milhar    → 1500
 */
export function paraNumero(texto: string | number | null | undefined): number {
  if (typeof texto === "number") return Number.isFinite(texto) ? texto : 0;
  if (texto == null) return 0;

  const limpo = String(texto).trim().replace(/[^\d.,-]/g, "");
  if (!limpo) return 0;

  const temVirgula = limpo.includes(",");
  const temPonto = limpo.includes(".");

  let normalizado: string;
  if (temVirgula && temPonto) {
    // O separador decimal é o que aparece por último.
    normalizado =
      limpo.lastIndexOf(",") > limpo.lastIndexOf(".")
        ? limpo.replace(/\./g, "").replace(",", ".")
        : limpo.replace(/,/g, "");
  } else if (temVirgula) {
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else if (temPonto) {
    const ultimoGrupo = limpo.slice(limpo.lastIndexOf(".") + 1);
    normalizado = ultimoGrupo.length === 3 ? limpo.replace(/\./g, "") : limpo;
  } else {
    normalizado = limpo;
  }

  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Minúsculo e sem acento: é assim que "agua" acha "Água".
 *
 * Mora aqui, e não em `lib/estoque`, porque os dois lados precisam dela e `lib/estoque`
 * importa o Prisma: o campo de peça (que roda no navegador) usa esta mesma função para
 * saber se já perguntou algo equivalente antes de ir ao servidor, e a chave só serve se
 * for a mesma que o servidor usa para comparar.
 */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** `true` quando o campo tem conteúdo que não seja espaço. */
export function temValor(texto: string | null | undefined): boolean {
  return !!texto && texto.trim() !== "";
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

// Um orçamento pode ser rascunho: sem cliente/veículo cadastrados, a identificação
// vem dos campos de texto livre. Estes helpers escolhem o que exibir.
type OrcamentoIdentificacao = {
  cliente?: { nome: string } | null;
  clienteNome?: string | null;
  clienteTelefone?: string | null;
  veiculo?: {
    marca: string; modelo: string; placa?: string | null;
    ano?: number | null; anoFabricacao?: number | null; anoModelo?: number | null;
  } | null;
  veiculoDesc?: string | null;
};

export function nomeCliente(o: OrcamentoIdentificacao): string {
  return o.cliente?.nome || o.clienteNome?.trim() || "Sem identificação";
}

export function telefoneCliente(
  o: OrcamentoIdentificacao & { cliente?: { telefone?: string | null } | null }
): string | null {
  return o.cliente ? o.cliente.telefone ?? null : o.clienteTelefone?.trim() || null;
}

export function descricaoVeiculo(o: OrcamentoIdentificacao): string | null {
  if (o.veiculo) {
    const { marca, modelo, placa } = o.veiculo;
    const ano = anoVeiculo(o.veiculo);
    return `${marca} ${modelo}${placa ? ` · ${placa}` : ""}${ano ? ` (${ano})` : ""}`;
  }
  return o.veiculoDesc?.trim() || null;
}

// Rascunho = ainda falta cadastro para virar OS.
export function ehRascunho(o: OrcamentoIdentificacao & { clienteId?: string | null }): boolean {
  return !o.cliente && !o.clienteId;
}

export function formatDatetime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
```

### src/lib/configuracao.ts

```ts
// Configurações da oficina: formato, padrões e os derivados que tela e PDF usam.
//
// A tabela guarda uma linha por oficina (a chave é o `oficinaId`). Quem consome nunca
// precisa tratar "ainda não configurado" — os padrões daqui preenchem o que faltar.
//
// Este arquivo é puro de propósito (sem Prisma): o cabeçalho dos documentos e os
// botões de PDF são componentes de cliente e importam os mesmos derivados. A leitura
// no banco fica em `configuracao-db.ts`.
//
// O sistema sai sempre nas cores do boxOS (globals.css). A oficina escolhe cor só para
// os documentos que emite — `corDocumento`, ver `cor-documento.ts`.

import { COR_DOCUMENTO_PADRAO } from "@/lib/cor-documento";

export type Configuracao = {
  nome: string;
  nomeCurto: string | null;
  cnpj: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  site: string | null;
  cep: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  logoUrl: string | null;
  /** Filete e número nos documentos emitidos (#rrggbb). Não pinta o sistema. */
  corDocumento: string;
  rodapeDocumento: string | null;
  mensagemDocumento: string | null;
  mostrarAssinatura: boolean;
  validadeOrcamentoDias: number;
  reservaLucroAtiva: boolean;
  reservaLucroPercentual: number;
};

export const CONFIG_PADRAO: Configuracao = {
  nome: "Minha Oficina",
  nomeCurto: null,
  cnpj: null,
  telefone: null,
  whatsapp: null,
  email: null,
  site: null,
  cep: null,
  endereco: null,
  cidade: null,
  estado: null,
  logoUrl: null,
  corDocumento: COR_DOCUMENTO_PADRAO,
  rodapeDocumento: null,
  mensagemDocumento: null,
  mostrarAssinatura: true,
  validadeOrcamentoDias: 7,
  reservaLucroAtiva: false,
  reservaLucroPercentual: 10,
};

/** Campos de texto editáveis pelo painel — a logo tem rota própria (upload). */
export const CAMPOS_TEXTO = [
  "nome", "nomeCurto", "cnpj", "telefone", "whatsapp", "email", "site",
  "cep", "endereco", "cidade", "estado", "rodapeDocumento", "mensagemDocumento",
] as const;

export type CampoTexto = (typeof CAMPOS_TEXTO)[number];

/** Nome curto do menu, com o nome completo como reserva. */
export function nomeDoMenu(config: Configuracao): string {
  return config.nomeCurto?.trim() || config.nome;
}

/** Linhas de contato do cabeçalho dos documentos, sem as que estiverem vazias. */
export function linhasDoCabecalho(config: Configuracao): string[] {
  const linhas: string[] = [];
  if (config.cnpj) linhas.push(`CNPJ: ${config.cnpj}`);

  const contatos: string[] = [];
  if (config.telefone) contatos.push(`Telefone: ${config.telefone}`);
  if (config.whatsapp) contatos.push(`WhatsApp: ${config.whatsapp}`);
  if (contatos.length > 0) linhas.push(contatos.join("  ·  "));

  const endereco = [config.endereco, [config.cidade, config.estado].filter(Boolean).join(" - ")]
    .filter(Boolean)
    .join(", ");
  if (endereco) linhas.push(endereco);

  const web = [config.email, config.site].filter(Boolean).join("  ·  ");
  if (web) linhas.push(web);

  return linhas;
}

/**
 * Assinatura do sistema no fim dos documentos. Só texto, pequeno e cinza: o documento
 * é da oficina (logo, nome, cor), e o boxOS não pode competir com ela.
 */
export const EMITIDO_COM = "Emitido com boxOS";

/** Assinatura do rodapé: o texto livre configurado ou "Oficina · telefone". */
export function rodapeDoDocumento(config: Configuracao): string {
  if (config.rodapeDocumento?.trim()) return config.rodapeDocumento.trim();
  return [config.nome, config.telefone].filter(Boolean).join(" · ");
}

/**
 * Quanto sugerir guardar sobre uma base — o lucro de uma OS, o lucro bruto de um
 * período, ou o valor recebido no dia —, ou `null` se a opção estiver desativada.
 * É só indicação ao gestor — não reserva dinheiro de fato.
 */
export function valorReserva(config: Configuracao, base: number): number | null {
  if (!config.reservaLucroAtiva) return null;
  return base * (config.reservaLucroPercentual / 100);
}
```

---

## Observações

### Onde está cada tela pedida

| Pedido | Arquivo real | Observação |
|---|---|---|
| Pátio | `src/app/page.tsx` (aba **Operação**, lista "Pátio") e `src/app/os/page.tsx` (aba "Pátio", rota `/os?status=patio`) | Não existe uma rota `/patio`. A versão com dias parado (pílula `.idade`) é a do Dashboard. |
| Orçamento e conversão em OS | `src/app/orcamentos/[id]/page.tsx` | A conversão é o botão verde **Converter em OS**. Antes de converter aparece uma confirmação do `useConfirmar` (`ui/Avisos.tsx`); depois, o app abre a OS nova. |
| OS aberta | `src/app/os/[id]/page.tsx` | Fotos em `src/components/Fotos.tsx`. Peças e mão de obra estão na tabela "Itens e serviços" do documento. |
| Documento da OS (tela) | O bloco `.documento` dentro de `src/app/os/[id]/page.tsx`, com o cabeçalho em `CabecalhoDocumento.tsx` | **A imagem do WhatsApp não é um print da tela.** Ela sai do PDF (`OSPdfDocument.tsx`), convertido em PNG por `lib/pdf-para-imagem.ts` (pdf.js, escala 3x). Os dois layouts são parecidos, mas o PDF usa Helvetica e uma paleta própria (`#18181b`, `#52525b`, `#e4e4e7`…). |
| Fiado / contas a receber | `src/app/contas-receber/page.tsx` | As faixas de atraso são os cartões `FaixaCard` (0 a 15, 16 a 30, 31 a 60 e mais de 60 dias), com as classes `.idade-1` a `.idade-4`. |
| Painel financeiro | `src/app/page.tsx` (aba **Resultado**) e `src/app/despesas/page.tsx` com `components/despesas/ControleDeGastos.tsx` | O ponto de equilíbrio é o `PainelEquilibrio`, dentro de `ControleDeGastos.tsx`. |

Os caminhos citados no pedido também são outros: `LogoBoxOS.tsx` fica em `src/components/marca/`, e `Icones.tsx` e `Botao.tsx` ficam em `src/components/ui/`.

### Stack e dependências visuais

- **Next.js 16** (App Router), **React 19**, TypeScript.
- **Tailwind CSS 3.4**, configurado em `tailwind.config.ts`. **Não existe bloco `@theme`**: isso é do Tailwind 4, e o projeto está no 3.
- `clsx` + `tailwind-merge`, combinados na função `cn()` de `lib/utils.ts`.
- **Fonte:** Poppins, pesos 600 e 700, via `next/font/google`, e só na logo e nos `h1`. O resto do texto usa a fonte do sistema (`ui-sans-serif, system-ui…`). Fora do Next, carregue a Poppins pelo Google Fonts e defina `--fonte-marca`.
- **Ícones:** SVGs próprios (`ui/Icones.tsx`), com traço 2 e `currentColor`. Não há biblioteca de ícones. `CopiarVeiculo`, `BaixarComprovante` e `Fotos` trazem alguns SVGs embutidos.
- **Gráficos:** nenhuma biblioteca. As barras são `div`s com largura em %: "Distribuição no período" no Dashboard, "Por categoria" e a barra do ponto de equilíbrio no Controle de gastos.
- **PDF:** `@react-pdf/renderer` 4.5. **PDF em imagem:** `pdfjs-dist` 6.3, que precisa do worker em `/pdfjs/pdf.worker.min.mjs`.
- **Animações do próprio app:** só `animate-pulse` e `.esqueleto` (carregamento), a gaveta do menu (`drawer-in`, 0,2 s), `blur-sm` na "Visão interna" escondida e `transition-colors`. O vídeo pode criar as suas sem conflito.

### Tokens e tema

- Os tokens são trios RGB sem vírgula (`--brand-600: 242 169 0`). Use `rgb(var(--brand-600))`, ou `rgb(var(--brand-600) / 0.2)` com transparência.
- Laranja da marca: `#F2A900`. Grafite: `#1E2329`. Texto sobre o laranja é escuro (`brand-fg` = `#18181B`), nunca branco. Texto **na cor** da marca usa `brand-texto`: `#966900` no tema claro e `#F2A900` no escuro.
- Tema escuro: atributo `data-tema="escuro"` no `<html>`, ou `prefers-color-scheme: dark` quando não há atributo. Os componentes não usam `dark:`; só as variáveis mudam.
- Os documentos usam a cor da oficina (`--doc-cor` e `--doc-texto`), escrita por `estiloDoDocumento()`. O padrão é o próprio laranja boxOS.

### Logo

- No app, use `LogoBoxOS` / `SimboloBoxOS` / `IconeBoxOS`, que estão em `LogoBoxOS.tsx`.
- **Cuidado:** nos SVGs horizontais de `public/brand/`, o "boxOS" é `<text font-family="Poppins">`, e não um contorno. Num editor de vídeo sem a Poppins instalada, o texto aparece em outra fonte. Instale a Poppins Bold ou converta o texto em curvas.
- O símbolo tem proporção 70:57. O ícone do app é o símbolo sobre um quadrado grafite com cantos de raio 14/64.

### O que foi removido ou não incluído

- **Removido das telas** (comentários `// [removido: …]`): chamadas `fetch` às rotas `/api/...`, consultas Prisma das páginas de servidor, autenticação (`exigirOficina`, `exigirDono`, logout), envio de fotos e validação dos modais. JSX, classes e estrutura ficaram intactos. Alguns `import` sem uso continuam no topo dos arquivos.
- **Hooks e componentes citados, mas sem arquivo no pacote:**

  | Hook ou componente | O que faz | Valor a usar no vídeo |
  |---|---|---|
  | `usePodeFinanceiro()`, `usePodeExcluir()` (`UsuarioProvider`) | Devolvem `boolean` | `true` (visão do dono) |
  | `useConfiguracao()`, `carregarConfiguracao()` | Devolvem a `Configuracao` | Bloco `configuracao` dos dados fictícios |
  | `usePedirSaida()` (`SaidaSegura`) | Confirma a saída com formulário preenchido | Pode ignorar |
  | `NotificacaoSino` (`ui/Notificacoes`) | Sino de avisos do menu | Pode ignorar |
  | `SeletorTema` (`ui/Tema`) | Três botões Claro / Automático / Escuro no rodapé do menu | Pode ignorar |

- Também ficaram de fora:
  - os modais do Controle de gastos (`ModalGasto`, `ModalPagamento`, `ModalFixar`, `ModalFixas`, `ModalCategorias` e `ModalExcluirParcela`), que só aparecem ao clicar;
  - `OrcamentoPdfDocument.tsx`, o PDF do orçamento, que tem a mesma estrutura do PDF da OS (incluído) com título "Orçamento" e validade;
  - as libs técnicas `foto-pdf`, `image-compress`, `tempo-limite` e `permissoes`.
- **Do `constants.ts`, a parte 1 traz só `corStatus()` e `OS_STATUS`, como pedido.** O restante que as telas usam, em resumo:

  | Constante | Valores |
  |---|---|
  | `labelStatus` (OS) | Aberta, Em andamento, Ag. peça, Entregue, Cancelada |
  | Status do orçamento (`corStatusOrcamento` / `labelStatusOrcamento`) | Pendente (`status-aberta`), Aprovado (`status-entregue`), Recusado (`status-inerte`), Convertido (`status-andamento`) |
  | `corMargem(margem%)` | ≥ 40 → `text-ok`; ≥ 20 → `text-atencao`; abaixo de 20 → `text-perigo`; sem valor → `text-tinta-3` |
  | `margemOS` | `lucroReal / total × 100` |
  | `FORMAS_PAGAMENTO` | Dinheiro, PIX, Cartão de crédito, Cartão de débito, Transferência |
  | `FOTO_TIPOS` | Entrada ("Estado do veículo na chegada"), Serviço ("Peças trocadas, antes e depois"), Saída ("Estado do veículo na entrega") |
  | `anoVeiculo` | "fabricação/modelo", ex.: `2021/2022` |
  | `textoVeiculo` | O texto do botão "Copiar carro": modelo, motor e válvulas na 1ª linha; depois `Ano:`, `Combustível:` e `KM:` |

### Dados fictícios: como usar

- Todos os nomes, placas, telefones, CPFs e valores são **inventados**, e a oficina é "Box 47 Mecânica". Nada veio do banco.
- **"Hoje" é 07/10/2026.** Os dias parado e os dias em atraso foram calculados a partir dessa data. Para o vídeo, fixe `Date.now()` nesse dia, ou os números mudam.
- As datas estão em ISO. Os componentes do Controle de gastos esperam objetos `Date`, então converta com `new Date(...)`.
- As fotos apontam para `/video/fotos/*.jpg`, que **não existem**: coloque imagens próprias nesses caminhos. `configuracao.logoUrl` é `null`, então o cabeçalho do documento sai sem logo; para mostrar uma, use uma logo **fictícia**.
- O mês do painel é **Setembro/2026**, com o Dashboard em `periodo=mes&offset=-1`. Os totais do Dashboard, do DRE e do ponto de equilíbrio fecham entre si; `dashboardResultado.resumoCalculado` traz os números que a tela deve mostrar, para conferência.
- `osAberta` é a OS #1298 do pátio, aberta em detalhe. `orcamento.aposConversao` mostra os campos que mudam depois do clique em **Converter em OS**.

### Segurança

- Nenhum `.env`, chave, token, URL de banco, migration ou código de API entrou no pacote.
- Os arquivos listados **não continham segredos**, e nenhuma linha precisou ser omitida por isso. As rotas internas aparecem só como texto nos comentários de remoção (ex.: `/api/os/:id`), sem domínio.
