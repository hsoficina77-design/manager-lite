# boxOS — pacote da Ordem de Serviço para o vídeo · parte 1 de 2

Pacote gerado em 12/10/2026 a partir do repositório do boxOS, **só por leitura**: nenhum arquivo do projeto foi alterado. Foco: a Ordem de Serviço, o que o cliente recebe e o que só o dono vê. Tudo o que está descrito aqui foi conferido no código; o que existe só no banco de dados, sem tela para usar, está marcado como **inativo**.

Este pacote complementa os pacotes `boxos-video-pack-1.md` a `-5.md` (07/10/2026). Os componentes de base que já foram enviados lá (tokens, botões, campos, modal, métricas, ícones) **não mudaram** desde então e não estão repetidos aqui. A lista exata está na seção "Parte 3 · Dependências".

## Índice

| Parte | Onde | Conteúdo |
|---|---|---|
| **1. Mapa de funcionalidades** | este arquivo | 10 blocos, em linguagem de dono de oficina |
| **2. Pontos fortes para vender** | este arquivo | 9 recursos com o benefício de cada um |
| **3. Código visual** | este arquivo + parte 2 | JSX e Tailwind das telas, com a lógica de dados removida |
| 3.0 Dependências | este arquivo | o que já foi enviado antes e o que vem aqui |
| 3.1 `src/lib/constants.ts` (trecho) | este arquivo | status, formas de pagamento, margem, fotos |
| 3.2 `src/components/UsuarioProvider.tsx` (substituto) | este arquivo | os dois ganchos de permissão, fixos para o vídeo |
| 3.3 `src/app/os/[id]/page.tsx` | este arquivo | **tela da OS do dono**: documento + visão interna + pagamento + desconto + fotos + modais |
| 3.4 `src/components/OSForm.tsx` | parte 2 | formulário da OS: peças, mão de obra, custo, ganho, lucro estimado |
| 3.5 `src/components/ProdutoBusca.tsx` | parte 2 | busca da peça no estoque e selo de vínculo |
| 3.6 `src/components/EditorDescricao.tsx` | parte 2 | campo "Descrição do serviço" com barra de formatação |
| 3.7 `src/components/Fotos.tsx` | parte 2 | galeria e captura de fotos (entrada, serviço, saída) e visor |
| 3.8 `src/components/CabecalhoDocumento.tsx` | parte 2 | topo do documento com a identidade da oficina |
| 3.9 `src/components/BaixarOS.tsx` e `BaixarDocumento.tsx` | parte 2 | botão de baixar em PDF ou imagem |
| 3.10 `src/components/OSPdfDocument.tsx` | parte 2 | **o PDF da OS** (a imagem sai dele) |
| 3.11 `src/components/BaixarComprovante.tsx` e `ComprovantePagamentoPdfDocument.tsx` | parte 2 | comprovante e extrato de pagamento em imagem |
| 3.12 `src/components/ExtratoCliente.tsx` | parte 2 | janela do extrato do cliente |
| 3.13 `src/app/os/page.tsx` (trecho `OSRow`) | parte 2 | indicador de lucro e margem por OS na lista |
| **4. Dados fictícios** | parte 2 | JSON da OS #1312 da Box 47 Mecânica |
| **Observações** | parte 2 | o que está incompleto, limitações e dependências visuais |

---

# Parte 1 · Mapa de funcionalidades da OS

## 1. Ciclo de vida

**Orçamento.** Em *Ordens de serviço → Orçamentos → Novo*. Dá para fazer **orçamento sem cliente cadastrado**: escreve-se só o nome, o telefone e o carro em texto livre, e ele fica marcado como **rascunho**. Pode ter peças, mão de obra, fotos, desconto e validade (padrão de 7 dias, ajustável em Configurações). Sai em PDF ou imagem e tem botão **Imprimir**.
Telas: `src/app/orcamentos/novo`, `src/app/orcamentos/[id]/page.tsx`.

**Aprovação.** O orçamento tem quatro situações: **Pendente**, **Aprovado**, **Recusado** e **Convertido**. As três primeiras são trocadas à mão, numa pílula colorida no topo da tela. O sistema não exige que o orçamento esteja "Aprovado" para virar OS.

**Conversão em OS.** Botão verde **Converter em OS**, com confirmação. Para converter é preciso ter o cliente cadastrado e o veículo selecionado; se for rascunho, aparece o aviso "Rascunho — falta cadastrar o cliente…" com o link "Completar cadastro". A conversão cria a OS com o próximo número, copia os itens (com custo e vínculo do estoque), o desconto, a descrição e as observações, e leva junto as fotos. O orçamento fica como **Convertido**, com o link "Ver OS #N", e deixa de poder ser editado. **Converter não tira peça do estoque.**
Arquivo: `src/app/api/orcamentos/[id]/converter/route.ts`.

**OS direta.** Também dá para abrir a OS sem orçamento, em *Ordens de serviço → Nova OS*, ou pela ficha do cliente (**Nova OS** ao lado de cada veículo, que já chega com cliente e carro preenchidos). A numeração é sequencial e própria de cada oficina (OS nº 1, 2, 3…).

**Status da OS.** Uma pílula colorida no topo da OS, com setinha, troca o status a qualquer momento:

| Status | Cor | O que muda |
|---|---|---|
| **Aberta** | neutra | Carro chegou. Nada sai do estoque. |
| **Em andamento** | azul | Só a indicação no pátio. |
| **Ag. peça** | âmbar com anel | Destacado como o único "travado" do pátio. |
| **Entregue** | verde | Carimba a **data de entrega**, que define em que mês a OS conta no faturamento e no lucro. **As peças do estoque saem da prateleira nesse momento.** Se houver saldo, abre a janela "Confirmar entrega". |
| **Cancelada** | apagada | Não pode mais ser editada; as fotos ficam só para ver. Se ela estava entregue, as peças voltam para o estoque. |

Voltar uma OS de "Entregue" para o pátio apaga a data de entrega e devolve as peças. A cada mudança, um aviso confirma o que aconteceu, por exemplo "Status alterado para Entregue. 3 peças baixadas do estoque."

**Entrega.** Escolher "Entregue" numa OS com saldo abre a janela **Confirmar entrega** com três botões: **Pagou tudo**, **Parcial** e **Não recebi**. No "Parcial", a tela mostra na hora quanto ainda falta e avisa que esse valor vai para Contas a receber. Quando sobra saldo, aparece em seguida a janela "OS entregue com saldo pendente", com o botão **Ver contas a receber**.

**Cancelamento e exclusão.** Cancelar é só um status. **Excluir** a OS fica no menu "⋯" e só aparece para quem tem permissão. Excluir apaga o faturamento e os pagamentos dessa OS, devolve as peças ao estoque e fica registrado (ver bloco 8).

Telas: `src/app/os/[id]/page.tsx` (status, entrega, exclusão), `src/lib/constants.ts` (`OS_STATUS`, `consomeEstoque`).

## 2. Campos da OS

Formulário único para abrir e editar a OS (`src/components/OSForm.tsx`), em três cartões e um resumo lateral:

| Campo | Observação |
|---|---|
| **Cliente** \* | Busca na lista de clientes cadastrados. |
| **Veículo** \* | Só os carros daquele cliente. Se ele tiver um só, já vem escolhido. |
| **Defeito relatado pelo cliente** | A queixa como o cliente contou, separada do serviço. |
| **Descrição do serviço** \* | Texto com barra de formatação (negrito, título, lista com marcadores, lista numerada) e botão **Ver como fica**. Até 5.000 caracteres. |
| **Mecânico responsável** | Lista de mecânicos ativos, ou "— Não atribuído". |
| **Nível de combustível** | Três opções: Cheio, Meio, Vazio. |
| **Combustível em uso** | Aparece só se o carro for Flex ou Híbrido: Gasolina ou Etanol. |
| **KM de entrada** | Número. |
| **Observação de entrada** | Ex.: "avarias na lataria, riscos, itens no veículo". Sai no documento como "Observações". |
| **Itens** | Ver bloco 3. |
| **Data de abertura** | Automática, no momento em que a OS é criada. |
| **Data de entrega** | Automática, quando o status vira Entregue. |

Os dados do carro (marca, modelo, placa, cor, ano de fabricação e de modelo, motorização, válvulas, combustível, km) ficam no cadastro do veículo e aparecem sozinhos na OS.

**O que não existe ou está inativo:**
- **Previsão de entrega**: não existe.
- **Diagnóstico técnico separado**: não existe. O que faz esse papel é a "Descrição do serviço".
- **KM de saída**: o campo existe no banco e aparece na OS e no PDF quando está preenchido, mas **nenhuma tela permite preenchê-lo**. Na prática, está inativo.
- **NPS (nota do cliente de 0 a 10)**: o campo existe e as médias aparecem na ficha do cliente, na página do mecânico e em Produtividade, mas **nenhuma tela registra a nota**. Também está inativo.

