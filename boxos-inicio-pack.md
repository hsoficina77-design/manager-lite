# boxOS: pacote da tela Início (para o vídeo)

Material para recriar e explicar a tela **Início** do boxOS fora do repositório. Tudo o que está aqui foi conferido no código em 13/10/2026 (branch `master`, commit `93ccf68`, já enviado ao `hs-oficina/master`).

> **Sobre versões:** a tela Início entrou em três commits do dia 13/10: `877a398` (a tela), `21925d2` (Novo cliente primeiro) e `93ccf68` (Novo cliente em laranja, "Dashboard" vira "Resumo", volta automática ao Início). Este pacote descreve a versão de `93ccf68`. Se o servidor de produção ainda não tiver feito o deploy desse último commit, a tela real ainda vai mostrar "Dashboard" e o Nova OS em laranja: confira antes de gravar.

---

## Índice

| Seção | Conteúdo | Tamanho aprox. |
|---|---|---|
| Parte 1 | O que é a tela Início (linguagem de oficina) | ~14 KB |
| Parte 2 | Roteiro de um dia de trabalho | ~5 KB |
| Parte 3 | Pontos fortes para vender | ~2 KB |
| Parte 4 | Código visual | ~62 KB |
| &nbsp;&nbsp;`src/app/page.tsx` | A página do Início | ~4 KB |
| &nbsp;&nbsp;`src/components/inicio/Atalhos.tsx` | Cartões "Começar", "Tudo do boxOS" e "Como funciona" | ~19 KB |
| &nbsp;&nbsp;`src/components/ui/Ajuda.tsx` | O botão "?" e a janela de explicação (novo) | ~4,5 KB |
| &nbsp;&nbsp;`src/components/ui/Icones.tsx` (trecho) | Os 5 ícones novos e a base dos ícones | ~2,5 KB |
| &nbsp;&nbsp;`src/components/Sidebar.tsx` | Menu lateral, barra do topo no celular e gaveta (alterado) | ~12 KB |
| &nbsp;&nbsp;`src/components/ui/BarraInferior.tsx` | Barra de baixo do celular (alterada) | ~3 KB |
| &nbsp;&nbsp;`src/components/ui/Notificacoes.tsx` | O sino (não mudou, mas não tinha ido antes) | ~6 KB |
| &nbsp;&nbsp;`src/components/plano/AvisoDePlano.tsx` | Faixa do teste grátis no topo (não tinha ido antes) | ~3 KB |
| &nbsp;&nbsp;`src/app/layout.tsx` (trecho) | A casca: onde entram menu, faixa e conteúdo | ~2 KB |
| Parte 5 | Dados fictícios (JSON) | ~9 KB |
| Observações | Incompleto, limitações, celular x computador, dependências | ~6 KB |

Arquivo único, ~85 KB no total.

---

## Parte 1: O que é a tela Início

### 1. Propósito

**Para que serve:** é a tela de partida do boxOS. Ela responde "o que eu faço agora?" e mostra onde fica cada coisa do sistema, com uma frase simples e um **"?"** em cada cartão que explica para que aquilo serve. Foi pensada para o mecânico que não lida bem com tecnologia.

**É a primeira tela depois do login?** Sim. O login, o cadastro de oficina nova e o ícone do app instalado no celular (endereço inicial `/`) levam para ela. Se o login foi aberto a partir de outra tela (ex.: um link direto para uma OS), volta para essa tela.

**O que ela substituiu:** antes, o app abria direto no **Dashboard** (o pátio com os carros e os números). O Dashboard não sumiu: mudou de endereço (`/painel`) e de nome, virando **"Resumo"**. No celular, o primeiro botão da barra de baixo era "Pátio" e virou "Início".

**O que mudou na prática:**
- A primeira tela **não mostra dinheiro nenhum**. Só mostra avisos que pedem uma ação (carros no pátio, OS esperando peça, orçamentos pendentes, peças para repor, contas em aberto).
- Cada lugar do sistema virou um cartão grande, com o **mesmo nome, ícone e ordem do menu lateral**, de propósito: quem aprende o cartão "Caixa" aqui reconhece o mesmo item no menu.
- Existe ajuda embutida: o botão **"Como funciona"** e um **"?"** em cada cartão.

### 2. Blocos da tela, de cima para baixo

#### Bloco A: Saudação + "Como funciona"
- **Na tela:** "Bom dia, Rafael" (ou "Boa tarde" / "Boa noite") e, embaixo, a data por extenso ("Terça-feira, 13 de outubro").
- **De onde vem:** o primeiro nome de quem está logado e a hora de Brasília. Bom dia das 5h às 11h59, boa tarde das 12h às 17h59, boa noite no resto.
- **À direita, botão "Como funciona"** (no celular aparece só o "?" redondo). Ao tocar, abre uma janela "Como funciona o boxOS" com o caminho do carro em 4 passos numerados:
  1. Cadastre o cliente e o carro, só na primeira vez. Dá para fazer dentro da própria OS.
  2. Se o cliente quiser saber o preço antes, faça um orçamento.
  3. Abra a OS e lance as peças e os serviços.
  4. Quando o carro sair, marque a OS como entregue e registre o pagamento.

  E uma dica: "Ficou em dúvida sobre alguma parte? Toque no ? do cartão dela, aqui no início." O único botão é **"Entendi"**, que fecha a janela.

#### Bloco B: "COMEÇAR" (3 cartões de criar)
Três cartões grandes, na ordem do caminho do carro. O primeiro é laranja, os outros são brancos.

| Cartão | Frase | Toque no cartão | "?" do cartão |
|---|---|---|---|
| **Novo cliente** (laranja) | Cadastrar o cliente e o carro | Abre o cadastro de cliente (`/clientes/novo`) | Explica que basta cadastrar uma vez e depois procurar por nome ou placa. Dica: "Para começar bastam o nome, o telefone e o carro." Botão **"Cadastrar cliente →"** |
| **Nova OS** | O carro chegou para o serviço | Abre uma OS nova (`/os/nova`) | Explica o que é a OS + 3 passos (escolher cliente e carro, lançar peças e serviços, salvar e marcar como entregue quando o carro sair). Dica: dá para cadastrar o cliente novo dentro da própria OS. Botão **"Abrir nova OS →"** |
| **Novo orçamento** | Passar o preço antes de fazer | Abre um orçamento novo (`/orcamentos/novo`) | Explica que não precisa ter o cliente cadastrado + 3 passos (preencher, mandar o PDF, converter em OS quando aprovar). Botão **"Fazer orçamento →"** |

Toda janela de "?" tem dois botões: **"Entendi"** (fecha) e o de ir direto para a tela explicada.

#### Bloco C: "TUDO DO BOXOS" (cartões de destino)
Subtítulo: "Os mesmos lugares do menu. Na dúvida, toque no **?** para saber para que serve cada um."

Uma grade de cartões, um para cada lugar do sistema, na ordem do menu. Cada cartão tem ícone, nome, uma frase, às vezes uma **pílula de aviso** no pé, e um "?" no canto. Ao passar o dedo ou o mouse, o ícone acende em laranja.