**Proteção contra perda.** O formulário guarda um **rascunho automático no aparelho** enquanto se digita. Se o celular fechar o app, ao voltar aparece a faixa "Você tinha um rascunho não salvo de há X min", com os botões **Restaurar rascunho** e **Descartar**. Sair da tela sem salvar pede confirmação.

## 3. Peças e mão de obra

Tudo fica no cartão **Itens** do formulário (`OSForm.tsx` + `ProdutoBusca.tsx`):

1. **Tipo**: Peça, M.O. (mão de obra) ou Serviço.
2. **Descrição**: no tipo Peça, o campo **procura no estoque** a partir da 3ª letra, ignorando acentos ("agua" encontra "Água desmineralizada"). A lista mostra o nome, o código, o preço de venda e o **saldo na prateleira** (em vermelho se estiver zerado). Escolher uma peça preenche descrição, preço de venda e custo de uma vez.
3. **Peça avulsa**: se a peça não estiver no estoque, é só continuar digitando. A lista avisa "Nada no estoque com '…'. Pode seguir digitando: a peça entra na OS sem vínculo."
4. **Qtd**: aceita fração (ex.: 4,5 litros).
5. **Custo unit. (R$)**: só para peças e só para quem pode ver o financeiro.
6. **Venda unit. (R$)**: para o dono, ao lado do rótulo aparece a margem da peça, por exemplo "(32%)", em verde ou vermelho.
7. **+ Adicionar**. A linha entra na tabela com o lápis (editar) e a lixeira (remover). Remover mostra uma faixa com **Desfazer**.

Peça que veio do estoque ganha um **selo** embaixo do campo, com uma caixinha, o nome e o saldo, além de um "x" para **desvincular** ("lançar sem tirar do estoque"). Se a quantidade passar do que há na prateleira, o aviso diz: "Só há 2 UN na prateleira — o saldo vai ficar negativo." O sistema avisa, mas **não impede**. Na tabela e na OS, a peça do estoque tem um ícone de caixinha que **não sai na impressão**.

**Desconto**: é **um valor em reais sobre o total da OS**, aplicado no cartão **Desconto** da tela da OS (e não no formulário). Não existe desconto por item nem em porcentagem. O cartão mostra subtotal, desconto e "Total com desconto". Ele fica escondido depois que a OS é entregue ou cancelada.

**Baixa no estoque**: acontece **na entrega** (status "Entregue"), e não ao lançar o item. Enquanto o carro está no pátio, a OS só "reserva de intenção". O cálculo é feito pela **diferença**: salvar duas vezes não baixa duas vezes, trocar 2 por 3 tira mais 1 e apagar o item devolve. Reabrir, cancelar ou excluir uma OS entregue devolve as peças. Cada baixa fica no histórico do produto, com o número da OS e o nome de quem fez.
Arquivos: `src/lib/estoque.ts`, `src/lib/constants.ts` (`consomeEstoque`).

Limite: 200 itens por OS.

## 4. Custo, margem e lucro

**De onde vem o custo da peça:**
- digitado no item pelo dono (ou por quem tem o financeiro liberado);
- **herdado do estoque**: se a peça foi escolhida na busca e ninguém digitou custo, vale o custo cadastrado no produto. Isso também vale quando quem lança é um funcionário que não vê custo;
- quando um funcionário edita a OS, o custo que o dono já tinha gravado é **mantido** (`src/lib/custos.ts`).

**Fórmulas** (calculadas no servidor a cada gravação, em `src/app/api/os/[id]/route.ts`):

```
Total de peças        = soma de (quantidade × preço de venda) das peças
Mão de obra/serviços  = soma de (quantidade × preço de venda) de M.O. e Serviço
Custo das peças       = soma de (quantidade × custo unitário) das peças
TOTAL                 = Total de peças + Mão de obra − Desconto
Lucro real            = TOTAL − Custo das peças
Margem em peças (%)   = (Total de peças − Custo das peças) ÷ Total de peças × 100
Margem da OS (%)      = Lucro real ÷ TOTAL × 100
```

A mão de obra entra inteira como ganho. O "lucro real" é o **lucro bruto da OS**: não desconta comissão de mecânico nem as despesas fixas da oficina. As despesas entram depois, no lucro líquido do Dashboard.

**Onde aparece:**
- **Tela da OS → cartão "Visão interna"** (só para o dono): Custo das peças · Margem em peças (R$ e "% sobre as peças") · Mão de obra · **Lucro real** · e "Guardar (10%)", se a reserva de lucro estiver ligada. O cartão abre **borrado**, com o botão **Revelar / Ocultar** e o aviso "Não aparece para o cliente". O sistema lembra a escolha.
- **Formulário da OS**: a coluna **Ganho** em cada linha, o texto "Ganho deste item: R$ X" enquanto se digita, e no **Resumo** um quadro com "Custo das peças" e "**Lucro estimado R$ X (Y%)**".
- **Lista de OS**: em telas largas, cada linha mostra o lucro real e a margem %, coloridos em **verde ≥ 40%**, **âmbar de 20% a 39%** e **vermelho abaixo de 20%** (`corMargem`). A lista também pode ser ordenada por lucro (só para o dono).
- **Orçamento**: tem uma visão de margem calculada da mesma forma.

**Se o custo não for preenchido:** o sistema conta como **custo zero**, sem aviso. O preço de venda inteiro da peça vira lucro, o que **infla a margem**. A única exceção é a peça escolhida do estoque, que herda o custo do produto.

**Diferença a saber:** o "Lucro estimado" do formulário **não** considera o desconto, porque o desconto é aplicado depois, na tela da OS. Já o "Lucro real" da Visão interna considera.

## 5. Fotos

Componente `src/components/Fotos.tsx`, que fica na coluna da direita da OS.

- **Três momentos**, cada um com a sua área: **Entrada** ("Estado do veículo na chegada"), **Serviço** ("Peças trocadas, antes e depois") e **Saída** ("Estado do veículo na entrega").
- **No celular**: botões **Tirar foto** (abre a câmera traseira) e **Galeria**, com várias fotos de uma vez. **No computador**: arrastar e soltar, ou "escolha os arquivos".
- A foto é **comprimida no próprio celular** antes do envio e sobe uma de cada vez, com até 3 tentativas automáticas. Isso ajuda no Wi-Fi fraco da oficina. Se falhar, a miniatura mostra o erro e um "Tentar novamente".
- **Descrever fotos**: botão que abre um campo de texto embaixo de cada miniatura. Cada descrição tem até 140 caracteres e **sai no PDF**.
- **Visor em tela cheia**: deslizar para o lado no celular, setas no computador, trocar o momento da foto (Entrada/Serviço/Saída), editar a descrição e **Excluir** (com confirmação).
- **No orçamento** não se escolhe o momento: as fotos ficam numa galeria só e, na conversão, passam para a OS como fotos de "Entrada".
- **Limite de quantidade**: não há limite por OS. Os limites são: 10 MB por arquivo, 60 envios a cada 10 minutos por sessão e o espaço total do plano (1 GB por padrão). O dono recebe um aviso no sino quando o espaço passa de 80% e de 95%.
- **Data e hora**: o sistema grava data e hora de cada foto, mas **as telas e o PDF mostram só a data** (dd/mm/aaaa).
- **No documento do cliente**: sim. As fotos aparecem no fim da OS na tela, numa **página própria do PDF** chamada "Fotos do Serviço", separadas por momento, com a descrição e a data. Tocar na foto do PDF abre a versão em alta resolução, mas esse link **vale por cerca de 1 hora** (ver Observações).
- Numa OS cancelada, as fotos ficam só para ver.

## 6. Documento do cliente (PDF e imagem)

**Duas versões com o mesmo conteúdo:**
- **Na tela** (`src/app/os/[id]/page.tsx`): a folha branca à esquerda é o próprio documento. Ela também sai bem na impressão do navegador (Ctrl+P), em A4, com as fotos em páginas próprias.
- **PDF** (`src/components/OSPdfDocument.tsx`) e **imagem PNG**: a imagem é gerada **a partir do PDF**, em resolução 3x (cerca de 1785 × 2525 px no A4). Um documento de 2 páginas vira 2 imagens numeradas ("… - pagina 1.png", "… - pagina 2.png").

**O que aparece no PDF:** logo, nome da oficina, CNPJ, telefone, WhatsApp, endereço, e-mail e site · "Ordem de Serviço Nº 1312" na cor da oficina · datas de abertura e de fechamento · status · um filete na cor da oficina · quadro com Cliente (nome, CPF/CNPJ, telefone, e-mail, endereço) e Veículo (marca, modelo, ano, placa, cor, motor, KM de entrada, nível de combustível, combustível em uso, mecânico responsável) · Defeito relatado · Descrição do serviço formatada e Observações · tabela de itens (Tipo, Descrição, Qtd, Valor unitário, Total) · Peças, Mão de obra, Desconto e **TOTAL** · mensagem da oficina (garantia, termos) · linha de assinatura · rodapé com "Emitido com boxOS · Página 1 de 2" · página de fotos.