| Cartão | Frase | Pílula de aviso (quando aparece) | Cor da pílula | Leva para | Quem vê |
|---|---|---|---|---|---|
| **Resumo** | Carros no pátio, entregas e lucro do mês *(sem financeiro: "Carros no pátio e entregas do dia")* | "N carros no pátio" se houver algum | cinza | `/painel` | todos |
| **Clientes** | Quem já veio, com os carros e o histórico | não tem | — | `/clientes` | todos |
| **Ordens de serviço** | Todas as OS, das abertas às entregues | "N esperando peça" | amarela | `/os` | todos |
| **Orçamentos** | Preços passados, esperando o sim do cliente | "N pendentes" | cinza | `/orcamentos` | todos |
| **Mecânicos** | A equipe da oficina | não tem | — | `/mecanicos` | todos |
| **Produtividade** | Quanto cada mecânico produziu | não tem | — | `/produtividade` | só o dono |
| **Estoque** | Peças na prateleira e o que precisa repor | "N peças para repor" | amarela | `/estoque` | todos |
| **Contas a receber** | Quem está devendo e quanto | "N contas em aberto" | vermelha | `/contas-receber` | dono e operador com Financeiro |
| **Controle de gastos** | As contas da oficina: aluguel, luz, fornecedor | não tem | — | `/despesas` | dono e operador com Financeiro |
| **Caixa** | O dinheiro que entrou no dia | não tem | — | `/caixa` | dono e operador com Financeiro |
| **Configurações** | Dados da oficina, logo e acessos | não tem | — | `/configuracoes` | só o dono |

**Como cada número é calculado (em linguagem simples):**
- **Carros no pátio:** todas as OS que ainda não foram entregues, ou seja, nas situações *Aberta*, *Em andamento* ou *Aguardando peça*. Não importa a data: é o estado da oficina agora.
- **Esperando peça:** as OS na situação *Aguardando peça*.
- **Orçamentos pendentes:** orçamentos que ainda esperam a resposta do cliente (situação *Pendente*).
- **Peças para repor:** peças ativas do estoque que estão **zeradas**, ou que têm estoque mínimo cadastrado e já chegaram nele ou abaixo. É a mesma regra do filtro "Precisa repor" da tela de Estoque, então os números batem.
- **Contas em aberto:** OS **entregues** que ainda não foram pagas por completo, mais as dívidas avulsas não pagas. É o **mesmo número** da bolinha vermelha do menu, então os dois sempre batem. Conta **quantas contas**, não quantos clientes nem quanto dinheiro.

Os números são calculados toda vez que a tela abre. Não atualizam sozinhos com a tela parada: é preciso abrir de novo ou recarregar.

**Cada "?" dos destinos** abre uma janela curta com para que serve, às vezes uma dica, e o botão **"Abrir [nome] →"**. Exemplos de texto real:
- Caixa: "O fechamento do dia: tudo o que a oficina recebeu, separado por forma de pagamento — dinheiro, Pix, cartão." Dica: "Use no fim do expediente para conferir se o dinheiro da gaveta bate."
- Contas a receber: "Todo cliente que levou o carro sem pagar tudo aparece aqui — o fiado. [...]" Dica: "Dívida que não veio de uma OS também pode ser lançada aqui."
- Estoque: "[...] Quando uma OS é entregue, as peças usadas nela saem do estoque sozinhas." Dica sobre estoque mínimo.
(O texto completo de todos está no código da Parte 4.)

### 3. Atalhos e ações rápidas

O Início **não executa nenhuma ação sozinho**: não registra pagamento, não busca, não muda status. Todo botão **leva para outra tela**. São estes:

| Botão | Onde | Caminho |
|---|---|---|
| Novo cliente | Cartão laranja, bloco Começar | `/clientes/novo` |
| Nova OS | Bloco Começar | `/os/nova` |
| Novo orçamento | Bloco Começar | `/orcamentos/novo` |
| Nova OS (botão "+" laranja central) | Barra de baixo, só no celular | `/os/nova` |
| 11 cartões de destino | Bloco Tudo do boxOS | ver tabela acima |
| "?" de cada cartão + botão "Ir para" da janela | Em todos os cartões | o mesmo destino do cartão |
| Como funciona | Topo, à direita | só abre a janela, sem botão de ir |

**Não existe no Início:** busca, "registrar pagamento", "novo gasto", lista de carros, gráfico. A busca fica dentro de Clientes, OS e Orçamentos. O pagamento é registrado dentro da OS ou em Contas a receber.

### 4. Avisos e pendências

**Dentro do Início** (as pílulas dos cartões):

| Aviso | Quando aparece |
|---|---|
| "N carros no pátio" (cinza) | há pelo menos 1 OS não entregue |
| "N esperando peça" (amarelo) | há pelo menos 1 OS em *Aguardando peça* |
| "N pendentes" (cinza) | há pelo menos 1 orçamento *Pendente* |
| "N peças para repor" (amarelo) | há pelo menos 1 peça zerada ou no mínimo |
| "N contas em aberto" (vermelho) | há fiado e quem está logado vê o financeiro |

Com zero, a pílula some. Não existe "tudo certo".

**Por cima do Início** (aparecem em todas as telas, inclusive nela):

| Aviso | Onde | Quando aparece |
|---|---|---|
| Faixa "Teste grátis: faltam N dias." | Faixa no topo do conteúdo | Oficina em teste (30 dias). Cinza; fica amarela com 2 dias ou menos; no último dia, "Teste grátis: este é o último dia." O dono vê o botão **"Assinar o boxOS"** |
| Faixa vermelha "Seu período de teste terminou..." | Topo | Teste acabou: a oficina fica só para consulta. Dono: botão "Assinar e voltar a registrar". Operador: "Fale com o dono da oficina." |
| Faixa "Seu mês pago termina em N dias." | Topo | Assinante que paga por **Pix**, a 5 dias ou menos do vencimento (cartão renova sozinho, não aparece) |
| Faixa vermelha "Não identificamos o pagamento deste mês..." | Topo | Assinante com pagamento atrasado, nos 3 dias de carência |
| Bolinha vermelha com número | Menu lateral (item Contas a receber) e barra do topo no celular | Mesmo número das contas em aberto; só para quem vê o financeiro. No celular, tocar nela leva a Contas a receber |
| Sino com número | Topo do menu (computador) e barra do topo (celular) | Notificações não lidas. Hoje o sistema só gera, para a oficina, o aviso de **espaço de fotos**: "Armazenamento chegando ao limite" e "Armazenamento quase cheio", só para o dono, levando a Configurações. O sino confere a cada 60 segundos |
| Janela "Período de teste encerrado" | Modal | Em modo só leitura, quando alguém tenta salvar algo. Tocar em Nova OS / Novo cliente / Novo orçamento mostra esse aviso no lugar do formulário |

**O que NÃO aparece no Início** (mesmo que o pedido do vídeo cite): carro parado há muito tempo (isso fica no **Resumo**, aba Operação, com o mais antigo no topo), valor do fiado, conta vencida com data, caixa do dia, números do mês. O Início só conta quantidades.

### 5. Estados da tela

- **Oficina nova, sem dados:** a tela fica igual, só que **sem nenhuma pílula de aviso** (todas as contagens dão zero). Os cartões, o "?" e o "Como funciona" estão lá do mesmo jeito.
- **Onboarding / checklist de primeiros passos:** **não existe.** Não há tutorial que abre sozinho, nem lista de tarefas, nem tela vazia especial. O que faz o papel de guia é: o cartão laranja "Novo cliente" como primeiro passo óbvio, a janela "Como funciona" (só abre se a pessoa tocar) e os "?" de cada cartão.
- **Dia cheio:** os mesmos cartões, agora com as pílulas acesas (ex.: "6 carros no pátio", "2 esperando peça", "3 pendentes", "2 peças para repor", "4 contas em aberto"). O layout não muda e não há lista de carros: o Início continua "limpo"; os detalhes ficam um toque adiante.
- **Volta automática ao Início:** se a pessoa sai do app (botão de início do celular, troca de aba) e passa **5 minutos ou mais** fora, ao voltar o app reabre no Início. Exceções: não troca de tela se ela estiver numa tela de criar ou editar (Nova OS, Novo cliente, editar...), em Configurações, na Assinatura, ou se houver alteração não salva. Uma espiada rápida no WhatsApp (menos de 5 min) não conta.