**O que não aparece:** custo, margem, lucro, fornecedor, o ícone de "peça do estoque" e a Visão interna. Isso vale tanto para o PDF quanto para a impressão. **O PDF também não traz o que foi pago nem o saldo.** O documento na tela mostra "Pago" e "Saldo", mas o PDF não. Para mostrar pagamentos ao cliente, existe o **comprovante** (bloco 7).

**Personalização** (Configurações, só o dono): logo (upload), **cor dos documentos** (o sistema continua laranja boxOS; a cor vale só para os documentos), nome e contatos, **rodapé** em texto livre, **mensagem do documento** (garantia, termos ou recado) e **mostrar ou esconder a linha de assinatura**.

**Compartilhamento:** pelo menu "⋯" da OS → **Baixar PDF** ou **Baixar Imagem**. O formato usado por último fica lembrado. O arquivo sai com um nome pronto, como "OS 1312 - Camila Torres Andrade - Volkswagen Polo RXK4F72". A pessoa envia o arquivo pelo WhatsApp por conta própria. **Não existe botão "enviar pelo WhatsApp" nem link público para o cliente abrir a OS.**

## 7. Pagamentos

No cartão **Pagamento** da tela da OS:
- Três números: **Total · Pago · Saldo** (o saldo fica em vermelho enquanto houver dívida).
- Botão **Registrar** → janela com valor, forma de pagamento e observação. Dá para registrar **quantos pagamentos parciais forem necessários**. Um **sinal** é só o primeiro pagamento parcial, feito antes da entrega; não existe um campo próprio de "sinal".
- **Formas de pagamento**: Dinheiro, PIX, Cartão de crédito, Cartão de débito e Transferência.
- **Parcelado**: **não existe plano de parcelas** (datas e valores futuros). "Cartão de crédito" é só a forma de pagamento; o número de parcelas no cartão não é registrado.
- **Histórico**: cada pagamento com valor, forma, observação, data e hora, e o botão **Estornar**. **Desmarcar como recebido** estorna todos de uma vez. O estorno não muda o status da OS.
- Na barra do topo, a etiqueta âmbar "**A receber — R$ X**" aparece quando a OS foi entregue e ainda há saldo.

**Como uma OS vira fiado:** quando ela é **entregue com saldo**, seja pelo "Parcial" ou pelo "Não recebi" na entrega. Ela passa a aparecer em **Contas a receber**, agrupada por cliente, com o tempo em aberto (0–15, 16–30, 31–60 e mais de 60 dias) e um botão para copiar o telefone. OS que ainda está no pátio com sinal pago **não** aparece em Contas a receber.

**Comprovante**: no histórico de pagamentos da OS, o botão **Baixar comprovante** gera uma **imagem PNG** em formato de recibo de balcão, pronta para o WhatsApp, com logo, "Comprovante de Pagamento", OS e carro, desconto, Total/Pago/Saldo, o selo verde "Pagamento quitado" quando for o caso e o histórico com data e hora.

**Extrato do cliente**: na ficha do cliente, o botão **Extrato de pagamentos** abre uma janela para marcar quais OS (e dívidas avulsas) entram. O resultado é **uma imagem só**, com o que está em aberto, o que foi quitado e o histórico de pagamentos, cada um com a OS de origem.

**Caixa do dia**: todo pagamento registrado entra no Caixa, na data em que foi lançado.

Limitação: fora da janela de entrega, a janela "Registrar" **não impede** lançar um valor maior que o saldo.

## 8. Permissões e segurança

**Papéis**: **Dono** (vê e faz tudo, inclusive configurar) e **Operador** (clientes, OS, orçamentos e fotos). Para cada operador há duas chaves de ajuste: **Financeiro** e **Excluir**. Configuração em *Configurações → Acessos* (`src/lib/permissoes.ts`).

**O que um operador sem "Financeiro" NÃO vê:** o campo de custo, a margem da peça, a coluna "Ganho", o quadro "Lucro estimado", a Visão interna, o lucro e a margem na lista de OS, a ordenação por lucro e o lucro bruto na ficha do cliente. Ele também não abre Caixa, Contas a receber nem Controle de gastos. **Não é só a tela que esconde:** o servidor apaga custo, lucro e margem da resposta antes de enviar, então nem abrindo as ferramentas do navegador dá para ver.

**O que o operador vê e faz:** preços de venda, total, pagamentos (registra recebimentos e baixa o comprovante), status, edição da OS e fotos. Ao editar a OS, ele não apaga o custo que o dono gravou.

**Excluir**: só o dono ou o operador com "Excluir" ligado. A regra vale para tudo o que é apagar dentro da OS: **a OS inteira, as fotos e o estorno de pagamento**. Sem essa permissão, o servidor recusa com "Sem permissão para excluir". (Ver Observações: o botão de excluir foto continua visível para o operador.)

**Rastro (auditoria):**
- **Existe:** registro de **exclusões**, com o tipo, "OS #1312 — Camila Torres Andrade", quem apagou e quando. Fica em *Configurações → Acessos → "Exclusões recentes"*, só para o dono. O nome fica guardado mesmo que a pessoa seja removida depois.
- **Existe:** cada baixa ou devolução de peça grava quem fez e o número da OS no histórico do estoque.
- **Não existe:** histórico de alterações da OS (quem mudou um preço, um item ou o status, e quando). Também não fica registrado quem lançou cada pagamento.

**Outros cuidados:** login obrigatório em todas as telas, sessões que podem ser derrubadas na hora, limite de tentativas e de requisições, fotos guardadas com link temporário e dados separados por oficina. Quando o teste grátis vence sem assinatura, o sistema fica **só para leitura** (dá para ver, mas não para editar).

## 9. Ligações com o resto do sistema

| Ligação | Como funciona | Onde |
|---|---|---|
| **Histórico do cliente** | Ficha com Total faturado, Lucro bruto (dono), Ticket médio, nº de OS (e quantas em aberto), Mão de obra, Peças, Recebido, Pendente e a lista de todas as OS com carro, placa, status e situação do pagamento. | `src/app/clientes/[id]/page.tsx` |
| **Histórico do veículo** | **Não há uma página própria por veículo.** As OS do carro aparecem na ficha do cliente (com a placa), e a busca da lista de OS encontra por placa, cliente, apelido, modelo, mecânico ou descrição. | `src/app/os/page.tsx` |
| **Painel de lucro** | O Dashboard (aba Resultado) soma faturamento e lucro real das OS **pela data de entrega** e subtrai as despesas para chegar ao lucro líquido. | `src/app/page.tsx` |
| **Desempenho do mecânico** | Página do mecânico: OS do mês, faturamento, mão de obra, lucro real, margem, ticket médio e **meta de lucro mensal** com barra de progresso. Ranking em *Produtividade* (só o dono). Atenção: a página do mecânico conta as OS pelo **mês de abertura**. | `src/app/mecanicos/[id]/page.tsx`, `src/app/produtividade/page.tsx` |
| **Caixa do dia** | Lista os pagamentos de OS e de dívidas lançados no dia. | `src/app/caixa` |
| **Contas a receber** | OS entregues com saldo, por cliente, com o tempo em aberto. | `src/app/contas-receber/page.tsx` |
| **Estoque** | Baixa na entrega, devolução ao reabrir, cancelar ou excluir, e histórico com o número da OS. | `src/lib/estoque.ts` |
| **Checklist / diagnóstico** | **Não existe** no sistema. | — |
| **Copiar dados do carro para a autopeça** | Menu "⋯" da OS → **Copiar carro** (também no orçamento e nos veículos da ficha do cliente). Copia um texto pronto para colar no WhatsApp da autopeça, por exemplo "Volkswagen Polo 1.0 TSI 12V / Ano: 2021/2022 / Combustível: Flex / KM: 48.215". | `src/components/CopiarVeiculo.tsx` |

## 10. Outras coisas úteis da OS

- **Lista de OS** com as abas Todas / Pátio / Entregues, busca, filtros e ordenação; cada linha mostra o status colorido, o total e a situação do pagamento ("Pago", "Falta R$ X").
- **Reserva de lucro sugerida**: se o dono ligar essa opção, a Visão interna mostra "Guardar (10%) R$ X". É só uma indicação; nenhum dinheiro é movido.
- **Visão interna borrada**: dá para virar a tela para o cliente no balcão sem mostrar o lucro.
- **Pensada para celular**: botões com 44 px, a barra do topo fica presa ao rolar e as ações secundárias ficam no menu "⋯" para não empurrar o documento para baixo.
- **Avisos do estoque na hora de lançar**: o saldo da prateleira aparece no selo da peça, e numa OS já entregue o sistema já desconta o que ela mesma segura.
- **Tema claro e escuro.** O documento continua branco, como papel, nos dois.
- **Assinatura discreta**: "Emitido com boxOS" em letra pequena no rodapé, sem competir com a marca da oficina.