### 6. Diferenças por perfil

| | Dono | Operador **com** Financeiro | Operador **sem** Financeiro |
|---|---|---|---|
| Saudação, data, Como funciona | sim | sim | sim |
| 3 cartões de Começar | sim | sim | sim |
| Cartões de destino | **11** | **9** (sem Produtividade e Configurações) | **6** (Resumo, Clientes, OS, Orçamentos, Mecânicos, Estoque) |
| Frase do cartão Resumo | "Carros no pátio, entregas e lucro do mês" | igual ao dono | "Carros no pátio e entregas do dia" |
| Pílula "contas em aberto" | sim | sim | não (nem é calculada) |
| Bolinha vermelha no menu/topo | sim | sim | não |
| Botão de assinar na faixa do teste | sim | não | não |

Observação: esconder o cartão é só conforto. Quem barra de verdade é o servidor: se um operador sem Financeiro abrir `/caixa` pelo endereço, volta para o Início.

**Detalhe do celular:** a barra de baixo é **igual para todo mundo**, inclusive "A receber" e "Gastos". Um operador sem Financeiro que toca nesses dois botões é **devolvido ao Início** (não aparece mensagem de erro). (O comentário no código ainda diz "devolvido ao pátio", mas o redirecionamento real é para `/`, que hoje é o Início.)

### 7. Celular x computador

| | Celular (< 768 px) | Computador (≥ 768 px) |
|---|---|---|
| Menu | Barra fixa no topo (☰, símbolo boxOS, nome da oficina, bolinha vermelha, sino) + gaveta lateral ao tocar no ☰ | Menu lateral fixo à esquerda (224 px) com a logo boxOS, nome da oficina e sino em cima, itens no meio, tema/Configurações/usuário/Sair embaixo |
| Barra de baixo | Sim: **Início · OS · (+) Nova OS · A receber · Gastos** | Não existe |
| Botão Como funciona | Só o "?" redondo | "? Como funciona" com texto (a partir de 640 px) |
| Cartões de Começar | Um embaixo do outro, em linha larga (ícone à esquerda, texto, "?" à direita). Assim até 1024 px | A partir de 1024 px: **3 lado a lado**, mais altos, ícone em cima e texto embaixo; o "?" sobe para o canto superior direito |
| Cartões de destino | **2 colunas** | **3 colunas** a partir de 640 px; **4 colunas** a partir de 1024 px |
| Janela do "?" | Botões empilhados, o de "Ir para" em cima | Botões em linha, "Ir para" à direita |
| Margens | 16 px | 24 px; conteúdo limitado a ~1152 px de largura |

A ordem dos blocos é a mesma nas duas telas (saudação → Começar → Tudo do boxOS).

### 8. Personalização

**Nenhuma.** Não dá para esconder, reordenar nem configurar blocos. Não há filtro nem período no Início. A única coisa que muda sozinha é o que cada perfil vê (item 6). O tema claro/escuro/automático (no rodapé do menu) vale para o app inteiro, inclusive o Início.

### 9. Integração com o resto do app

- **Pátio:** o Início não lista os carros; o cartão **Resumo** mostra quantos estão no pátio e leva ao `/painel`, aba **Operação**, onde ficam os carros do pátio com o mais parado no topo e o realizado do dia ("Hoje"). Quem vê o financeiro abre direto na aba **Resultado** (faturamento, lucro, DRE).
- **OS:** "Nova OS" (cartão e botão "+" do celular) e o cartão **Ordens de serviço**, com a pílula de "esperando peça".
- **Orçamentos:** "Novo orçamento" e o cartão **Orçamentos**, com a pílula de pendentes.
- **Clientes:** "Novo cliente" (o primeiro passo, em destaque) e o cartão **Clientes**.
- **Contas a receber:** cartão com a pílula vermelha; mesmo número da bolinha do menu.
- **Caixa:** só o cartão (sem número no Início).
- **Estoque:** cartão com a pílula de "peças para repor".
- **Controle de gastos:** só o cartão; no celular também está na barra de baixo como "Gastos".
- **Dashboard:** virou **Resumo** (`/painel`); é um destino do Início, não mais a primeira tela.

---

## Parte 2: Roteiro de uso sugerido (um dia de trabalho)

Sugestão para o vídeo, usando só o que existe. Perfil: **dono**, no **celular**.

1. **Abrir o app de manhã.** Toque no ícone do boxOS. O app abre no Início: "Bom dia, Rafael — Quarta-feira, 14 de outubro". Faixa no topo: "Teste grátis: faltam 4 dias." *(se a oficina estiver em teste)*
2. **Ver o que pede atenção, sem abrir nada.** Passe o olho pelas pílulas: "6 carros no pátio", "2 esperando peça", "3 pendentes", "2 peças para repor", "4 contas em aberto".
3. **Primeira vez? Tocar em "Como funciona".** Toque no "?" ao lado da saudação → aparecem os 4 passos do caminho do carro → **Entendi**.
4. **Chegou um cliente novo.** Toque no cartão laranja **Novo cliente** → preencha nome, telefone e carro → salvar. *(Alternativa: tocar em Nova OS e usar "Novo cliente" ao lado do campo de cliente, sem sair da OS.)*
5. **Abrir a OS do carro.** Volte ao Início pelo botão **Início** da barra de baixo → toque em **Nova OS** (ou no "+" central da barra) → escolha o cliente e o carro, lance peças e serviços → salvar.
6. **Ver quem está esperando peça.** Início → cartão **Ordens de serviço** (pílula amarela "2 esperando peça") → abra a OS e mude o andamento quando a peça chegar.
7. **Cobrar o orçamento parado.** Início → cartão **Orçamentos** ("3 pendentes") → abra um → cliente aprovou → **Converter em OS**.
8. **Receber de quem está devendo.** Toque em **A receber** na barra de baixo (ou no cartão **Contas a receber**, pílula vermelha "4 contas em aberto") → escolha o cliente → registre o pagamento.
9. **Repor peça.** Início → cartão **Estoque** ("2 peças para repor") → filtro Precisa repor → confira o que comprar.
10. **Fechar o dia.** Início → cartão **Caixa** → confira o que entrou por forma de pagamento (dinheiro, Pix, cartão) e se a gaveta bate. Para ver o mês: Início → **Resumo** → aba Resultado.

Bônus: mostrar que, depois de deixar o app de lado por mais de 5 minutos, ao voltar ele reabre no Início.

---

## Parte 3: Pontos fortes para vender

1. **Abre e já sabe o que fazer.** Os três primeiros botões são o caminho do carro: cliente, OS, orçamento.
2. **Nada esquecido.** Carro esperando peça, orçamento sem resposta, peça acabando e fiado aparecem como avisos, sem precisar procurar.
3. **Ajuda em cada canto.** Um "?" em cada cartão explica para que serve, sem manual nem treinamento.
4. **Sem número que assusta.** A primeira tela não mostra dinheiro: quem vê é o funcionário, e o lucro fica com o dono.
5. **Cada um vê o seu.** O dono vê tudo; o funcionário só vê o que pode usar.
6. **Aprende uma vez, usa em todo lugar.** Mesmos nomes e ícones do menu: com o tempo, a pessoa vai direto.
7. **Feito para o celular na mão suja de graxa.** Cartões grandes, fáceis de acertar com o polegar, e a Nova OS sempre no centro da barra de baixo.
8. **Se perdeu? Volta para o começo.** Um toque em "Início". E o app volta sozinho para lá depois de 5 minutos parado.

---

## Parte 4: Código visual

**Stack visual:** Next.js 16 (App Router), React 19, Tailwind CSS 3.4, `clsx` + `tailwind-merge` (função `cn`). **Nenhuma biblioteca de ícones ou gráficos de terceiros**: os ícones são SVG próprios (`Icones.tsx`), traço de 2 px, 24×24, `currentColor`. A tela Início **não tem gráfico**.

**Enviados em 07/10/2026 (`boxos-video-pack-1.md`) e que NÃO mudaram desde então, por isso não estão repetidos:**
`src/app/globals.css` (tokens de cor: `brand-*`, `tinta*`, `superficie*`, `linha*`, `atencao*`, `perigo*`, `menu*`), `tailwind.config.ts`, `src/components/marca/LogoBoxOS.tsx` (`LogoBoxOS`, `SimboloBoxOS`), `src/components/ui/Botao.tsx` (`Botao`, `BotaoLink`), `src/components/ui/Modal.tsx`, `src/components/ui/Campos.tsx`, `src/components/ui/Avisos.tsx`, `src/components/ui/Tema.tsx` (`SeletorTema`), `src/lib/utils.ts` (`cn`), e o restante de `Icones.tsx`.

**Mudaram ou são novos, incluídos abaixo:** `page.tsx` (Início), `inicio/Atalhos.tsx`, `ui/Ajuda.tsx`, os 5 ícones novos de `Icones.tsx`, `Sidebar.tsx`, `ui/BarraInferior.tsx`, trecho do `layout.tsx`. E dois que não mudaram mas não tinham ido no pacote anterior e aparecem no Início: `ui/Notificacoes.tsx` e `plano/AvisoDePlano.tsx`.

**Também mudaram, mas sem efeito visual (não incluídos):** `ui/SaidaSegura.tsx` (ganhou só uma consulta `useTemPendencia`, usada pela volta automática) e `VoltaAoInicio.tsx` (componente sem visual, `return null`; o comportamento está descrito na Parte 1, item 5).

### src/app/page.tsx

```tsx
// [removido: imports de auth, Prisma e cálculos — exigirOficina, osNoPatio, contarPendencias, precisaRepor]
import {
  AcoesDoInicio,
  ComoFunciona,
  DestinosDoInicio,
  type Contagens,
} from "@/components/inicio/Atalhos";

// Tela inicial: é onde o app abre, no celular e no computador.
//
// O Resumo (/painel, o antigo Dashboard) responde "como está a oficina"; esta tela responde a
// pergunta de antes, "o que eu faço agora", e mostra onde fica cada coisa. Ela não tem
// número de dinheiro nenhum — só os avisos que pedem uma ação (carro esperando peça,
// orçamento sem resposta, peça para repor, conta em aberto).

/** O fuso da oficina. O servidor roda em UTC (ver lib/periodo). */
const FUSO = "America/Sao_Paulo";

export default async function Inicio() {
  // [removido: busca de dados]
  // Vem da sessão: usuario.nome, usuario.papel ("ADMIN" = dono), usuario.podeFinanceiro.
  // Vem do banco (contagens):
  //   patio               = OS com status ABERTA, EM_ANDAMENTO ou AGUARDANDO_PECA
  //   aguardandoPeca      = OS com status AGUARDANDO_PECA
  //   orcamentosPendentes = orçamentos com status PENDENTE
  //   paraRepor           = peças ativas com quantidade <= 0, ou com estoqueMinimo > 0 e quantidade <= estoqueMinimo
  //   contasEmAberto      = (OS ENTREGUE e não paga) + (dívidas avulsas não pagas); null para quem não vê o financeiro
  const ehDono = usuario.papel === "ADMIN";
  const { podeFinanceiro } = usuario;

  const contagens: Contagens = {
    patio,
    aguardandoPeca,
    orcamentosPendentes,
    paraRepor,
    contasEmAberto,
  };

  const agora = new Date();
  const primeiroNome = usuario.nome.trim().split(/\s+/)[0] ?? "";

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-tinta">
            {saudacao(agora)}
            {primeiroNome && `, ${primeiroNome}`}
          </h1>
          <p className="mt-0.5 text-sm text-tinta-3">{dataPorExtenso(agora)}</p>
        </div>
        <ComoFunciona />
      </div>

      <section aria-labelledby="inicio-comecar" className="space-y-3">
        <h2 id="inicio-comecar" className="text-xs font-semibold uppercase tracking-wide text-tinta-3">
          Começar
        </h2>
        <AcoesDoInicio />
      </section>

      <section aria-labelledby="inicio-destinos" className="space-y-3">
        <div>
          <h2 id="inicio-destinos" className="text-xs font-semibold uppercase tracking-wide text-tinta-3">
            Tudo do boxOS
          </h2>
          <p className="mt-1 text-sm text-tinta-3">
            Os mesmos lugares do menu. Na dúvida, toque no <span className="font-semibold">?</span> para
            saber para que serve cada um.
          </p>
        </div>
        <DestinosDoInicio podeFinanceiro={podeFinanceiro} ehDono={ehDono} contagens={contagens} />
      </section>
    </div>
  );
}

function saudacao(agora: Date): string {
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: FUSO })
      .formatToParts(agora)
      .find((p) => p.type === "hour")?.value ?? 12
  );
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

/** "Terça-feira, 13 de outubro". */
function dataPorExtenso(agora: Date): string {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: FUSO,
  }).format(agora);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
```

### src/components/inicio/Atalhos.tsx

```tsx
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
 * "Contas a receber" até entrar. Aqui cada lugar do sistema vira um cartão grande com o nome,
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
  /** O cartão em laranja. */
  destaque?: boolean;
};

// A ordem é a do caminho do carro: primeiro o cliente, depois a OS. Quem não conhece o
// sistema e começa pela OS de um cliente que ainda não existe se perde — com o
// cadastro na frente e em destaque, o primeiro passo é o óbvio. (Mesmo começando pela
// OS, o cliente novo pode ser cadastrado lá dentro.)
const ACOES: Acao[] = [
  {
    href: "/clientes/novo",
    titulo: "Novo cliente",
    resumo: "Cadastrar o cliente e o carro",
    Icone: PessoaMais,
    irPara: "Cadastrar cliente",
    destaque: true,
    ajuda: {
      titulo: "Novo cliente",
      texto:
        "Cadastre o cliente e o carro dele uma vez só. Quando ele voltar, é só procurar pelo nome ou pela placa — o histórico inteiro está lá.",
      dica: "Para começar bastam o nome, o telefone e o carro. O resto dá para completar depois.",
    },
  },
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
      dica: "Cliente novo? Não precisa sair da OS: toque em Novo cliente, ao lado do campo de cliente, e cadastre ele e o carro ali mesmo.",
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
];

/** Os três cartões de criar, na ordem do caminho do carro. */
export function AcoesDoInicio() {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {ACOES.map((acao) => (
        <CartaoAcao key={acao.href} acao={acao} destaque={!!acao.destaque} />
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
    // Era "Dashboard" — palavra que o mecânico não usa. "Resumo" diz o que tem lá.
    titulo: "Resumo",
    resumo: "Carros no pátio, entregas e lucro do mês",
    resumoSemFinanceiro: "Carros no pátio e entregas do dia",
    Icone: Patio,
    aviso: (c) => (c.patio > 0 ? { texto: plural(c.patio, "carro no pátio", "carros no pátio"), tom: "neutro" } : null),
    ajuda: {
      titulo: "Resumo da oficina",
      texto:
        "Como está a oficina, numa tela só. Na aba Operação ficam os carros que estão no pátio agora, com o que está parado há mais tempo no topo.",
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
        "Lance o que a oficina paga: aluguel, luz, água, fornecedor. As contas fixas se repetem todo mês sozinhas, e tudo entra na conta do lucro, no Resumo.",
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
    "Cadastre o cliente e o carro — só na primeira vez. Dá para fazer dentro da própria OS.",
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
```