---

# Parte 2 · Pontos fortes para vender

1. **Lucro de cada OS na hora, escondido do cliente.** Custo, margem e lucro real aparecem borrados até um toque em "Revelar", e o cliente no balcão não vê nada.
2. **O funcionário trabalha, mas não vê seu lucro.** O mecânico abre OS, lança peças, tira fotos e recebe pagamentos, e o custo e o lucro nem chegam ao celular dele.
3. **Fotos de entrada, serviço e saída dentro do PDF.** Elas provam o estado do carro na chegada e o que foi trocado, o que encerra discussão sobre arranhão e peça velha.
4. **Estoque que baixa sozinho na entrega.** A peça escolhida na OS sai da prateleira quando o carro é entregue e volta se a OS for reaberta ou cancelada, sem conta de cabeça.
5. **Entrega com pagamento parcial vira fiado automaticamente.** Ao entregar, o sistema pergunta "Pagou tudo, Parcial ou Não recebi?", e o que faltar cai em Contas a receber, com os dias em aberto.
6. **Documento com a cara da oficina, pronto para o WhatsApp.** Logo, cor, garantia e assinatura da oficina, em PDF ou imagem, com o nome do arquivo já preenchido.
7. **Comprovante e extrato em uma imagem.** O cliente recebe um recibo limpo com o que pagou, quando pagou e quanto falta, em vez de um print recortado.
8. **Margem colorida em cada linha.** Verde, âmbar ou vermelho mostram de longe qual serviço deu dinheiro e qual saiu barato demais.
9. **Copiar o carro para a autopeça em um toque.** Marca, motor, ano, combustível e km saem num texto pronto para colar no WhatsApp do balconista.

---

# Parte 3 · Código visual

## 3.0 Dependências

Em todos os arquivos abaixo, a lógica que não muda o visual (buscas, gravações, permissões, rascunho, compressão de foto, geração de arquivo) foi trocada por comentários `// [removido: …]`. JSX, classes Tailwind e estrutura estão como no repositório. Para o vídeo, os dados de cada tela vêm da **Parte 4**.

**Já enviados no pacote de 07/10 e sem mudança desde então** (conferido no histórico do git):

| Arquivo | Pacote | O que estas telas usam dele |
|---|---|---|
| `src/app/globals.css` | 1 | tokens (`tinta`, `superficie`, `linha`, `ok`, `atencao`, `perigo`, `brand`, `contraste`), classes `.status-*`, `.documento`, `.no-print`, `doc-*` |
| `tailwind.config.ts` | 1 | mapeamento dos tokens |
| `src/components/ui/Botao.tsx` | 1 | `Botao`, `BotaoLink` (variantes `secundario`, `sucesso`, `perigo`, `contraste`, `fantasma`; tamanhos `denso`, `icone`) |
| `src/components/ui/Campos.tsx` | 1 | `CampoDinheiro`, `CampoQuantidade`, `Entrada`, `Selecao`, `BASE_CAMPO` |
| `src/components/ui/Dados.tsx` | 1 | `Metrica`, `Esqueleto`, `EsqueletoLista`, `Vazio` |
| `src/components/ui/Modal.tsx` | 1 | `Modal` |
| `src/components/ui/Avisos.tsx` | 1 | `useAvisar`, `useConfirmar` |
| `src/components/ui/Icones.tsx` | 1 | `Caixa`, `Chevron`, `Lapis`, `Lixeira`, `Olho`, `Voltar`, `Avancar`, `Fechar`, `Negrito`, `Titulo`, `ListaMarcadores`, `ListaNumerada`. O arquivo ganhou depois só quatro ícones da tela de assinatura (`Cartao`, `QrCode`, `Escudo`, `Calendario`), que a OS não usa. |
| `src/components/ui/TextoFormatado.tsx` | 1 | descrição formatada na tela |
| `src/components/CopiarVeiculo.tsx` | 1 | item "Copiar carro" do menu |
| `src/lib/utils.ts` | 1 | `cn`, `formatCurrency`, `formatDate`, `formatDatetime`, `paraNumero`, `situacaoRecebimento`, `normalizarBusca` |
| `src/lib/configuracao.ts` | 1 | `Configuracao`, `EMITIDO_COM`, `valorReserva`, `linhasDoCabecalho`, `rodapeDoDocumento`, `CONFIG_PADRAO` |
| `src/lib/cor-documento.ts` | 1 | `estiloDoDocumento`, `corDeTextoNoPapel` |
| `src/components/TextoFormatadoPdf.tsx` | 3 | descrição formatada no PDF |
| `src/lib/formato-download.ts` | 3 | `FORMATOS` (PDF / Imagem) |
| `src/lib/pdf-para-imagem.ts` | 3 | PDF → PNG |
| `src/components/ClienteSelect.tsx` | 4 | campo Cliente do formulário |

## 3.1 src/lib/constants.ts (trecho)

### src/lib/constants.ts

_Trecho: só o que as telas da OS usam. Comentários encurtados._

```ts
export const OS_STATUS = [
  { value: "ABERTA", label: "Aberta", cor: "status status-aberta" },
  { value: "EM_ANDAMENTO", label: "Em andamento", cor: "status status-andamento" },
  { value: "AGUARDANDO_PECA", label: "Ag. peça", cor: "status status-peca" },
  { value: "ENTREGUE", label: "Entregue", cor: "status status-entregue" },
  { value: "CANCELADA", label: "Cancelada", cor: "status status-inerte" },
] as const;

export const OS_STATUS_VALUES: string[] = OS_STATUS.map((s) => s.value);

/** No pátio: serviço em andamento, ainda não entregue. */
export const OS_EM_ABERTO: string[] = ["ABERTA", "EM_ANDAMENTO", "AGUARDANDO_PECA"];

/** Concluída: conta como produção, na data de entrega. */
export const OS_CONCLUIDA: string[] = ["ENTREGUE"];

export function labelStatus(status: string): string {
  return OS_STATUS.find((s) => s.value === status)?.label ?? status;
}

export function corStatus(status: string): string {
  return OS_STATUS.find((s) => s.value === status)?.cor ?? "status status-inerte";
}

export const FORMAS_PAGAMENTO = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "CARTAO_CREDITO", label: "Cartão de crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de débito" },
  { value: "TRANSFERENCIA", label: "Transferência" },
] as const;

export function labelFormaPagamento(valor: string | null | undefined): string {
  if (!valor) return "";
  return FORMAS_PAGAMENTO.find((f) => f.value === valor)?.label ?? valor;
}

/** Margem de lucro da OS, ou null quando não há faturamento para comparar. */
export function margemOS(os: { total: number; lucroReal: number }): number | null {
  return os.total > 0 ? (os.lucroReal / os.total) * 100 : null;
}

/** Faixas de margem das listas: verde saudável, âmbar apertada, vermelha no vermelho. */
export function corMargem(margem: number | null): string {
  if (margem === null) return "text-tinta-3";
  if (margem >= 40) return "text-ok";
  if (margem >= 20) return "text-atencao";
  return "text-perigo";
}

export const COMBUSTIVEIS = [
  { value: "GASOLINA", label: "Gasolina" },
  { value: "ETANOL", label: "Etanol" },
  { value: "FLEX", label: "Flex" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELETRICO", label: "Elétrico" },
  { value: "HIBRIDO", label: "Híbrido" },
  { value: "GNV", label: "GNV" },
] as const;

export type VeiculoInfo = {
  marca: string;
  modelo: string;
  ano?: number | null;
  anoFabricacao?: number | null;
  anoModelo?: number | null;
  km?: number | null;
  motorizacao?: string | null;
  valvulas?: string | null;
  combustivel?: string | null;
};

/** Ano no formato que a auto peça usa: fabricação/modelo quando existem os dois. */
export function anoVeiculo(v: VeiculoInfo): string | null {
  if (v.anoFabricacao && v.anoModelo) return `${v.anoFabricacao}/${v.anoModelo}`;
  const unico = v.anoFabricacao ?? v.anoModelo ?? v.ano;
  return unico ? String(unico) : null;
}

// Momento em que a foto da OS foi tirada.
// A ordem daqui define a ordem das seções na tela, na impressão e no PDF.
export const FOTO_TIPOS = [
  { value: "ENTRADA", label: "Entrada", ajuda: "Estado do veículo na chegada" },
  { value: "SERVICO", label: "Serviço", ajuda: "Peças trocadas, antes e depois" },
  { value: "SAIDA", label: "Saída", ajuda: "Estado do veículo na entrega" },
] as const;

export type FotoTipo = (typeof FOTO_TIPOS)[number]["value"];
export const FOTO_TIPO_PADRAO: FotoTipo = "SERVICO";
export const FOTO_TIPO_ORCAMENTO: FotoTipo = "ENTRADA";
export const FOTO_LEGENDA_MAX = 140;

export function tipoDaFoto(tipo: string): FotoTipo {
  return FOTO_TIPOS.find((t) => t.value === tipo)?.value ?? FOTO_TIPO_PADRAO;
}

/** Quantidade sem casas inúteis: "10 UN", mas "2,5 L". */
export function formatQuantidade(valor: number, unidade?: string | null): string {
  const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(valor);
  return unidade ? `${numero} ${unidade}` : numero;
}
```