### src/components/ui/Ajuda.tsx

Novo. Usa `Modal` e `Botao`/`BotaoLink`, que não mudaram (estão no pacote de 07/10).

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Botao, BotaoLink } from "./Botao";
import { Interrogacao, SetaDireita } from "./Icones";
import { Modal } from "./Modal";

/**
 * O "?" que explica uma parte do sistema em poucas linhas.
 *
 * Existe para quem não lida bem com tecnologia: em vez de adivinhar o que é "Caixa" ou
 * "Contas a receber" entrando em cada tela, a pessoa toca no "?" e lê para que serve,
 * quando usar e — se fizer sentido — já sai dali para o lugar certo.
 *
 * Abre no `Modal` do sistema, e não num balão preso ao botão: no celular o balão
 * ficaria pequeno demais para ler e fácil de fechar sem querer, e o modal já resolve
 * foco, Escape e rolagem. Pode ser usado em qualquer tela, não só na inicial.
 */

export type TextoDeAjuda = {
  titulo: string;
  /** Para que serve, em uma ou duas frases. */
  texto: string;
  /** Passo a passo curto, quando ajuda. Quatro itens no máximo — mais que isso ninguém lê. */
  passos?: string[];
  /** Observação no fim: pré-requisito, atalho, cuidado. */
  dica?: string;
};

export function BotaoAjuda({
  ajuda,
  acao,
  sobreMarca = false,
  className,
}: {
  ajuda: TextoDeAjuda;
  /** Botão no pé da explicação que leva direto ao lugar explicado. */
  acao?: { href: string; rotulo: string };
  /** O botão está sobre o fundo laranja (o cartão em destaque). */
  sobreMarca?: boolean;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={`O que é ${ajuda.titulo}?`}
        title="O que é isto?"
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
          sobreMarca
            ? "text-brand-fg/70 hover:bg-black/10 hover:text-brand-fg"
            : "text-tinta-3 hover:bg-superficie-3 hover:text-tinta",
          className
        )}
      >
        <Interrogacao tamanho={20} />
      </button>

      {aberto && <ModalDeAjuda ajuda={ajuda} acao={acao} onFechar={() => setAberto(false)} />}
    </>
  );
}