## 3.2 Ganchos de permissão (substituto para o vídeo)

### src/components/UsuarioProvider.tsx

_Substituto: no repositório os dois ganchos leem o usuário logado (`useContext`). Para o vídeo, fixe os valores. `true` / `true` é a visão do dono; `false` / `false` é a do operador, que esconde custo, ganho, lucro, Visão interna e o item "Excluir OS"._

```tsx
// [removido: contexto do usuário logado]
export function usePodeFinanceiro(): boolean {
  return true; // false = visão do operador
}

export function usePodeExcluir(): boolean {
  return true;
}
```

## 3.3 Tela da OS do dono

A tela tem duas colunas a partir de `lg`: à esquerda, **o documento como o cliente vê** (folha branca imprimível); à direita, **as ferramentas internas** (Visão interna com lucro, Pagamento, Desconto e Fotos), que não saem na impressão. No celular, as ferramentas ficam abaixo do documento.

### src/app/os/[id]/page.tsx

_Lógica de dados removida (`// [removido: …]`); JSX, classes e estrutura intactos. Para o vídeo, preencha `os` com `osAberta` e `config` com `configuracao` (Parte 4)._

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn, formatCurrency, formatDate, formatDatetime, paraNumero } from "@/lib/utils";
import {
  FOTO_TIPOS,
  tipoDaFoto,
  labelStatus,
  corStatus,
  OS_STATUS_VALUES,
  OS_CONCLUIDA,
  anoVeiculo,
  FORMAS_PAGAMENTO,
  labelFormaPagamento,
} from "@/lib/constants";
import Fotos, { type Foto } from "@/components/Fotos";
import CopiarVeiculo from "@/components/CopiarVeiculo";
import CabecalhoDocumento from "@/components/CabecalhoDocumento";
import { usePodeFinanceiro, usePodeExcluir } from "@/components/UsuarioProvider";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { CampoDinheiro, Entrada, Selecao } from "@/components/ui/Campos";
import { Modal } from "@/components/ui/Modal";
import { Esqueleto, Metrica } from "@/components/ui/Dados";
import { EMITIDO_COM, valorReserva, type Configuracao } from "@/lib/configuracao";
import { estiloDoDocumento } from "@/lib/cor-documento";
import { Caixa, Chevron, Lapis, Lixeira, Olho, Voltar } from "@/components/ui/Icones";
import { TextoFormatado } from "@/components/ui/TextoFormatado";

const BaixarOS = dynamic(() => import("@/components/BaixarOS"), {
  ssr: false,
  loading: () => (
    <span className="inline-block rounded-lg border border-linha px-3 py-1.5 text-sm text-tinta-3">
      Baixar PDF
    </span>
  ),
});

const BaixarComprovante = dynamic(() => import("@/components/BaixarComprovante"), {
  ssr: false,
  loading: () => (
    <span className="inline-block rounded-lg border border-linha px-3 py-1.5 text-xs text-tinta-3">
      Baixar comprovante
    </span>
  ),
});

type Item = {
  id: string; tipo: string; descricao: string; quantidade: number;
  valorUnit: number; valorTotal: number; custoUnit: number | null;
  /** Peça que saiu (ou vai sair, na entrega) da prateleira. */
  produtoId: string | null;
};
type Pagamento = {
  id: string; valor: number; formaPagamento: string; data: string; obs: string | null;
};
type OS = {
  id: string; numero: number; status: string; descricao: string;
  defeitoRelatado: string | null;
  kmEntrada: number | null; kmSaida: number | null;
  totalPecas: number; totalMO: number; desconto: number; total: number;
  pago: boolean; valorPago: number; formaPagamento: string | null; obs: string | null;
  mecanico: string | null; nivelCombustivel: string | null; combustivelEmUso: string | null;
  // Ausentes na resposta quando quem pede é operador.
  custoTotalPecas?: number; lucroReal?: number; margemPecas?: number;
  abertura: string; fechamento: string | null;
  cliente: {
    id: string; nome: string; telefone: string | null; cpfCnpj: string | null;
    email: string | null; endereco: string | null; cidade: string | null; estado: string | null;
  };
  veiculo: {
    id: string; marca: string; modelo: string; placa: string | null; ano: number | null;
    cor: string | null; motorizacao: string | null;
    anoFabricacao: number | null; anoModelo: number | null;
    valvulas: string | null; combustivel: string | null; km: number | null;
  };
  itens: Item[];
  pagamentos: Pagamento[];
  fotos: Foto[];
};

const STATUS_OPTIONS = OS_STATUS_VALUES;

const NIVEL_LABEL: Record<string, string> = { CHEIO: "Cheio", MEIO: "Meio", VAZIO: "Vazio" };
const TIPO_LABEL: Record<string, string> = { PECA: "Peça", MAO_DE_OBRA: "Mão de obra", SERVICO: "Serviço" };

type PayMode = "TOTAL" | "PARCIAL" | "SEM_PAGAMENTO";