export function ModalDeAjuda({
  ajuda,
  acao,
  onFechar,
}: {
  ajuda: TextoDeAjuda;
  acao?: { href: string; rotulo: string };
  onFechar: () => void;
}) {
  return (
    <Modal
      titulo={ajuda.titulo}
      largura="max-w-sm"
      onFechar={onFechar}
      rodape={
        // Mesma regra dos outros modais: no celular empilha e a ação mais provável
        // fica em cima; no computador vira linha, com a principal à direita.
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Botao variante="secundario" onClick={onFechar} data-foco-inicial>
            Entendi
          </Botao>
          {acao && (
            <BotaoLink href={acao.href} onClick={onFechar}>
              {acao.rotulo} <SetaDireita tamanho={15} />
            </BotaoLink>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-sm leading-relaxed text-tinta-2">
        <p>{ajuda.texto}</p>

        {ajuda.passos && ajuda.passos.length > 0 && (
          <ol className="space-y-2.5">
            {ajuda.passos.map((passo, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-brand-fg"
                >
                  {i + 1}
                </span>
                <span className="pt-0.5">{passo}</span>
              </li>
            ))}
          </ol>
        )}

        {ajuda.dica && (
          <p className="rounded-lg border border-linha bg-superficie-2 px-3 py-2.5 text-tinta-2">
            {ajuda.dica}
          </p>
        )}
      </div>
    </Modal>
  );
}
```

### src/components/ui/Icones.tsx (trecho: base + ícones novos)

Só a função `Base` (para referência) e os 5 ícones novos do Início. Os demais usados no Início (`Patio`, `Pessoas`, `Recibo`, `Chave`, `Caixa`, `Dinheiro`, `Despesa`, `Cofre`, `Engrenagem`, `SetaDireita`, `Mais`, `Sino`, `Menu`, `Fechar`, `Chevron`, `Sair`) não mudaram e estão no pacote de 07/10. (Em 08/10 entraram também ícones da tela de assinatura, que não aparecem no Início.)

```tsx
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

/* --- tela inicial -----------------------------------------------------------
   Os destinos que não tinham ícone próprio no menu (Orçamentos e Produtividade são
   subitens), as ações de criar e a ajuda. */

/** Início — a tela de atalhos. */
export const Casa = (p: Props) => (
  <Base {...p}>
    <path d="m3 10 9-7 9 7" />
    <path d="M5 8.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V8.5" />
  </Base>
);

/** Ajuda — o "?" que explica para que serve cada coisa. */
export const Interrogacao = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </Base>
);

/** Orçamento — a prancheta com o preço anotado. */
export const Prancheta = (p: Props) => (
  <Base {...p}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M9 12h6" />
    <path d="M9 16h4" />
  </Base>
);

/** Novo cliente. */
export const PessoaMais = (p: Props) => (
  <Base {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6" />
    <path d="M22 11h-6" />
  </Base>
);

/** Produtividade — barras subindo. */
export const Grafico = (p: Props) => (
  <Base {...p}>
    <path d="M3 3v18h18" />
    <path d="M8 17v-4" />
    <path d="M13 17V9" />
    <path d="M18 17V5" />
  </Base>
);
```

### src/components/Sidebar.tsx

Mudou desde 07/10: ganhou o item **Início** (ícone `Casa`) no topo, e "Dashboard" virou **Resumo**. O resto é igual.

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { labelPapel, type Papel } from "@/lib/permissoes"; // labelPapel: "ADMIN" → "Dono", "OPERADOR" → "Operador"
import { LogoBoxOS, SimboloBoxOS } from "./marca/LogoBoxOS";
import { BarraInferior } from "./ui/BarraInferior";
import { NotificacaoSino } from "./ui/Notificacoes";
import { usePedirSaida } from "./ui/SaidaSegura";
import { SeletorTema } from "./ui/Tema";
import {
  Caixa,
  Casa,
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
  // para o mesmo lugar.
  const todosOsLinks: LinkDef[] = [
    // A tela de atalhos, onde o app abre. Exato: sem isto "/" acenderia em toda tela.
    { href: "/", label: "Início", exact: true, Icone: Casa },
    // Era "Dashboard": palavra de escritório, não de oficina.
    { href: "/painel", label: "Resumo", Icone: Patio },
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
    if (!(await pedirSaida())) return;
    setSaindo(true);
    // [removido: chamada de logout e redirecionamento para /login]
  }

  const isLinkActive = (link: LinkDef) =>
    link.exact ? pathname === link.href : pathname.startsWith(link.href);

  const toggleExpand = (href: string) =>
    setExpanded((prev) => ({ ...prev, [href]: !prev[href] }));

  // O menu é do sistema: logo boxOS em cima e a oficina logo abaixo, pequena — a
  // logo da oficina fica para os documentos.
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
      {/* Menu lateral do desktop. Fixo, porque quem rola é o documento. */}
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

Mudou desde 07/10: o primeiro botão era **Pátio** e virou **Início** (ícone `Casa`, aceso só em `/`).

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Casa, Despesa, Dinheiro, Mais, Recibo } from "./Icones";

/**
 * Navegação inferior do celular.
 *
 * Cinco posições fixas, sempre as mesmas, nesta ordem: Início, OS, Nova OS,
 * A receber, Gastos. A barra é a mesma para todo mundo; quem não tem acesso ao
 * financeiro e toca em A receber ou Gastos é devolvido ao Início pelo proxy.
 *
 * Some na impressão e no desktop, onde o menu lateral já resolve.
 */

type Item = {
  href: string;
  label: string;
  Icone: typeof Casa;
  /** Casa exata; sem isto "/" acenderia em toda tela. */
  exato?: boolean;
};

const ANTES: Item[] = [
  { href: "/", label: "Início", Icone: Casa, exato: true },
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

### src/components/ui/Notificacoes.tsx

Não mudou desde 07/10, mas não tinha ido no pacote anterior. É o sino do topo.

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Papel } from "@/lib/permissoes";
import { Sino } from "./Icones";

type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  lida: boolean;
  createdAt: string;
};

function tempoRelativo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  return `há ${d}d`;
}

export function NotificacaoSino({
  papel,
  className,
  painelDesktop = "direita",
}: {
  papel: Papel;
  className?: string;
  /** De que lado do sino a borda do painel (320px) fica presa, a partir de `sm:`. */
  painelDesktop?: "esquerda" | "direita";
}) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [aberto, setAberto] = useState(false);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  // [removido: busca de dados — consulta /api/notificacoes ao abrir e a cada 60 s]

  // Fecha o popover em clique fora / Escape.
  useEffect(() => {
    if (!aberto) return;
    function aoClicar(e: MouseEvent) {
      if (painelRef.current?.contains(e.target as Node)) return;
      if (botaoRef.current?.contains(e.target as Node)) return;
      setAberto(false);
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  function marcarLida(id: string) {
    setNotificacoes((atuais) => atuais.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    setNaoLidas((n) => Math.max(0, n - 1));
    // [removido: PATCH no servidor]
  }

  function marcarTodasLidas() {
    setNotificacoes((atuais) => atuais.map((n) => ({ ...n, lida: true })));
    setNaoLidas(0);
    // [removido: POST no servidor]
  }

  const lista = (
    <div className="divide-y divide-linha">
      {notificacoes.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-tinta-3">Nenhuma notificação por aqui.</p>
      )}
      {notificacoes.map((n) => {
        const conteudo = (
          <div className="flex items-start gap-2.5 px-4 py-3">
            {!n.lida && (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-hidden />
            )}
            <div className={cn("min-w-0 flex-1", n.lida && "pl-[18px]")}>
              <p className="text-sm font-medium text-tinta">{n.titulo}</p>
              <p className="mt-0.5 text-sm text-tinta-2">{n.mensagem}</p>
              <p className="mt-1 text-xs text-tinta-3">{tempoRelativo(n.createdAt)}</p>
            </div>
          </div>
        );
        return n.link ? (
          <Link
            key={n.id}
            href={n.link}
            onClick={() => {
              if (!n.lida) marcarLida(n.id);
              setAberto(false);
            }}
            className="block hover:bg-superficie-2"
          >
            {conteudo}
          </Link>
        ) : (
          <button
            key={n.id}
            type="button"
            onClick={() => !n.lida && marcarLida(n.id)}
            className="block w-full text-left hover:bg-superficie-2"
          >
            {conteudo}
          </button>
        );
      })}
    </div>
  );

  const cabecalho = (
    <div className="flex items-center justify-between gap-2 border-b border-linha px-4 py-3">
      <span className="text-sm font-semibold text-tinta">Notificações</span>
      {naoLidas > 0 && (
        <button
          type="button"
          onClick={marcarTodasLidas}
          className="text-xs font-medium text-brand-texto hover:underline"
        >
          Marcar todas como lidas
        </button>
      )}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={botaoRef}
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-label={naoLidas > 0 ? `${naoLidas} notificações não lidas` : "Notificações"}
        className={cn(
          "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-menu-texto hover:bg-menu-hover hover:text-menu-fg",
          className
        )}
      >
        <Sino tamanho={19} />
        {naoLidas > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-perigo px-1 text-[10px] font-bold text-perigo-fg ring-2 ring-menu">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {/* Desktop e cabeçalho mobile: popover simples ancorado ao sino. */}
      {aberto && (
        <div
          ref={painelRef}
          role="menu"
          className={cn(
            "fixed inset-x-4 top-16 z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-linha bg-superficie shadow-xl sm:absolute sm:inset-x-auto sm:top-auto sm:mt-2 sm:w-80",
            painelDesktop === "esquerda" ? "sm:left-0" : "sm:right-0"
          )}
        >
          {cabecalho}
          {lista}
        </div>
      )}
    </div>
  );
}
```

### src/components/plano/AvisoDePlano.tsx

Não mudou desde 06/10, mas não tinha ido no pacote anterior. É a faixa do topo de toda tela. (Desde 08/10 o teste grátis tem 30 dias; isso mudou em `lib/plano.ts`, não aqui.)

```tsx
import Link from "next/link";
import { cn } from "@/lib/utils";
// [removido: imports de sessão e de plano]
// Constantes reais: CARENCIA_DIAS = 3, AVISO_VENCIMENTO_DIAS = 5, teste grátis = 30 dias.
// diasAte(data) = dias inteiros que faltam até a data.

// Faixa do plano no topo de toda tela: quanto falta do teste, ou que a oficina está só
// para consulta. Oficina liberada (antigas, convite, cortesia) ou assinante em dia: nada aparece.

function dias(n: number) {
  return n === 1 ? "1 dia" : `${n} dias`;
}

export function AvisoDePlano({ usuario }: { usuario: UsuarioSessao }) {
  const ehDono = usuario.papel === "ADMIN";
  const aviso = montarAviso(usuario);
  if (!aviso) return null;

  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-2.5 text-sm sm:px-6",
        aviso.tom === "perigo" && "border-perigo-linha bg-perigo-fraco text-perigo",
        aviso.tom === "atencao" && "border-atencao-linha bg-atencao-fraco text-tinta",
        aviso.tom === "neutro" && "border-linha bg-superficie-2 text-tinta-2"
      )}
    >
      <p>{aviso.texto}</p>
      {ehDono ? (
        <Link
          href="/assinatura"
          className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-brand-fg hover:bg-brand-700"
        >
          {aviso.acao}
        </Link>
      ) : (
        aviso.tom === "perigo" && <p className="text-xs">Fale com o dono da oficina.</p>
      )}
    </div>
  );
}

function montarAviso(usuario: UsuarioSessao): { texto: string; acao: string; tom: "neutro" | "atencao" | "perigo" } | null {
  switch (usuario.situacao) {
    case "TESTE": {
      const restam = Math.max(1, diasAte(usuario.testeAte));
      return {
        texto:
          restam === 1
            ? "Teste grátis: este é o último dia."
            : `Teste grátis: faltam ${dias(restam)}.`,
        acao: "Assinar o boxOS",
        tom: restam <= 2 ? "atencao" : "neutro",
      };
    }

    case "SOMENTE_LEITURA":
      return {
        texto: "Seu período de teste terminou. Você continua vendo tudo o que registrou, mas não pode alterar nada.",
        acao: "Assinar e voltar a registrar",
        tom: "perigo",
      };

    case "ASSINANTE": {
      const restam = diasAte(usuario.pagoAte);
      if (restam <= 0) {
        const ate = Math.max(1, CARENCIA_DIAS + restam);
        return {
          texto: `Não identificamos o pagamento deste mês. Em ${dias(ate)} a oficina fica só para consulta.`,
          acao: "Regularizar",
          tom: "perigo",
        };
      }
      // Cartão renova sozinho; quem paga por Pix precisa lembrar do próximo mês.
      if (!usuario.assinaturaAutomatica && restam <= AVISO_VENCIMENTO_DIAS) {
        return {
          texto: `Seu mês pago termina em ${dias(restam)}.`,
          acao: "Pagar o próximo mês",
          tom: "atencao",
        };
      }
      return null;
    }

    default:
      return null;
  }
}
```

### src/app/layout.tsx (trecho: a casca do app)

Mudou só por ganhar o `<VoltaAoInicio />`, que não desenha nada. Mostra onde ficam o menu, a faixa do plano e o conteúdo.

```tsx
// [removido: metadata, sessão, redirecionamentos, providers de usuário/avisos/saída segura]

<body className="min-h-[100dvh] bg-fundo text-tinta antialiased">
  {/* AppComMenu: */}
  <>
    <Sidebar
      pendingCount={pendingCount /* contas em aberto; 0 para quem não vê o financeiro */}
      nome={nomeDaOficina}
      usuario={{ nome, papel, podeFinanceiro }}
    />
    {/* Celular: espaço para a barra do topo (56px) e a de baixo (52px + área segura).
        Computador: espaço para o menu lateral (224px). */}
    <main className="pt-14 pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))] md:pb-0 md:pl-56 md:pt-0">
      <AvisoDePlano usuario={usuario} />
      <div className="mx-auto max-w-6xl">{children /* ← a página do Início entra aqui */}</div>
    </main>
    <BloqueioDeAcao />   {/* modal "Período de teste encerrado" */}
    <VoltaAoInicio />    {/* sem visual; volta ao Início após 5 min fora */}
  </>
</body>
```

---

## Parte 5: Dados fictícios

Tudo inventado. A chave `inicio` está **exatamente no formato que a página e os componentes do Início usam** (`Contagens`, nome do usuário, permissões). As chaves de `apoio` não são lidas pelo Início: são os registros "por trás" dos números, coerentes com eles, para quando o vídeo mostrar o Resumo, as OS, Contas a receber, Caixa ou Estoque. Os números batem: 6 carros no pátio (2 aguardando peça), 3 orçamentos pendentes, 2 peças para repor, 4 contas em aberto (3 OS entregues não pagas + 1 dívida avulsa).

```json
{
  "oficina": {
    "nome": "Box 47 Mecânica",
    "agora": "2026-10-14T08:12:00-03:00",
    "saudacaoEsperada": "Bom dia, Rafael",
    "dataEsperada": "Quarta-feira, 14 de outubro"
  },

  "inicio": {
    "usuario": { "nome": "Rafael Moreira", "papel": "ADMIN", "podeFinanceiro": true },
    "ehDono": true,
    "podeFinanceiro": true,
    "contagens": {
      "patio": 6,
      "aguardandoPeca": 2,
      "orcamentosPendentes": 3,
      "paraRepor": 2,
      "contasEmAberto": 4
    },
    "pilulasEsperadas": {
      "Resumo": "6 carros no pátio",
      "Ordens de serviço": "2 esperando peça",
      "Orçamentos": "3 pendentes",
      "Estoque": "2 peças para repor",
      "Contas a receber": "4 contas em aberto"
    }
  },

  "variantesDePerfil": {
    "operadorComFinanceiro": {
      "usuario": { "nome": "Juliana Prado", "papel": "OPERADOR", "podeFinanceiro": true },
      "ehDono": false,
      "podeFinanceiro": true,
      "contagens": { "patio": 6, "aguardandoPeca": 2, "orcamentosPendentes": 3, "paraRepor": 2, "contasEmAberto": 4 }
    },
    "operadorSemFinanceiro": {
      "usuario": { "nome": "Diego Cardoso", "papel": "OPERADOR", "podeFinanceiro": false },
      "ehDono": false,
      "podeFinanceiro": false,
      "contagens": { "patio": 6, "aguardandoPeca": 2, "orcamentosPendentes": 3, "paraRepor": 2, "contasEmAberto": null }
    },
    "oficinaNovaSemDados": {
      "usuario": { "nome": "Rafael Moreira", "papel": "ADMIN", "podeFinanceiro": true },
      "ehDono": true,
      "podeFinanceiro": true,
      "contagens": { "patio": 0, "aguardandoPeca": 0, "orcamentosPendentes": 0, "paraRepor": 0, "contasEmAberto": 0 }
    }
  },

  "menu": {
    "nomeDaOficina": "Box 47 Mecânica",
    "pendingCount": 4,
    "notificacoes": [
      {
        "id": "n1",
        "titulo": "Armazenamento chegando ao limite",
        "mensagem": "Você já usou 410 MB de 500 MB (82%) do espaço para fotos.",
        "link": "/configuracoes",
        "lida": false,
        "createdAt": "2026-10-14T07:40:00-03:00"
      }
    ],
    "naoLidas": 1
  },

  "avisoDePlano": {
    "situacao": "TESTE",
    "testeAte": "2026-10-18T23:59:59-03:00",
    "textoEsperado": "Teste grátis: faltam 4 dias.",
    "acao": "Assinar o boxOS",
    "tom": "neutro"
  },

  "apoio": {
    "patio": [
      { "numero": 312, "cliente": "Marcos Teixeira",   "veiculo": "Fiat Strada 2021",        "placa": "QTR-4E21", "status": "ABERTA",          "abertura": "2026-10-14T07:55:00-03:00", "diasParado": 0,  "mecanico": "André Lopes",  "total": 0 },
      { "numero": 309, "cliente": "Patrícia Nunes",    "veiculo": "Hyundai HB20 2019",       "placa": "RKD-7B33", "status": "EM_ANDAMENTO",    "abertura": "2026-10-13T09:20:00-03:00", "diasParado": 1,  "mecanico": "André Lopes",  "total": 890.00 },
      { "numero": 305, "cliente": "Eduardo Ribeiro",   "veiculo": "VW Gol 2015",             "placa": "PLM-2C08", "status": "EM_ANDAMENTO",    "abertura": "2026-10-10T14:10:00-03:00", "diasParado": 3,  "mecanico": "Bruno Siqueira", "total": 1340.00 },
      { "numero": 301, "cliente": "Luciana Mendes",    "veiculo": "Chevrolet Onix 2020",     "placa": "SBA-9D14", "status": "AGUARDANDO_PECA", "abertura": "2026-10-07T10:00:00-03:00", "diasParado": 7,  "mecanico": "Bruno Siqueira", "total": 2180.00 },
      { "numero": 298, "cliente": "Roberto Alves",     "veiculo": "Toyota Corolla 2017",     "placa": "OXE-3F57", "status": "AGUARDANDO_PECA", "abertura": "2026-10-02T16:30:00-03:00", "diasParado": 12, "mecanico": "André Lopes",  "total": 3450.00 },
      { "numero": 294, "cliente": "Fernanda Costa",    "veiculo": "Renault Sandero 2016",    "placa": "MNP-6A90", "status": "EM_ANDAMENTO",    "abertura": "2026-09-24T08:45:00-03:00", "diasParado": 20, "mecanico": "Bruno Siqueira", "total": 760.00 }
    ],

    "orcamentosPendentes": [
      { "numero": 141, "cliente": "Gustavo Lima",    "veiculo": "Honda Civic 2018",    "placa": "QJH-1E62", "total": 1980.00, "criadoEm": "2026-10-13" },
      { "numero": 139, "cliente": "Camila Rocha",    "veiculo": "Jeep Renegade 2020",  "placa": "RTC-5G41", "total": 2650.00, "criadoEm": "2026-10-11" },
      { "numero": 136, "cliente": "Sérgio Martins",  "veiculo": "Ford Ka 2019",        "placa": "PZU-8H03", "total": 540.00,  "criadoEm": "2026-10-08" }
    ],

    "contasEmAberto": [
      { "tipo": "OS",     "numero": 288, "cliente": "Antônio Barros",  "descricao": "Revisão + pastilhas",       "total": 380.00,  "pago": 0,      "emAberto": 380.00,  "entregueEm": "2026-10-09" },
      { "tipo": "OS",     "numero": 279, "cliente": "Beatriz Duarte",  "descricao": "Embreagem completa",        "total": 2400.00, "pago": 1200.00, "emAberto": 1200.00, "entregueEm": "2026-09-29" },
      { "tipo": "OS",     "numero": 263, "cliente": "Paulo Vieira",    "descricao": "Motor: retífica do cabeçote","total": 4100.00, "pago": 1000.00, "emAberto": 3100.00, "entregueEm": "2026-09-12" },
      { "tipo": "AVULSA", "id": 17,      "cliente": "Renata Farias",   "descricao": "Troca de bateria (sem OS)", "total": 150.00,  "pago": 0,      "emAberto": 150.00,  "lancadaEm": "2026-10-03" }
    ],

    "caixaDoDia": {
      "data": "2026-10-14",
      "porForma": [
        { "formaPagamento": "DINHEIRO",       "label": "Dinheiro",          "total": 320.00 },
        { "formaPagamento": "PIX",            "label": "PIX",               "total": 1850.00 },
        { "formaPagamento": "CARTAO_DEBITO",  "label": "Cartão de débito",  "total": 460.00 },
        { "formaPagamento": "CARTAO_CREDITO", "label": "Cartão de crédito", "total": 1290.00 }
      ],
      "total": 3920.00,
      "lancamentos": [
        { "hora": "08:40", "origem": "OS 296 · Vanessa Rezende",  "formaPagamento": "PIX",            "valor": 1250.00 },
        { "hora": "09:15", "origem": "OS 279 · Beatriz Duarte",   "formaPagamento": "DINHEIRO",       "valor": 200.00 },
        { "hora": "10:30", "origem": "OS 299 · Henrique Matos",   "formaPagamento": "CARTAO_CREDITO", "valor": 1290.00 },
        { "hora": "11:05", "origem": "OS 300 · Larissa Campos",   "formaPagamento": "CARTAO_DEBITO",  "valor": 460.00 },
        { "hora": "14:20", "origem": "OS 263 · Paulo Vieira",     "formaPagamento": "PIX",            "valor": 600.00 },
        { "hora": "16:45", "origem": "Dívida 15 · Otávio Freitas", "formaPagamento": "DINHEIRO",      "valor": 120.00 }
      ]
    },

    "estoqueParaRepor": [
      { "nome": "Óleo 5W30 sintético 1L",       "codigo": "OL-5W30", "unidade": "UN", "quantidade": 3, "estoqueMinimo": 6 },
      { "nome": "Filtro de óleo (Onix/Prisma)", "codigo": "FO-1120", "unidade": "UN", "quantidade": 0, "estoqueMinimo": 2 }
    ],

    "numerosDoMes": {
      "mes": "2026-10",
      "osEntregues": 38,
      "faturamento": 61850.00,
      "custoPecas": 21430.00,
      "lucroBruto": 40420.00,
      "gastos": 18900.00,
      "resultado": 21520.00,
      "ticketMedio": 1627.63
    },

    "mecanicos": ["André Lopes", "Bruno Siqueira"]
  }
}
```

Notas sobre os dados:
- `diasParado` é como o Resumo calcula: dias corridos desde a abertura da OS.
- `numerosDoMes` aparece no **Resumo → aba Resultado**, não no Início.
- O Início nunca mostra valores em dinheiro; os valores de `apoio` servem só para as outras telas.

---

## Observações

### O que está incompleto ou pendente
- **Deploy:** os últimos ajustes (Novo cliente em laranja, "Dashboard" → "Resumo", volta automática ao Início) entraram no commit `93ccf68` de 13/10. Confira se a produção já está nele antes de gravar.
- **Não há onboarding**: nenhum passo a passo abre sozinho no primeiro acesso, não há checklist nem tela vazia especial. A ajuda é só sob demanda ("Como funciona" e os "?").
- **Os números não se atualizam sozinhos** com a tela aberta; só ao entrar de novo ou recarregar. (O sino é a exceção: confere a cada 60 s.)
- **Sem personalização**: não dá para esconder, reordenar ou filtrar blocos.
- **O Início não tem**: busca, lista de carros, "carro parado há muito tempo", valores em dinheiro, caixa do dia, gráficos, botão de registrar pagamento. Tudo isso está nas telas de destino (Resumo, OS, Contas a receber, Caixa).
- **O cartão Estoque** leva para a tela de Estoque normal, não direto ao filtro "Precisa repor".
- **A pílula de contas em aberto** conta contas, não clientes nem reais. Um mesmo cliente com duas OS fiadas conta 2.
- **Notificações**: o único aviso que a oficina recebe hoje pelo sino é o de espaço de fotos (só para o dono). Não há notificação de conta vencida, estoque baixo ou carro parado.
- **Operador sem Financeiro**: a barra de baixo ainda mostra "A receber" e "Gastos"; tocar devolve ao Início sem explicação. O comentário no código ainda fala em "devolvido ao pátio" (desatualizado; o comportamento real é ir para o Início).
- **Modo só leitura** (teste acabou): o Início abre normalmente e os números aparecem, mas tocar em Novo cliente / Nova OS / Novo orçamento mostra o aviso "Período de teste encerrado" no lugar do formulário.

### Diferenças entre celular e computador (resumo)
- Celular: barra do topo (☰, símbolo boxOS, nome da oficina, bolinha vermelha de contas, sino) + barra de baixo de 5 botões com "+ Nova OS" no centro; cartões de Começar empilhados; destinos em 2 colunas; "Como funciona" só com o "?".
- Tablet (640–1023 px): destinos em 3 colunas; Começar ainda empilhado; a partir de 768 px aparece o menu lateral e somem as barras do topo e de baixo.
- Computador (≥ 1024 px): Começar em 3 colunas altas; destinos em 4 colunas; conteúdo até ~1152 px de largura.

### Dependências visuais
- Tailwind CSS 3.4 com os tokens do boxOS (`globals.css` + `tailwind.config.ts`, no pacote de 07/10). Cores principais: laranja boxOS (`brand-600`, texto `brand-fg`), superfícies `superficie`/`-2`/`-3`, textos `tinta`/`-2`/`-3`, `atencao` (amarelo) e `perigo` (vermelho). Tema claro e escuro.
- Fonte: Poppins (600/700) só na logo; o resto usa a fonte do sistema.
- Ícones: SVG próprios em `Icones.tsx`, sem biblioteca externa. Nenhum gráfico na tela Início.
- Utilitários de CSS próprios usados aqui: `pb-segura` (área segura do iPhone embaixo), `no-print`, `animate-in` (gaveta). Estão no `globals.css` de 07/10.
- `cn()` = `clsx` 2.1 + `tailwind-merge` 2.5.

### Segurança
- Nenhum `.env`, chave, token, URL de banco, migration ou código de backend foi incluído. Nenhum arquivo lido tinha segredo.
- Lógica de sessão, banco, proxy e chamadas de API foi trocada por `// [removido: ...]`.
- Todos os nomes, placas e valores da Parte 5 são inventados.