export default function OSDetailPage() {
  const podeFinanceiro = usePodeFinanceiro();
  const podeExcluir = usePodeExcluir();
  // [removido: busca de dados — GET /api/os/[id]. Para o vídeo: `osAberta` da Parte 4]
  const [os, setOs] = useState<OS | null>(null);
  const [loading] = useState(false);
  const [pgtoForm, setPgtoForm] = useState({ valor: "", formaPagamento: "DINHEIRO", obs: "" });
  const [savingPgto] = useState(false);
  const [payModal, setPayModal] = useState<{ entrega: boolean } | null>(null);
  const [payMode, setPayMode] = useState<PayMode>("TOTAL");
  const [devedor, setDevedor] = useState<{ saldo: number } | null>(null);
  const [descontoInput, setDescontoInput] = useState("");
  const [savingDesconto] = useState(false);
  const [deletingOS] = useState(false);
  const [changingStatus] = useState(false);
  // Começa borrada; no app, volta ao estado em que o dono a deixou (localStorage).
  const [revelado, setRevelado] = useState(false);
  const [estornando] = useState<string | null>(null);
  const [estornoModal, setEstornoModal] = useState<{ pagamentoId?: string; valor: number } | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  // [removido: busca de dados — GET /api/configuracao, só para o dono. Para o vídeo: `configuracao`]
  const [config] = useState<Configuracao | null>(null);

  function alternarRevelado() {
    setRevelado((v) => !v);
  }

  // [removido: ajuste de impressão — encolhe a folha que passa da largura A4 no Ctrl+P]

  function handleStatusChange(status: string) {
    if (!os || status === os.status) return;
    const saldoAtual = os.total - os.valorPago;
    // Entregar com saldo em aberto exige registrar o pagamento antes.
    if (status === "ENTREGUE" && os.status !== "ENTREGUE" && saldoAtual > 0) {
      openPay(true);
      return;
    }
    // [removido: grava o status; o aviso diz "Status alterado para X. N peças baixadas do estoque."]
  }

  function openPay(entrega: boolean) {
    if (!os) return;
    const saldoAtual = os.total - os.valorPago;
    setPgtoForm({ valor: saldoAtual > 0 ? saldoAtual.toFixed(2) : "", formaPagamento: "DINHEIRO", obs: "" });
    setPayMode("TOTAL");
    setPayModal({ entrega });
  }

  async function confirmPay(e: React.FormEvent) {
    e.preventDefault();
    // [removido: registra o pagamento e, na entrega, marca Entregue. Se sobrar saldo,
    //  abre o modal "OS entregue com saldo pendente" via setDevedor({ saldo })]
  }

  async function confirmEstorno() {
    // [removido: apaga um pagamento (ou todos) e recalcula o saldo]
  }

  async function saveDesconto(e: React.FormEvent) {
    e.preventDefault();
    // [removido: grava o desconto e recalcula total e lucro]
  }

  async function deleteOS() {
    // [removido: confirmação "Excluir a OS #N?" e exclusão]
  }

  if (loading) return <EsqueletoOS />;
  if (!os) return <div className="p-6 text-sm text-tinta-3">OS não encontrada.</div>;

  const saldo = os.total - os.valorPago;
  // `custoTotalPecas` não vem para o operador — o `?? 0` mantém a conta definida
  // mesmo assim, e o bloco que a usa só é renderizado para o dono.
  const margemValor = os.totalPecas - (os.custoTotalPecas ?? 0);
  const podeEditar = os.status !== "ENTREGUE" && os.status !== "CANCELADA";

  // Valor/validação do modal de pagamento
  const valorParcialNum = Number(pgtoForm.valor) || 0;
  const restanteParcial = Math.max(0, saldo - valorParcialNum);
  const parcialInvalido =
    payModal?.entrega && payMode === "PARCIAL" && (valorParcialNum <= 0 || valorParcialNum > saldo);

  const veicLinha: string[] = [];
  if (os.veiculo.cor) veicLinha.push(`Cor: ${os.veiculo.cor}`);
  if (os.veiculo.motorizacao) veicLinha.push(`Motor: ${os.veiculo.motorizacao}`);

  return (
    <div className="pb-12">
      {/* Barra de ações — oculta na impressão.
          `top-14` no celular: a barra é `sticky` dentro de um documento cujo topo
          fica atrás do cabeçalho fixo de 56 px. */}
      <div className="no-print sticky top-14 z-20 border-b border-linha bg-superficie/95 backdrop-blur md:top-0">
        {/* Mesmo max-w e padding do documento abaixo, para as bordas coincidirem. */}
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2.5 sm:gap-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/os"
              aria-label="Voltar para ordens de serviço"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-tinta-3 hover:bg-superficie-2 hover:text-tinta-2 sm:h-9 sm:w-9"
            >
              <Voltar tamanho={18} />
            </Link>
            <div className="min-w-0">
              <p className="text-sm font-semibold tabular-nums text-tinta">#{os.numero}</p>
              <p className="truncate text-xs text-tinta-3">
                {os.cliente.nome} · {os.veiculo.marca} {os.veiculo.modelo}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {saldo > 0 && OS_CONCLUIDA.includes(os.status) && (
              <span className="hidden rounded-full bg-atencao-fraco px-3 py-1 text-xs font-medium tabular-nums text-atencao lg:inline">
                A receber — {formatCurrency(saldo)}
              </span>
            )}

            {/* Status: pílula colorida com seta, para dizer que abre. */}
            <div className="relative">
              <select
                value={os.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={changingStatus}
                aria-label="Status da OS"
                className={cn(
                  "min-h-11 cursor-pointer appearance-none rounded-lg border-0 py-1.5 pl-3 pr-8 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 sm:min-h-9",
                  corStatus(os.status)
                )}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {labelStatus(s)}
                  </option>
                ))}
              </select>
              <Chevron
                tamanho={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-70"
              />
            </div>

            {/* Ações secundárias num menu; só status e voltar ficam à vista. */}
            <div className="relative">
              <Botao
                variante="secundario"
                tamanho="icone"
                onClick={() => setMenuAberto((v) => !v)}
                aria-label="Mais ações"
                aria-expanded={menuAberto}
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  ⋯
                </span>
              </Botao>
              {menuAberto && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuAberto(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-60 overflow-hidden rounded-xl border border-linha bg-superficie p-1 shadow-lg">
                    {saldo > 0 && OS_CONCLUIDA.includes(os.status) && (
                      <p className="px-3 py-2 text-xs font-medium tabular-nums text-atencao lg:hidden">
                        A receber — {formatCurrency(saldo)}
                      </p>
                    )}
                    <CopiarVeiculo veiculo={os.veiculo} comoItem />
                    {os.status !== "CANCELADA" && (
                      <Link
                        href={`/os/${os.id}/editar`}
                        className="flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm text-tinta-2 hover:bg-superficie-2"
                      >
                        <Lapis tamanho={16} className="shrink-0" />
                        Editar OS
                      </Link>
                    )}
                    <BaixarOS os={os} comoItem />
                    {/* Excluir apaga faturamento junto — fica com o dono e separado por um filete. */}
                    {podeExcluir && (
                      <>
                        <div className="my-1 border-t border-linha" />
                        <button
                          onClick={() => {
                            setMenuAberto(false);
                            deleteOS();
                          }}
                          disabled={deletingOS}
                          className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm text-perigo hover:bg-perigo-fraco disabled:opacity-50"
                        >
                          <Lixeira tamanho={16} className="shrink-0" />
                          Excluir OS
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Corpo: documento (esquerda) + ferramentas internas (direita, sticky em telas largas) */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
      {/* Documento da OS — preview de como sai para o cliente (imprimível) */}
      <div className="min-w-0">
        <div
          className="documento print-doc rounded-xl border border-linha bg-superficie text-tinta shadow-sm"
          style={estiloDoDocumento(config?.corDocumento)}
        >
          {/* Cabeçalho da oficina — vem do painel de configurações */}
          <CabecalhoDocumento />

          <div className="px-5 sm:px-8 py-6">
            {/* Número da OS e status */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-tinta-3">Ordem de Serviço</p>
                <p className="text-3xl font-black text-doc-texto">#{os.numero}</p>
              </div>
              <div className="text-right">
                <span className={cn("rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap", corStatus(os.status))}>
                  {labelStatus(os.status)}
                </span>
              </div>
            </div>

            {/* Dados do cliente e veículo */}
            <div className="mb-6 grid gap-x-8 gap-y-3 border-b border-linha pb-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Row label="Data" value={formatDate(os.abertura)} />
                <Row label="Cliente" value={os.cliente.nome} bold />
                {os.cliente.telefone && <Row label="Tel" value={os.cliente.telefone} />}
                {os.cliente.cpfCnpj && <Row label="CPF/CNPJ" value={os.cliente.cpfCnpj} />}
                {os.cliente.endereco && (
                  <Row
                    label="Endereço"
                    value={`${os.cliente.endereco}${os.cliente.cidade ? `, ${os.cliente.cidade}` : ""}${os.cliente.estado ? ` - ${os.cliente.estado}` : ""}`}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Row
                  label="Veículo"
                  value={`${os.veiculo.marca} ${os.veiculo.modelo}${anoVeiculo(os.veiculo) ? ` (${anoVeiculo(os.veiculo)})` : ""}`}
                  bold
                />
                {os.veiculo.placa && <Row label="Placa" value={os.veiculo.placa} />}
                {veicLinha.length > 0 && <Row label="Detalhes" value={veicLinha.join("  ·  ")} />}
                {os.kmSaida != null && <Row label="KM saída" value={os.kmSaida.toLocaleString("pt-BR")} />}
                {os.mecanico && <Row label="Mecânico" value={os.mecanico} />}
                {os.formaPagamento && <Row label="Pagamento" value={labelFormaPagamento(os.formaPagamento)} />}
              </div>
            </div>

            {/* Recepção */}
            {(os.kmEntrada != null || os.nivelCombustivel || os.combustivelEmUso) && (
              <div className="mb-6 rounded-lg bg-superficie-2 px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-3">Recepção do veículo</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  {os.kmEntrada != null && (
                    <span><span className="text-tinta-3">KM entrada: </span>{os.kmEntrada.toLocaleString("pt-BR")}</span>
                  )}
                  {os.nivelCombustivel && (
                    <span><span className="text-tinta-3">Nível: </span>{NIVEL_LABEL[os.nivelCombustivel] ?? os.nivelCombustivel}</span>
                  )}
                  {os.combustivelEmUso && (
                    <span><span className="text-tinta-3">Combustível em uso: </span>{os.combustivelEmUso}</span>
                  )}
                </div>
              </div>
            )}

            {/* Defeito relatado pelo cliente */}
            {os.defeitoRelatado && (
              <div className="mb-6">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-tinta-3">Defeito relatado pelo cliente</p>
                <p className="text-sm leading-relaxed text-tinta whitespace-pre-wrap">{os.defeitoRelatado}</p>
              </div>
            )}

            {/* Descrição do serviço */}
            <div className="mb-6">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-tinta-3">Descrição do serviço</p>
              <TextoFormatado texto={os.descricao} />
            </div>

            {/* Itens e serviços */}
            {os.itens.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-3">Itens e serviços</p>
                <div className="overflow-x-auto">
                <table className="w-full min-w-[26rem] text-sm">
                  <thead>
                    <tr className="border-b border-linha-forte text-left text-xs text-tinta-3">
                      <th className="pb-1.5 font-medium">Tipo</th>
                      <th className="pb-1.5 font-medium">Descrição</th>
                      <th className="pb-1.5 text-right font-medium">Qtd</th>
                      <th className="pb-1.5 text-right font-medium">Unit</th>
                      <th className="pb-1.5 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linha">
                    {os.itens.map((item) => (
                      <tr key={item.id}>
                        <td className="py-1.5 text-xs text-tinta-3">{TIPO_LABEL[item.tipo] ?? item.tipo}</td>
                        <td className="py-1.5 pr-2">
                          <span className="flex items-center gap-1.5">
                            {/* Peça do estoque: some na impressão — é informação interna. */}
                            {item.produtoId && (
                              <Caixa
                                tamanho={13}
                                className="no-print shrink-0 text-tinta-3"
                                aria-label="Peça do estoque"
                              />
                            )}
                            <span className="min-w-0">{item.descricao}</span>
                          </span>
                        </td>
                        <td className="py-1.5 text-right text-tinta-2">{item.quantidade}</td>
                        <td className="py-1.5 text-right text-tinta-2">{formatCurrency(item.valorUnit)}</td>
                        <td className="py-1.5 text-right font-medium">{formatCurrency(item.valorTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}

            {/* Resumo financeiro */}
            <div className="border-t border-linha pt-4">
              <div className="ml-auto max-w-xs space-y-2">
                {os.totalPecas > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-tinta-3">Total peças</span>
                    <span>{formatCurrency(os.totalPecas)}</span>
                  </div>
                )}
                {os.totalMO > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-tinta-3">Mão de obra / Serviços</span>
                    <span>{formatCurrency(os.totalMO)}</span>
                  </div>
                )}
                {os.desconto > 0 && (
                  <div className="flex justify-between text-sm text-ok">
                    <span>Desconto</span>
                    <span>- {formatCurrency(os.desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-linha pt-2 text-base font-bold">
                  <span>TOTAL</span>
                  <span className={saldo > 0 ? "text-perigo" : "text-ok"}>{formatCurrency(os.total)}</span>
                </div>
                {os.valorPago > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-tinta-3">
                      <span>Pago</span>
                      <span>{formatCurrency(os.valorPago)}</span>
                    </div>
                    {saldo > 0 && (
                      <div className="flex justify-between text-sm font-medium text-perigo">
                        <span>Saldo</span>
                        <span>{formatCurrency(saldo)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Observações */}
            {os.obs && (
              <div className="mt-6 rounded-lg bg-superficie-2 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-tinta-3">Observações</p>
                <p className="text-sm text-tinta whitespace-pre-wrap">{os.obs}</p>
              </div>
            )}

            {/* Assinatura do cliente */}
            <div className="mt-10 flex justify-center">
              <div className="w-72 text-center">
                <div className="border-t border-linha-forte pt-1.5 text-xs text-tinta-3">
                  Assinatura do Cliente
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-[10px] text-tinta-3">{EMITIDO_COM}</p>
          </div>
        </div>

        {/* Fotos no documento — páginas próprias na impressão, agrupadas por momento */}
        {os.fotos.length > 0 && (
          <div className="print-fotos mt-6 space-y-5 rounded-xl border border-linha bg-superficie px-5 sm:px-8 py-6 shadow-sm print:border-none print:shadow-none">
            <p className="text-xs font-semibold uppercase tracking-wide text-tinta-3">
              Fotos do serviço
            </p>
            {FOTO_TIPOS.map((t) => {
              const doMomento = os.fotos.filter((f) => tipoDaFoto(f.tipo) === t.value);
              if (doMomento.length === 0) return null;
              return (
                <section key={t.value}>
                  <p className="mb-2 border-b border-linha pb-1 text-xs font-semibold uppercase tracking-wide text-tinta-3">
                    {t.label}
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {doMomento.map((foto) => (
                      <figure key={foto.id}>
                        {/* object-contain: a foto aparece inteira e centralizada, sem corte */}
                        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-linha bg-superficie-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={foto.url}
                            alt={foto.legenda ?? `Foto — ${t.label}`}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <figcaption className="mt-1 text-xs leading-tight text-tinta-3">
                          {foto.legenda ? (
                            <span className="block font-medium text-tinta-2">{foto.legenda}</span>
                          ) : null}
                          {formatDate(foto.createdAt)}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Ferramentas de gestão — não aparecem na impressão */}
      <div className="no-print mt-6 space-y-5 lg:sticky lg:top-20 lg:mt-0 lg:self-start">
        {/* Visão interna — lucros. Só quem tem financeiro: a API nem envia estes campos aos demais. */}
        {podeFinanceiro && ((os.custoTotalPecas ?? 0) > 0 || os.totalPecas > 0 || os.totalMO > 0) && (
          <div className="rounded-xl border border-linha bg-superficie p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-tinta-3">
                Visão interna
              </p>
              <button
                type="button"
                onClick={alternarRevelado}
                className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-tinta-3 hover:bg-superficie-3 hover:text-tinta transition-colors"
                title={revelado ? "Ocultar valores" : "Revelar valores"}
              >
                <Olho tamanho={14} fechado={revelado} />
                {revelado ? "Ocultar" : "Revelar"}
              </button>
            </div>
            <p className="mb-3 text-xs text-tinta-3">Não aparece para o cliente</p>
            <div
              className={cn(
                "grid grid-cols-2 gap-3 transition-all duration-300",
                !revelado && "pointer-events-none select-none blur-sm"
              )}
            >
              <Metrica rotulo="Custo das peças" valor={formatCurrency(os.custoTotalPecas ?? 0)} />
              <Metrica
                rotulo="Margem em peças"
                valor={formatCurrency(margemValor)}
                sub={os.totalPecas > 0 ? `${(os.margemPecas ?? 0).toFixed(0)}% sobre as peças` : undefined}
                tom={margemValor >= 0 ? "ok" : "perigo"}
              />
              <Metrica rotulo="Mão de obra" valor={formatCurrency(os.totalMO)} />
              <Metrica rotulo="Lucro real" valor={formatCurrency(os.lucroReal ?? 0)} tom="ok" />
              {config && valorReserva(config, os.lucroReal ?? 0) !== null && (
                <Metrica
                  rotulo={`Guardar (${config.reservaLucroPercentual}%)`}
                  valor={formatCurrency(valorReserva(config, os.lucroReal ?? 0) ?? 0)}
                />
              )}
            </div>
          </div>
        )}

        {/* Pagamento */}
        <div className="bg-superficie rounded-xl border border-linha p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-tinta">Pagamento</h2>
            {saldo > 0 && (
              <Botao variante="sucesso" tamanho="denso" onClick={() => openPay(false)}>
                Registrar
              </Botao>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Metrica rotulo="Total" valor={formatCurrency(os.total)} />
            <Metrica rotulo="Pago" valor={formatCurrency(os.valorPago)} tom="ok" />
            <Metrica rotulo="Saldo" valor={formatCurrency(saldo)} tom={saldo > 0 ? "perigo" : "ok"} />
          </div>

          {os.pago && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-ok">Pagamento quitado</p>
              <Botao
                variante="secundario"
                tamanho="denso"
                onClick={() => setEstornoModal({ valor: os.valorPago })}
              >
                Desmarcar como recebido
              </Botao>
            </div>
          )}

          {os.pagamentos.length > 0 && (
            <div className="border-t border-linha pt-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-tinta-3">Histórico</p>
                <BaixarComprovante
                  dados={{
                    cliente: { nome: os.cliente.nome },
                    itens: [
                      {
                        numero: os.numero,
                        veiculo: { marca: os.veiculo.marca, modelo: os.veiculo.modelo, placa: os.veiculo.placa },
                        desconto: os.desconto,
                        total: os.total,
                        valorPago: os.valorPago,
                        pago: os.pago,
                        pagamentos: os.pagamentos,
                      },
                    ],
                  }}
                />
              </div>
              <div className="space-y-1.5">
                {os.pagamentos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium tabular-nums text-tinta-2">
                        {formatCurrency(p.valor)}
                      </span>
                      <span className="ml-2 text-tinta-3">{labelFormaPagamento(p.formaPagamento)}</span>
                      {p.obs && <span className="ml-2 text-tinta-3">· {p.obs}</span>}
                      <span className="block text-xs tabular-nums text-tinta-3">
                        {formatDatetime(p.data)}
                      </span>
                    </div>
                    <Botao
                      variante="fantasma"
                      tamanho="denso"
                      onClick={() => setEstornoModal({ pagamentoId: p.id, valor: p.valor })}
                      disabled={estornando === p.id}
                      title="Estornar este pagamento"
                    >
                      Estornar
                    </Botao>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desconto — some quando a OS foi entregue ou cancelada */}
        {podeEditar && (
          <div className="bg-superficie rounded-xl border border-linha p-5 space-y-4">
            <h2 className="font-semibold text-tinta">Desconto</h2>
            <form onSubmit={saveDesconto} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[140px] flex-1">
                <label className="mb-1 block text-xs font-medium text-tinta-2" htmlFor="desconto">
                  Valor do desconto
                </label>
                <CampoDinheiro
                  id="desconto"
                  valor={descontoInput}
                  onChange={setDescontoInput}
                  placeholder="0,00"
                />
              </div>
              <Botao type="submit" variante="contraste" disabled={savingDesconto}>
                {savingDesconto ? "Aplicando..." : "Aplicar"}
              </Botao>
            </form>
            <div className="space-y-1 border-t border-linha pt-3 text-sm tabular-nums">
              <div className="flex justify-between text-tinta-3">
                <span>Subtotal (peças + M.O.)</span>
                <span>{formatCurrency(os.totalPecas + os.totalMO)}</span>
              </div>
              <div className="flex justify-between text-ok">
                <span>Desconto</span>
                <span>- {formatCurrency(paraNumero(descontoInput))}</span>
              </div>
              <div className="flex justify-between border-t border-linha pt-1 font-bold text-tinta">
                <span>Total com desconto</span>
                <span>{formatCurrency(os.totalPecas + os.totalMO - paraNumero(descontoInput))}</span>
              </div>
            </div>
          </div>
        )}

        {/* Fotos */}
        <Fotos
          apiBase={`/api/os/${os.id}/fotos`}
          fotos={os.fotos}
          podeEditar={os.status !== "CANCELADA"}
          onChange={(atualizar) =>
            setOs((atual) => (atual ? { ...atual, fotos: atualizar(atual.fotos) } : atual))
          }
        />
      </div>
      </div>

      {/* Modal de pagamento */}
      {payModal && (
        <Modal
          titulo={payModal.entrega ? "Confirmar entrega" : "Registrar pagamento"}
          descricao={
            payModal.entrega ? "A OS será marcada como Entregue. Registre o pagamento." : undefined
          }
          largura="max-w-sm"
          onFechar={() => setPayModal(null)}
          rodape={
            <div className="flex gap-2">
              <Botao
                type="submit"
                form="form-pagamento"
                variante={payModal.entrega && payMode === "SEM_PAGAMENTO" ? "perigo" : "sucesso"}
                className="flex-1"
                disabled={savingPgto || parcialInvalido}
              >
                {savingPgto
                  ? "Salvando..."
                  : payModal.entrega && payMode === "SEM_PAGAMENTO"
                    ? "Entregar sem receber"
                    : payModal.entrega
                      ? "Confirmar e entregar"
                      : "Confirmar"}
              </Botao>
              <Botao variante="secundario" className="flex-1" onClick={() => setPayModal(null)}>
                Cancelar
              </Botao>
            </div>
          }
        >
          <div className="mb-3 flex justify-between rounded-lg bg-superficie-2 px-3 py-2 text-sm">
            <span className="text-tinta-3">Saldo em aberto</span>
            <span className="font-semibold tabular-nums text-tinta">{formatCurrency(saldo)}</span>
          </div>

          <form id="form-pagamento" onSubmit={confirmPay} className="space-y-3">
            {payModal.entrega && (
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["TOTAL", "Pagou tudo", "border-ok-linha bg-ok-fraco text-ok"],
                    ["PARCIAL", "Parcial", "border-atencao-linha bg-atencao-fraco text-atencao"],
                    ["SEM_PAGAMENTO", "Não recebi", "border-perigo-linha bg-perigo-fraco text-perigo"],
                  ] as const
                ).map(([modo, label, ativo]) => (
                  <button
                    key={modo}
                    type="button"
                    onClick={() => setPayMode(modo)}
                    aria-pressed={payMode === modo}
                    className={cn(
                      "min-h-11 rounded-lg border px-2 text-sm font-medium transition-colors",
                      payMode === modo
                        ? ativo
                        : "border-linha-forte text-tinta-3 hover:bg-superficie-2"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {payModal.entrega && payMode === "SEM_PAGAMENTO" && (
              <p className="rounded-lg bg-perigo-fraco px-3 py-2 text-xs text-perigo">
                Nenhum pagamento será registrado agora. O saldo total de{" "}
                <span className="font-semibold">{formatCurrency(saldo)}</span> vai para Contas a
                receber.
              </p>
            )}

            {(!payModal.entrega || payMode === "PARCIAL") && (
              <div>
                <label className="mb-1 block text-xs font-medium text-tinta-2" htmlFor="valor-pgto">
                  Valor <span className="text-perigo">*</span>
                </label>
                <CampoDinheiro
                  id="valor-pgto"
                  valor={pgtoForm.valor}
                  onChange={(v) => setPgtoForm({ ...pgtoForm, valor: v })}
                  required
                  data-foco-inicial
                />
                {payModal.entrega && pgtoForm.valor && (
                  <p className="mt-1 text-xs text-tinta-3">
                    Restante a receber:{" "}
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        restanteParcial > 0 ? "text-atencao" : "text-ok"
                      )}
                    >
                      {formatCurrency(restanteParcial)}
                    </span>
                    {restanteParcial > 0 && " — vai para Contas a receber"}
                  </p>
                )}
                {parcialInvalido && (
                  <p className="mt-1 text-xs text-perigo">
                    Informe um valor entre R$ 0,01 e {formatCurrency(saldo)}.
                  </p>
                )}
              </div>
            )}

            {!(payModal.entrega && payMode === "SEM_PAGAMENTO") && (
              <div>
                <label className="mb-1 block text-xs font-medium text-tinta-2" htmlFor="forma-pgto">
                  Forma de pagamento
                </label>
                <Selecao
                  id="forma-pgto"
                  value={pgtoForm.formaPagamento}
                  onChange={(e) => setPgtoForm({ ...pgtoForm, formaPagamento: e.target.value })}
                >
                  {FORMAS_PAGAMENTO.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </Selecao>
              </div>
            )}

            {!payModal.entrega && (
              <div>
                <label className="mb-1 block text-xs font-medium text-tinta-2" htmlFor="obs-pgto">
                  Observação
                </label>
                <Entrada
                  id="obs-pgto"
                  value={pgtoForm.obs}
                  onChange={(e) => setPgtoForm({ ...pgtoForm, obs: e.target.value })}
                />
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* Estorno — desfaz o recebimento */}
      {estornoModal && (
        <Modal
          titulo={estornoModal.pagamentoId ? "Estornar pagamento" : "Desmarcar como recebido"}
          largura="max-w-sm"
          onFechar={() => setEstornoModal(null)}
          rodape={
            <div className="flex gap-2">
              <Botao
                variante="perigo"
                className="flex-1"
                onClick={confirmEstorno}
                disabled={estornando !== null}
              >
                {estornando !== null ? "Estornando..." : "Confirmar estorno"}
              </Botao>
              <Botao variante="secundario" className="flex-1" onClick={() => setEstornoModal(null)}>
                Cancelar
              </Botao>
            </div>
          }
        >
          <p className="text-sm text-tinta-2">
            {estornoModal.pagamentoId ? (
              <>
                O pagamento de{" "}
                <span className="font-semibold tabular-nums text-tinta">
                  {formatCurrency(estornoModal.valor)}
                </span>{" "}
                será apagado e o saldo volta para Contas a receber.
              </>
            ) : (
              <>
                Todos os pagamentos desta OS ({formatCurrency(estornoModal.valor)}) serão apagados e
                ela volta para Contas a receber.
              </>
            )}
          </p>
          <p className="mt-2 text-xs text-tinta-3">O status da OS não muda.</p>
        </Modal>
      )}

      {/* Entrega com saldo pendente */}
      {devedor && (
        <Modal
          titulo="OS entregue com saldo pendente"
          largura="max-w-sm"
          onFechar={() => setDevedor(null)}
          rodape={
            <div className="flex gap-2">
              <Botao variante="secundario" className="flex-1" onClick={() => setDevedor(null)}>
                Fechar
              </Botao>
              <BotaoLink href="/contas-receber" onClick={() => setDevedor(null)} className="flex-1">
                Ver contas a receber
              </BotaoLink>
            </div>
          }
        >
          <p className="text-sm text-tinta-2">
            Ficou um saldo de{" "}
            <span className="font-semibold tabular-nums text-atencao">
              {formatCurrency(devedor.saldo)}
            </span>
            . Ele já consta em Contas a receber.
          </p>
        </Modal>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-20 shrink-0 text-tinta-3">{label}:</span>
      <span className={bold ? "font-semibold text-tinta" : "text-tinta-2"}>{value}</span>
    </div>
  );
}

/** Esqueleto da OS: reserva a forma do documento para a tela não saltar. */
function EsqueletoOS() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6">
      <Esqueleto className="h-11 w-full" />
      <Esqueleto className="h-64 w-full" />
      <Esqueleto className="h-40 w-full" />
    </div>
  );
}
```

_Continua em `boxos-os-pack-2.md`: formulário, busca no estoque, fotos, documento, PDF, comprovante, indicador de margem, dados fictícios e observações._
