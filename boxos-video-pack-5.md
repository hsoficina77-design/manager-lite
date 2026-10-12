# boxOS — pacote visual para o vídeo · parte 5 de 5

**Esta parte:** Dados fictícios.

Pacote gerado em 07/10/2026 a partir do repositório do boxOS, só por leitura: nenhum arquivo do projeto foi alterado. Serve para recriar as telas num vídeo animado, fora do repositório.

Partes: 1. Mapa das telas, tokens, marca e componentes base · 2. Pátio (Dashboard e lista de OS) · 3. Orçamento, OS aberta e documento da OS · 4. Fiado e painel financeiro · 5. Dados fictícios. Os tokens, a marca e os componentes base estão na parte 1, e os dados fictícios na parte 5.

## Índice (todas as partes)

| Parte | Arquivo | Conteúdo | Tamanho aprox. |
|---|---|---|---|
| 1 | `src/app/globals.css` | íntegro | 17,8 KB |
| 1 | `tailwind.config.ts` | íntegro | 4,2 KB |
| 1 | `src/app/layout.tsx` | trecho: Poppins e variável de fonte | 0,9 KB |
| 1 | `src/components/marca/LogoBoxOS.tsx` | íntegro | 3,5 KB |
| 1 | `public/brand/boxOS_horizontal.svg` | íntegro | 1,0 KB |
| 1 | `public/brand/boxOS_horizontal_fundo_escuro.svg` | íntegro | 1,0 KB |
| 1 | `public/brand/boxOS_horizontal_mono_branco.svg` | íntegro | 1,0 KB |
| 1 | `public/brand/boxOS_horizontal_mono_preto.svg` | íntegro | 1,0 KB |
| 1 | `public/brand/boxOS_icone_app.svg` | íntegro | 0,9 KB |
| 1 | `public/brand/boxOS_simbolo.svg` | íntegro | 0,8 KB |
| 1 | `public/brand/favicon_16.svg` | íntegro | 0,5 KB |
| 1 | `src/components/ui/Icones.tsx` | íntegro | 8,5 KB |
| 1 | `src/components/ui/Botao.tsx` | íntegro | 2,5 KB |
| 1 | `src/lib/constants.ts` | trecho: corStatus() e OS_STATUS | 1,8 KB |
| 1 | `src/lib/cor-documento.ts` | íntegro | 4,8 KB |
| 1 | `src/app/layout.tsx` | trecho: casca do app (menu + conteúdo) | 1,4 KB |
| 1 | `src/components/Sidebar.tsx` | lógica de dados removida | 11,8 KB |
| 1 | `src/components/ui/BarraInferior.tsx` | íntegro | 3,2 KB |
| 1 | `src/components/ui/Dados.tsx` | íntegro | 7,7 KB |
| 1 | `src/components/ui/Campos.tsx` | íntegro | 6,2 KB |
| 1 | `src/components/ui/Modal.tsx` | íntegro | 5,3 KB |
| 1 | `src/components/ui/Avisos.tsx` | íntegro | 5,8 KB |
| 1 | `src/components/MaisDaLista.tsx` | íntegro | 1,1 KB |
| 1 | `src/components/ui/TextoFormatado.tsx` | íntegro | 2,7 KB |
| 1 | `src/components/CopiarVeiculo.tsx` | íntegro | 4,3 KB |
| 1 | `src/lib/utils.ts` | íntegro | 5,5 KB |
| 1 | `src/lib/configuracao.ts` | íntegro | 3,9 KB |
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
| **5** ← | `dados-ficticios.json` | gerado para o vídeo: não existe no repositório | 48,9 KB |

---

## 5. Dados fictícios

Oficina, pessoas, placas, documentos, telefones e valores **inventados**; nada saiu do banco. Referência de "hoje": **07/10/2026**. Os números fecham entre si: o lucro líquido do Dashboard é o "Resultado do mês" do ponto de equilíbrio, e as OS em fiado de setembro são as mesmas de Contas a receber. As chaves `resumoCalculado` não são lidas pelos componentes; servem para conferir o que a tela deve mostrar.

| Chave | Alimenta |
|---|---|
| `configuracao` | `CabecalhoDocumento`, `estiloDoDocumento()`, PDFs, "Guardar (10%)" |
| `sidebar`, `permissoes` | `Sidebar` (nome, usuário, contador vermelho); `usePodeFinanceiro` / `usePodeExcluir` |
| `dashboardOperacao` | Dashboard → Operação: pátio, hoje, devedores (`/?aba=operacao`) |
| `listaOS`, `mecanicos` | `/os?status=patio` |
| `orcamento` | `/orcamentos/[id]`, com `aposConversao` para o depois do clique |
| `osAberta` | `/os/[id]` e o PDF/imagem da OS (`OSPdfDocument`) |
| `contasReceber` | `/contas-receber` (`clientes`, `resumo`, `allClientes`) |
| `dashboardResultado` | Dashboard → Resultado, Setembro/2026 (`/?aba=resultado&periodo=mes&offset=-1`) |
| `despesas` | Props de `ControleDeGastos` (Setembro/2026), incluindo `equilibrio` |

### dados-ficticios.json — não existe no repositório

```json
{
  "referencia": {
    "hoje": "2026-10-07T12:00:00-03:00",
    "oficina": "Box 47 Mecânica (fictícia)",
    "observacao": "Todos os nomes, placas, documentos, telefones e valores são inventados."
  },
  "configuracao": {
    "nome": "Box 47 Mecânica",
    "nomeCurto": "Box 47",
    "cnpj": "12.345.678/0001-90",
    "telefone": "(11) 3000-0047",
    "whatsapp": "(11) 90000-0047",
    "email": "contato@box47mecanica.example",
    "site": "box47mecanica.example",
    "cep": "01000-000",
    "endereco": "Rua das Engrenagens, 47",
    "cidade": "São Paulo",
    "estado": "SP",
    "logoUrl": null,
    "corDocumento": "#f2a900",
    "rodapeDocumento": null,
    "mensagemDocumento": "Garantia de 90 dias para serviços e peças fornecidas pela oficina.",
    "mostrarAssinatura": true,
    "validadeOrcamentoDias": 7,
    "reservaLucroAtiva": true,
    "reservaLucroPercentual": 10
  },
  "sidebar": {"nome":"Box 47","usuario":{"nome":"Rafael Souza","papel":"ADMIN","podeFinanceiro":true},"pendingCount":5},
  "permissoes": {"podeFinanceiro":true,"podeExcluir":true},
  "mecanicos": [{"id":"mec-diego","nome":"Diego"},{"id":"mec-bruno","nome":"Bruno"},{"id":"mec-alex","nome":"Alex"}],
  "dashboardOperacao": {
    "url": "/?aba=operacao",
    "patio": [
      {"id":"os-1287","numero":1287,"status":"AGUARDANDO_PECA","abertura":"2026-09-19T09:10:00-03:00","cliente":{"id":"cli-paulo","nome":"Paulo Henrique Duarte","apelido":"Paulão"},"veiculo":{"marca":"Volkswagen","modelo":"Amarok","placa":"QTX4B12"},"mecanico":"Diego","total":4380,"custoTotalPecas":2350,"valorPago":1000,"lucroReal":2030,"pago":false,"fechamento":null},
      {"id":"os-1291","numero":1291,"status":"EM_ANDAMENTO","abertura":"2026-09-29T08:30:00-03:00","cliente":{"id":"cli-juliana","nome":"Juliana Prado","apelido":null},"veiculo":{"marca":"Honda","modelo":"Civic","placa":"RFA2C34"},"mecanico":"Bruno","total":2150,"custoTotalPecas":980,"valorPago":0,"lucroReal":1170,"pago":false,"fechamento":null},
      {"id":"os-1295","numero":1295,"status":"AGUARDANDO_PECA","abertura":"2026-10-02T14:00:00-03:00","cliente":{"id":"cli-marcos","nome":"Marcos Vinícius Teles","apelido":"Marcão do Uber"},"veiculo":{"marca":"Chevrolet","modelo":"Onix","placa":"SHB7D90"},"mecanico":"Diego","total":1640,"custoTotalPecas":720,"valorPago":0,"lucroReal":920,"pago":false,"fechamento":null},
      {"id":"os-1298","numero":1298,"status":"EM_ANDAMENTO","abertura":"2026-10-05T08:40:00-03:00","cliente":{"id":"cli-fernanda","nome":"Fernanda Lima Costa","apelido":null},"veiculo":{"marca":"Fiat","modelo":"Toro Volcano","placa":"RTL1E55"},"mecanico":"Bruno","total":3270,"custoTotalPecas":1610,"valorPago":500,"lucroReal":1660,"pago":false,"fechamento":null},
      {"id":"os-1301","numero":1301,"status":"ABERTA","abertura":"2026-10-06T16:20:00-03:00","cliente":{"id":"cli-ricardo","nome":"Ricardo Nogueira","apelido":null},"veiculo":{"marca":"Toyota","modelo":"Corolla","placa":"QWE9F21"},"mecanico":"Alex","total":890,"custoTotalPecas":310,"valorPago":0,"lucroReal":580,"pago":false,"fechamento":null},
      {"id":"os-1303","numero":1303,"status":"ABERTA","abertura":"2026-10-07T08:05:00-03:00","cliente":{"id":"cli-silvia","nome":"Sílvia Moreira","apelido":null},"veiculo":{"marca":"Hyundai","modelo":"HB20","placa":"SDG3H08"},"mecanico":"Alex","total":460,"custoTotalPecas":190,"valorPago":0,"lucroReal":270,"pago":false,"fechamento":null}
    ],
    "entreguesHoje": [{"total":1250,"lucroReal":740},{"total":680,"lucroReal":410}],
    "recebidoHojeOS": {"_sum":{"valor":1930}},
    "recebidoHojeDivida": {"_sum":{"valor":0}},
    "devedores": {
      "total": 6000,
      "quantidade": 4,
      "top5": [
        {"nome":"Eduardo Ramos","saldo":2980},
        {"nome":"Carla Mendes","saldo":1540},
        {"nome":"André Luiz Pacheco","saldo":1000},
        {"nome":"Seu Tonho do Opala","saldo":480}
      ]
    },
    "resumoCalculado": {
      "noPatio": 6,
      "emServico": 4,
      "agPeca": 2,
      "aReceber": 6000,
      "devedores": 4,
      "seFinalizarTudo": {"receitaPotencial":12790,"custoPecas":6160,"lucroPotencial":6630,"caixaAEntrar":11290},
      "hoje": {"entregues":2,"faturado":1930,"lucro":1150,"guardar":193,"recebido":1930}
    }
  },
  "listaOS": {
    "aba": "patio",
    "resposta": {
      "itens": [
        {"id":"os-1303","numero":1303,"status":"ABERTA","descricao":"Troca de óleo e filtros.","total":460,"valorPago":0,"pago":false,"abertura":"2026-10-07T08:05:00-03:00","mecanico":"Alex","lucroReal":270,"cliente":{"id":"cli-silvia","nome":"Sílvia Moreira","apelido":null},"veiculo":{"marca":"Hyundai","modelo":"HB20","placa":"SDG3H08"}},
        {"id":"os-1301","numero":1301,"status":"ABERTA","descricao":"Revisão dos 40.000 km.","total":890,"valorPago":0,"pago":false,"abertura":"2026-10-06T16:20:00-03:00","mecanico":"Alex","lucroReal":580,"cliente":{"id":"cli-ricardo","nome":"Ricardo Nogueira","apelido":null},"veiculo":{"marca":"Toyota","modelo":"Corolla","placa":"QWE9F21"}},
        {
          "id": "os-1298",
          "numero": 1298,
          "status": "EM_ANDAMENTO",
          "descricao": "## Troca do kit de embreagem\n- Substituir platô, disco e rolamento\n- Trocar o atuador hidráulico\n- Sangria do sistema e teste de rodagem",
          "total": 3270,
          "valorPago": 500,
          "pago": false,
          "abertura": "2026-10-05T08:40:00-03:00",
          "mecanico": "Bruno",
          "lucroReal": 1660,
          "cliente": {"id":"cli-fernanda","nome":"Fernanda Lima Costa","apelido":null},
          "veiculo": {"marca":"Fiat","modelo":"Toro Volcano","placa":"RTL1E55"}
        },
        {
          "id": "os-1295",
          "numero": 1295,
          "status": "AGUARDANDO_PECA",
          "descricao": "Barulho na suspensão dianteira — bieleta e bucha da bandeja (aguardando peça).",
          "total": 1640,
          "valorPago": 0,
          "pago": false,
          "abertura": "2026-10-02T14:00:00-03:00",
          "mecanico": "Diego",
          "lucroReal": 920,
          "cliente": {"id":"cli-marcos","nome":"Marcos Vinícius Teles","apelido":"Marcão do Uber"},
          "veiculo": {"marca":"Chevrolet","modelo":"Onix","placa":"SHB7D90"}
        },
        {"id":"os-1291","numero":1291,"status":"EM_ANDAMENTO","descricao":"Troca de amortecedores dianteiros e traseiros, alinhamento e balanceamento.","total":2150,"valorPago":0,"pago":false,"abertura":"2026-09-29T08:30:00-03:00","mecanico":"Bruno","lucroReal":1170,"cliente":{"id":"cli-juliana","nome":"Juliana Prado","apelido":null},"veiculo":{"marca":"Honda","modelo":"Civic","placa":"RFA2C34"}},
        {
          "id": "os-1287",
          "numero": 1287,
          "status": "AGUARDANDO_PECA",
          "descricao": "## Diagnóstico\nTurbina com folga axial — aguardando turbina remanufaturada do fornecedor.",
          "total": 4380,
          "valorPago": 1000,
          "pago": false,
          "abertura": "2026-09-19T09:10:00-03:00",
          "mecanico": "Diego",
          "lucroReal": 2030,
          "cliente": {"id":"cli-paulo","nome":"Paulo Henrique Duarte","apelido":"Paulão"},
          "veiculo": {"marca":"Volkswagen","modelo":"Amarok","placa":"QTX4B12"}
        }
      ],
      "total": 6,
      "temMais": false,
      "resumo": {"quantidade":6,"faturamento":12790,"lucro":6630,"margem":51.84}
    }
  },
  "orcamento": {
    "id": "orc-842",
    "numero": 842,
    "status": "APROVADO",
    "descricao": "## Revisão dos 60.000 km\n- Troca de óleo e filtros (óleo, ar e cabine)\n- Troca das velas de ignição\n- Higienização do ar-condicionado\n- Checagem de freios, suspensão e fluidos",
    "totalPecas": 671,
    "totalMO": 500,
    "desconto": 71,
    "total": 1100,
    "validade": "2026-10-13T18:00:00-03:00",
    "obs": "Peças com garantia de 90 dias.",
    "createdAt": "2026-10-06T10:15:00-03:00",
    "ordemId": null,
    "clienteId": "cli-patricia",
    "cliente": {
      "id": "cli-patricia",
      "nome": "Patrícia Antunes",
      "telefone": "(11) 90000-0011",
      "cpfCnpj": null,
      "email": null,
      "endereco": null,
      "cidade": null,
      "estado": null
    },
    "clienteNome": null,
    "clienteTelefone": null,
    "veiculo": {
      "id": "vei-tcross",
      "marca": "Volkswagen",
      "modelo": "T-Cross Comfortline",
      "placa": "SGE4J72",
      "ano": null,
      "cor": "Branco",
      "motorizacao": "1.0 TSI",
      "anoFabricacao": 2022,
      "anoModelo": 2023,
      "valvulas": "12V",
      "combustivel": "FLEX",
      "km": 59870
    },
    "veiculoDesc": null,
    "ordem": null,
    "itens": [
      {"id":"io-1","tipo":"PECA","descricao":"Óleo 5W-30 sintético (litro)","quantidade":4,"valorUnit":62,"valorTotal":248,"custoUnit":38},
      {"id":"io-2","tipo":"PECA","descricao":"Filtro de óleo","quantidade":1,"valorUnit":48,"valorTotal":48,"custoUnit":26},
      {"id":"io-3","tipo":"PECA","descricao":"Filtro de ar do motor","quantidade":1,"valorUnit":75,"valorTotal":75,"custoUnit":41},
      {"id":"io-4","tipo":"PECA","descricao":"Filtro de ar-condicionado","quantidade":1,"valorUnit":68,"valorTotal":68,"custoUnit":35},
      {"id":"io-5","tipo":"PECA","descricao":"Jogo de velas de ignição","quantidade":1,"valorUnit":232,"valorTotal":232,"custoUnit":144},
      {"id":"io-6","tipo":"MAO_DE_OBRA","descricao":"Revisão de 60.000 km — mão de obra","quantidade":1,"valorUnit":380,"valorTotal":380,"custoUnit":null},
      {"id":"io-7","tipo":"SERVICO","descricao":"Higienização do ar-condicionado","quantidade":1,"valorUnit":120,"valorTotal":120,"custoUnit":null}
    ],
    "fotos": [
      {"id":"fo-1","url":"/video/fotos/tcross-painel.jpg","legenda":"Aviso de revisão aceso no painel","tipo":"ENTRADA","createdAt":"2026-10-06T10:18:00-03:00"}
    ],
    "aposConversao": {"status":"CONVERTIDO","ordemId":"os-1304","ordem":{"id":"os-1304","numero":1304}}
  },
  "osAberta": {
    "id": "os-1298",
    "numero": 1298,
    "status": "EM_ANDAMENTO",
    "descricao": "## Troca do kit de embreagem\n- Substituir platô, disco e rolamento\n- Trocar o atuador hidráulico\n- Sangria do sistema e teste de rodagem",
    "defeitoRelatado": "Embreagem patinando em subida e pedal duro.",
    "kmEntrada": 68420,
    "kmSaida": null,
    "totalPecas": 2270,
    "totalMO": 1000,
    "desconto": 0,
    "total": 3270,
    "pago": false,
    "valorPago": 500,
    "formaPagamento": null,
    "obs": "Cliente pediu para guardar as peças trocadas.",
    "mecanico": "Bruno",
    "nivelCombustivel": "MEIO",
    "combustivelEmUso": null,
    "custoTotalPecas": 1610,
    "lucroReal": 1660,
    "margemPecas": 29.07,
    "abertura": "2026-10-05T08:40:00-03:00",
    "fechamento": null,
    "cliente": {
      "id": "cli-fernanda",
      "nome": "Fernanda Lima Costa",
      "telefone": "(11) 90000-0004",
      "cpfCnpj": "123.456.789-09",
      "email": null,
      "endereco": "Rua dos Pistões, 210",
      "cidade": "São Paulo",
      "estado": "SP"
    },
    "veiculo": {
      "id": "vei-toro",
      "marca": "Fiat",
      "modelo": "Toro Volcano",
      "placa": "RTL1E55",
      "ano": null,
      "cor": "Cinza",
      "motorizacao": "2.0 Turbodiesel",
      "anoFabricacao": 2021,
      "anoModelo": 2022,
      "valvulas": "16V",
      "combustivel": "DIESEL",
      "km": 68420
    },
    "itens": [
      {"id":"it-1","tipo":"PECA","descricao":"Kit embreagem (platô, disco e rolamento)","quantidade":1,"valorUnit":1580,"valorTotal":1580,"custoUnit":1120,"produtoId":"prd-kit-embreagem"},
      {"id":"it-2","tipo":"PECA","descricao":"Atuador hidráulico da embreagem","quantidade":1,"valorUnit":560,"valorTotal":560,"custoUnit":395,"produtoId":null},
      {"id":"it-3","tipo":"PECA","descricao":"Fluido de freio DOT 4 (500 ml)","quantidade":2,"valorUnit":65,"valorTotal":130,"custoUnit":47.5,"produtoId":"prd-dot4"},
      {"id":"it-4","tipo":"MAO_DE_OBRA","descricao":"Troca do conjunto de embreagem","quantidade":1,"valorUnit":850,"valorTotal":850,"custoUnit":null,"produtoId":null},
      {"id":"it-5","tipo":"SERVICO","descricao":"Sangria do sistema hidráulico","quantidade":1,"valorUnit":150,"valorTotal":150,"custoUnit":null,"produtoId":null}
    ],
    "pagamentos": [{"id":"pg-1298-1","valor":500,"formaPagamento":"PIX","data":"2026-10-05T08:55:00-03:00","obs":"Sinal"}],
    "fotos": [
      {"id":"ft-1","url":"/video/fotos/toro-entrada-painel.jpg","legenda":"Painel na entrada — 68.420 km","tipo":"ENTRADA","createdAt":"2026-10-05T08:45:00-03:00"},
      {"id":"ft-2","url":"/video/fotos/toro-entrada-lateral.jpg","legenda":null,"tipo":"ENTRADA","createdAt":"2026-10-05T08:46:00-03:00"},
      {"id":"ft-3","url":"/video/fotos/toro-disco-gasto.jpg","legenda":"Disco de embreagem gasto","tipo":"SERVICO","createdAt":"2026-10-06T15:10:00-03:00"},
      {"id":"ft-4","url":"/video/fotos/toro-kit-novo.jpg","legenda":"Kit novo antes da montagem","tipo":"SERVICO","createdAt":"2026-10-06T15:12:00-03:00"}
    ]
  },
  "contasReceber": {
    "clientes": [
      {
        "id": "cli-eduardo",
        "clienteId": "cli-eduardo",
        "nome": "Eduardo Ramos",
        "apelido": "Dudu",
        "telefone": "(11) 90000-0021",
        "veiculos": [{"marca":"Ford","modelo":"Ranger","placa":"PXA8B03"}],
        "ordens": [
          {"id":"os-1231","numero":1231,"status":"ENTREGUE","desconto":0,"total":3960,"valorPago":1500,"abertura":"2026-08-24T08:30:00-03:00","veiculo":{"marca":"Ford","modelo":"Ranger","placa":"PXA8B03"},"pagamentos":[{"id":"pg-1231-1","valor":1500,"formaPagamento":"CARTAO_CREDITO","obs":null,"data":"2026-08-29T17:05:00-03:00"}]}
        ],
        "dividasAvulsas": [
          {"id":12,"descricao":"Pneu 205/55 R16 comprado para o cliente","valor":520,"valorPago":0,"createdAt":"2026-09-12T11:00:00-03:00","pagamentos":[]}
        ],
        "totalSaldo": 2980,
        "diasEmAberto": 44,
        "faixa": "31-60"
      },
      {
        "id": "cli-carla",
        "clienteId": "cli-carla",
        "nome": "Carla Mendes",
        "apelido": null,
        "telefone": "(11) 90000-0022",
        "veiculos": [{"marca":"Jeep","modelo":"Renegade","placa":"SFP5C61"}],
        "ordens": [
          {
            "id": "os-1252",
            "numero": 1252,
            "status": "ENTREGUE",
            "desconto": 0,
            "total": 2740,
            "valorPago": 1200,
            "abertura": "2026-09-10T08:50:00-03:00",
            "veiculo": {"marca":"Jeep","modelo":"Renegade","placa":"SFP5C61"},
            "pagamentos": [
              {"id":"pg-1252-1","valor":600,"formaPagamento":"DINHEIRO","obs":"Na entrega","data":"2026-09-13T16:45:00-03:00"},
              {"id":"pg-1252-2","valor":600,"formaPagamento":"PIX","obs":null,"data":"2026-09-30T10:20:00-03:00"}
            ]
          }
        ],
        "dividasAvulsas": [],
        "totalSaldo": 1540,
        "diasEmAberto": 27,
        "faixa": "16-30"
      },
      {
        "id": "cli-andre",
        "clienteId": "cli-andre",
        "nome": "André Luiz Pacheco",
        "apelido": "Dedé",
        "telefone": "(11) 90000-0023",
        "veiculos": [{"marca":"Volkswagen","modelo":"Gol","placa":"RJK2A77"}],
        "ordens": [
          {"id":"os-1275","numero":1275,"status":"ENTREGUE","desconto":0,"total":1850,"valorPago":850,"abertura":"2026-09-24T09:20:00-03:00","veiculo":{"marca":"Volkswagen","modelo":"Gol","placa":"RJK2A77"},"pagamentos":[{"id":"pg-1275-1","valor":850,"formaPagamento":"PIX","obs":"Sinal","data":"2026-09-24T09:35:00-03:00"}]}
        ],
        "dividasAvulsas": [],
        "totalSaldo": 1000,
        "diasEmAberto": 13,
        "faixa": "0-15"
      },
      {
        "id": "avulso:seu-tonho",
        "clienteId": null,
        "nome": "Seu Tonho do Opala",
        "apelido": null,
        "telefone": null,
        "veiculos": [],
        "ordens": [],
        "dividasAvulsas": [
          {"id":7,"descricao":"Regulagem de carburador e troca de velas","valor":680,"valorPago":200,"createdAt":"2026-07-24T15:00:00-03:00","pagamentos":[{"id":31,"valor":200,"formaPagamento":"DINHEIRO","obs":null,"data":"2026-08-02T11:30:00-03:00"}]}
        ],
        "totalSaldo": 480,
        "diasEmAberto": 75,
        "faixa": "60+"
      }
    ],
    "resumo": {
      "totalAReceber": 6000,
      "totalDevedores": 4,
      "totalOSPendentes": 3,
      "totalDividasAvulsas": 2,
      "porFaixa": {
        "0-15": {"clientes":1,"valor":1000},
        "16-30": {"clientes":1,"valor":1540},
        "31-60": {"clientes":1,"valor":2980},
        "60+": {"clientes":1,"valor":480}
      }
    },
    "allClientes": [
      {"id":"cli-andre","nome":"André Luiz Pacheco","telefone":"(11) 90000-0023"},
      {"id":"cli-carla","nome":"Carla Mendes","telefone":"(11) 90000-0022"},
      {"id":"cli-eduardo","nome":"Eduardo Ramos","telefone":"(11) 90000-0021"},
      {"id":"cli-fernanda","nome":"Fernanda Lima Costa","telefone":"(11) 90000-0004"},
      {"id":"cli-patricia","nome":"Patrícia Antunes","telefone":"(11) 90000-0011"}
    ]
  },
  "dashboardResultado": {
    "url": "/?aba=resultado&periodo=mes&offset=-1",
    "rotulo": "Setembro/2026",
    "ordens": [
      {"id":"os-1236","numero":1236,"status":"ENTREGUE","total":1690,"valorPago":1690,"custoTotalPecas":666.23,"lucroReal":1023.77,"pago":true,"mecanico":"Alex","abertura":"2026-09-01T08:30:00-03:00","fechamento":"2026-09-01T16:00:00-03:00","cliente":{"id":"cli-yc","nome":"Camila Rezende","apelido":null},"veiculo":{"marca":"Renault","modelo":"Duster","placa":"RFF2E01"}},
      {"id":"os-1237","numero":1237,"status":"ENTREGUE","total":200,"valorPago":200,"custoTotalPecas":8.86,"lucroReal":191.14,"pago":true,"mecanico":"Bruno","abertura":"2026-09-02T08:20:00-03:00","fechamento":"2026-09-03T14:00:00-03:00","cliente":{"id":"cli-yd","nome":"Helena Prates","apelido":null},"veiculo":{"marca":"Ford","modelo":"Ranger","placa":"PBY9T48"}},
      {"id":"os-1238","numero":1238,"status":"ENTREGUE","total":340,"valorPago":340,"custoTotalPecas":48.51,"lucroReal":291.49,"pago":true,"mecanico":"Bruno","abertura":"2026-09-02T10:50:00-03:00","fechamento":"2026-09-04T17:30:00-03:00","cliente":{"id":"cli-ye","nome":"Simone Arantes","apelido":null},"veiculo":{"marca":"Chevrolet","modelo":"Tracker","placa":"PSX9V43"}},
      {"id":"os-1239","numero":1239,"status":"ENTREGUE","total":310,"valorPago":310,"custoTotalPecas":43.46,"lucroReal":266.54,"pago":true,"mecanico":"Alex","abertura":"2026-09-03T08:00:00-03:00","fechamento":"2026-09-05T15:50:00-03:00","cliente":{"id":"cli-yf","nome":"Simone Arantes","apelido":null},"veiculo":{"marca":"Chevrolet","modelo":"Tracker","placa":"SUA8F68"}},
      {"id":"os-1240","numero":1240,"status":"ENTREGUE","total":1600,"valorPago":1600,"custoTotalPecas":749.09,"lucroReal":850.91,"pago":true,"mecanico":"Bruno","abertura":"2026-09-03T08:40:00-03:00","fechamento":"2026-09-05T16:30:00-03:00","cliente":{"id":"cli-yg","nome":"Igor Matos","apelido":null},"veiculo":{"marca":"Jeep","modelo":"Renegade","placa":"QFZ1G41"}},
      {"id":"os-1241","numero":1241,"status":"ENTREGUE","total":550,"valorPago":550,"custoTotalPecas":284.51,"lucroReal":265.49,"pago":true,"mecanico":"Alex","abertura":"2026-09-03T09:30:00-03:00","fechamento":"2026-09-04T18:00:00-03:00","cliente":{"id":"cli-yh","nome":"Igor Matos","apelido":null},"veiculo":{"marca":"Renault","modelo":"Kwid","placa":"SRN3E93"}},
      {"id":"os-1242","numero":1242,"status":"ENTREGUE","total":450,"valorPago":450,"custoTotalPecas":278.61,"lucroReal":171.39,"pago":true,"mecanico":"Diego","abertura":"2026-09-04T10:10:00-03:00","fechamento":"2026-09-04T16:10:00-03:00","cliente":{"id":"cli-yi","nome":"José Carlos Bento","apelido":"Zé Carlos"},"veiculo":{"marca":"Honda","modelo":"HR-V","placa":"RPH8G57"}},
      {"id":"os-1243","numero":1243,"status":"ENTREGUE","total":1590,"valorPago":1590,"custoTotalPecas":680.48,"lucroReal":909.52,"pago":true,"mecanico":"Alex","abertura":"2026-09-05T09:20:00-03:00","fechamento":"2026-09-07T17:30:00-03:00","cliente":{"id":"cli-yj","nome":"Daniel Azevedo","apelido":null},"veiculo":{"marca":"Hyundai","modelo":"HB20","placa":"SZL6C14"}},
      {"id":"os-1244","numero":1244,"status":"ENTREGUE","total":410,"valorPago":410,"custoTotalPecas":211.21,"lucroReal":198.79,"pago":true,"mecanico":"Bruno","abertura":"2026-09-05T10:10:00-03:00","fechamento":"2026-09-07T15:50:00-03:00","cliente":{"id":"cli-yk","nome":"José Carlos Bento","apelido":"Zé Carlos"},"veiculo":{"marca":"Chevrolet","modelo":"Onix","placa":"PEE9X66"}},
      {"id":"os-1245","numero":1245,"status":"ENTREGUE","total":1700,"valorPago":1700,"custoTotalPecas":939.92,"lucroReal":760.08,"pago":true,"mecanico":"Alex","abertura":"2026-09-07T08:00:00-03:00","fechamento":"2026-09-10T16:00:00-03:00","cliente":{"id":"cli-yl","nome":"Daniel Azevedo","apelido":null},"veiculo":{"marca":"Jeep","modelo":"Renegade","placa":"QCT0N45"}},
      {"id":"os-1246","numero":1246,"status":"ENTREGUE","total":1210,"valorPago":1210,"custoTotalPecas":536.91,"lucroReal":673.09,"pago":true,"mecanico":"Alex","abertura":"2026-09-07T09:50:00-03:00","fechamento":"2026-09-09T18:20:00-03:00","cliente":{"id":"cli-ym","nome":"Igor Matos","apelido":null},"veiculo":{"marca":"Chevrolet","modelo":"Tracker","placa":"RME4U58"}},
      {"id":"os-1247","numero":1247,"status":"ENTREGUE","total":400,"valorPago":400,"custoTotalPecas":257.05,"lucroReal":142.95,"pago":true,"mecanico":"Alex","abertura":"2026-09-08T08:50:00-03:00","fechamento":"2026-09-11T14:00:00-03:00","cliente":{"id":"cli-yn","nome":"Gustavo Meireles","apelido":null},"veiculo":{"marca":"Volkswagen","modelo":"Gol","placa":"RWM7Z67"}},
      {"id":"os-1248","numero":1248,"status":"ENTREGUE","total":440,"valorPago":440,"custoTotalPecas":270.79,"lucroReal":169.21,"pago":true,"mecanico":"Diego","abertura":"2026-09-08T09:30:00-03:00","fechamento":"2026-09-09T18:50:00-03:00","cliente":{"id":"cli-yo","nome":"Alexandre Pires","apelido":null},"veiculo":{"marca":"Hyundai","modelo":"HB20","placa":"QJS0E12"}},
      {"id":"os-1249","numero":1249,"status":"ENTREGUE","total":1330,"valorPago":1330,"custoTotalPecas":608.69,"lucroReal":721.31,"pago":true,"mecanico":"Alex","abertura":"2026-09-08T09:40:00-03:00","fechamento":"2026-09-11T14:30:00-03:00","cliente":{"id":"cli-yp","nome":"Elaine Barros","apelido":null},"veiculo":{"marca":"Renault","modelo":"Kwid","placa":"RUB4X74"}},
      {"id":"os-1250","numero":1250,"status":"ENTREGUE","total":290,"valorPago":290,"custoTotalPecas":39.94,"lucroReal":250.06,"pago":true,"mecanico":"Alex","abertura":"2026-09-08T10:40:00-03:00","fechamento":"2026-09-08T14:40:00-03:00","cliente":{"id":"cli-yq","nome":"Larissa Freitas","apelido":null},"veiculo":{"marca":"Ford","modelo":"Ranger","placa":"SRA6L13"}},
      {"id":"os-1251","numero":1251,"status":"ENTREGUE","total":840,"valorPago":840,"custoTotalPecas":423.82,"lucroReal":416.18,"pago":true,"mecanico":"Diego","abertura":"2026-09-09T10:10:00-03:00","fechamento":"2026-09-10T14:20:00-03:00","cliente":{"id":"cli-yr","nome":"Helena Prates","apelido":null},"veiculo":{"marca":"Volkswagen","modelo":"Saveiro","placa":"SDF7S37"}},
      {"id":"os-1252","numero":1252,"status":"ENTREGUE","total":2740,"valorPago":1200,"custoTotalPecas":1290,"lucroReal":1450,"pago":false,"mecanico":"Diego","abertura":"2026-09-10T08:50:00-03:00","fechamento":"2026-09-13T16:40:00-03:00","cliente":{"id":"cli-carla","nome":"Carla Mendes","apelido":null},"veiculo":{"marca":"Jeep","modelo":"Renegade","placa":"SFP5C61"}},
      {"id":"os-1253","numero":1253,"status":"ENTREGUE","total":1520,"valorPago":1520,"custoTotalPecas":636.15,"lucroReal":883.85,"pago":true,"mecanico":"Diego","abertura":"2026-09-11T09:10:00-03:00","fechamento":"2026-09-14T15:50:00-03:00","cliente":{"id":"cli-yt","nome":"Leandro Viana","apelido":null},"veiculo":{"marca":"Nissan","modelo":"Kicks","placa":"RVR3J44"}},
      {"id":"os-1254","numero":1254,"status":"ENTREGUE","total":1140,"valorPago":1140,"custoTotalPecas":584.43,"lucroReal":555.57,"pago":true,"mecanico":"Bruno","abertura":"2026-09-11T09:20:00-03:00","fechamento":"2026-09-12T16:00:00-03:00","cliente":{"id":"cli-yu","nome":"Jéssica Andrade","apelido":null},"veiculo":{"marca":"Fiat","modelo":"Argo","placa":"RRR8F31"}},
      {"id":"os-1255","numero":1255,"status":"ENTREGUE","total":1090,"valorPago":1090,"custoTotalPecas":541.56,"lucroReal":548.44,"pago":true,"mecanico":"Diego","abertura":"2026-09-12T10:10:00-03:00","fechamento":"2026-09-15T14:50:00-03:00","cliente":{"id":"cli-yv","nome":"Adriana Couto","apelido":null},"veiculo":{"marca":"Nissan","modelo":"Kicks","placa":"SCY5P16"}},
      {"id":"os-1256","numero":1256,"status":"ENTREGUE","total":1160,"valorPago":1160,"custoTotalPecas":556.46,"lucroReal":603.54,"pago":true,"mecanico":"Diego","abertura":"2026-09-13T09:00:00-03:00","fechamento":"2026-09-16T18:10:00-03:00","cliente":{"id":"cli-yw","nome":"Mariana Coelho","apelido":null},"veiculo":{"marca":"Hyundai","modelo":"HB20","placa":"PFZ5E39"}},
      {"id":"os-1257","numero":1257,"status":"ENTREGUE","total":610,"valorPago":610,"custoTotalPecas":95.37,"lucroReal":514.63,"pago":true,"mecanico":"Diego","abertura":"2026-09-14T08:00:00-03:00","fechamento":"2026-09-16T15:20:00-03:00","cliente":{"id":"cli-yx","nome":"Mariana Coelho","apelido":null},"veiculo":{"marca":"Toyota","modelo":"Hilux","placa":"PED1D48"}},
      {"id":"os-1258","numero":1258,"status":"ENTREGUE","total":890,"valorPago":890,"custoTotalPecas":496.53,"lucroReal":393.47,"pago":true,"mecanico":"Diego","abertura":"2026-09-14T08:10:00-03:00","fechamento":"2026-09-15T14:00:00-03:00","cliente":{"id":"cli-yy","nome":"Otávio Rangel","apelido":"Tavinho"},"veiculo":{"marca":"Jeep","modelo":"Renegade","placa":"PGN9W85"}},
      {"id":"os-1259","numero":1259,"status":"ENTREGUE","total":1100,"valorPago":1100,"custoTotalPecas":519.75,"lucroReal":580.25,"pago":true,"mecanico":"Diego","abertura":"2026-09-15T08:40:00-03:00","fechamento":"2026-09-17T15:20:00-03:00","cliente":{"id":"cli-yz","nome":"Gustavo Meireles","apelido":null},"veiculo":{"marca":"Ford","modelo":"Ranger","placa":"QYE4C15"}},
      {"id":"os-1260","numero":1260,"status":"ENTREGUE","total":1150,"valorPago":1150,"custoTotalPecas":513.61,"lucroReal":636.39,"pago":true,"mecanico":"Alex","abertura":"2026-09-15T09:40:00-03:00","fechamento":"2026-09-15T17:00:00-03:00","cliente":{"id":"cli-z0","nome":"Mariana Coelho","apelido":null},"veiculo":{"marca":"Renault","modelo":"Kwid","placa":"QWH8B20"}},
      {"id":"os-1261","numero":1261,"status":"ENTREGUE","total":1180,"valorPago":1180,"custoTotalPecas":551.79,"lucroReal":628.21,"pago":true,"mecanico":"Alex","abertura":"2026-09-16T08:10:00-03:00","fechamento":"2026-09-18T18:20:00-03:00","cliente":{"id":"cli-z1","nome":"Jéssica Andrade","apelido":null},"veiculo":{"marca":"Volkswagen","modelo":"Saveiro","placa":"RFD1D79"}},
      {"id":"os-1262","numero":1262,"status":"ENTREGUE","total":460,"valorPago":460,"custoTotalPecas":269.65,"lucroReal":190.35,"pago":true,"mecanico":"Diego","abertura":"2026-09-17T09:00:00-03:00","fechamento":"2026-09-19T16:00:00-03:00","cliente":{"id":"cli-z2","nome":"Leandro Viana","apelido":null},"veiculo":{"marca":"Honda","modelo":"HR-V","placa":"PEG2R11"}},
      {"id":"os-1263","numero":1263,"status":"ENTREGUE","total":2190,"valorPago":2190,"custoTotalPecas":1080.12,"lucroReal":1109.88,"pago":true,"mecanico":"Bruno","abertura":"2026-09-17T10:40:00-03:00","fechamento":"2026-09-17T16:00:00-03:00","cliente":{"id":"cli-z3","nome":"José Carlos Bento","apelido":"Zé Carlos"},"veiculo":{"marca":"Jeep","modelo":"Compass","placa":"PZX2P59"}},
      {"id":"os-1264","numero":1264,"status":"ENTREGUE","total":460,"valorPago":460,"custoTotalPecas":246.72,"lucroReal":213.28,"pago":true,"mecanico":"Alex","abertura":"2026-09-18T08:40:00-03:00","fechamento":"2026-09-18T18:10:00-03:00","cliente":{"id":"cli-z4","nome":"Adriana Couto","apelido":null},"veiculo":{"marca":"Toyota","modelo":"Corolla","placa":"PEP9V71"}},
      {"id":"os-1265","numero":1265,"status":"ENTREGUE","total":1310,"valorPago":1310,"custoTotalPecas":545.34,"lucroReal":764.66,"pago":true,"mecanico":"Bruno","abertura":"2026-09-19T08:10:00-03:00","fechamento":"2026-09-21T15:20:00-03:00","cliente":{"id":"cli-z5","nome":"Leandro Viana","apelido":null},"veiculo":{"marca":"Chevrolet","modelo":"Onix","placa":"SAH6T45"}},
      {"id":"os-1266","numero":1266,"status":"ENTREGUE","total":1680,"valorPago":1680,"custoTotalPecas":654.09,"lucroReal":1025.91,"pago":true,"mecanico":"Diego","abertura":"2026-09-21T08:20:00-03:00","fechamento":"2026-09-24T14:00:00-03:00","cliente":{"id":"cli-z6","nome":"Vanessa Ribas","apelido":null},"veiculo":{"marca":"Chevrolet","modelo":"S10","placa":"RWJ2K56"}},
      {"id":"os-1267","numero":1267,"status":"ENTREGUE","total":2000,"valorPago":2000,"custoTotalPecas":1058.32,"lucroReal":941.68,"pago":true,"mecanico":"Bruno","abertura":"2026-09-21T08:30:00-03:00","fechamento":"2026-09-24T18:20:00-03:00","cliente":{"id":"cli-z7","nome":"Jéssica Andrade","apelido":null},"veiculo":{"marca":"Fiat","modelo":"Strada","placa":"QZT4B98"}},
      {"id":"os-1268","numero":1268,"status":"ENTREGUE","total":1500,"valorPago":1500,"custoTotalPecas":725.79,"lucroReal":774.21,"pago":true,"mecanico":"Bruno","abertura":"2026-09-22T08:10:00-03:00","fechamento":"2026-09-24T18:30:00-03:00","cliente":{"id":"cli-z8","nome":"Alexandre Pires","apelido":null},"veiculo":{"marca":"Volkswagen","modelo":"Polo","placa":"QJJ9S46"}},
      {"id":"os-1269","numero":1269,"status":"ENTREGUE","total":2590,"valorPago":2590,"custoTotalPecas":1328.4,"lucroReal":1261.6,"pago":true,"mecanico":"Bruno","abertura":"2026-09-22T08:50:00-03:00","fechamento":"2026-09-22T15:50:00-03:00","cliente":{"id":"cli-z9","nome":"José Carlos Bento","apelido":"Zé Carlos"},"veiculo":{"marca":"Fiat","modelo":"Argo","placa":"SCX0C78"}},
      {"id":"os-1270","numero":1270,"status":"ENTREGUE","total":380,"valorPago":380,"custoTotalPecas":55.54,"lucroReal":324.46,"pago":true,"mecanico":"Alex","abertura":"2026-09-22T09:20:00-03:00","fechamento":"2026-09-22T15:20:00-03:00","cliente":{"id":"cli-za","nome":"Nelson Furtado","apelido":"Nelsinho"},"veiculo":{"marca":"Jeep","modelo":"Compass","placa":"RUT3H62"}},
      {"id":"os-1271","numero":1271,"status":"ENTREGUE","total":280,"valorPago":280,"custoTotalPecas":38.49,"lucroReal":241.51,"pago":true,"mecanico":"Alex","abertura":"2026-09-22T10:10:00-03:00","fechamento":"2026-09-22T14:20:00-03:00","cliente":{"id":"cli-zb","nome":"Helena Prates","apelido":null},"veiculo":{"marca":"Chevrolet","modelo":"Onix","placa":"SKF5B25"}},
      {"id":"os-1272","numero":1272,"status":"ENTREGUE","total":2880,"valorPago":2880,"custoTotalPecas":1419.3,"lucroReal":1460.7,"pago":true,"mecanico":"Alex","abertura":"2026-09-23T08:10:00-03:00","fechamento":"2026-09-25T14:50:00-03:00","cliente":{"id":"cli-zc","nome":"Nelson Furtado","apelido":"Nelsinho"},"veiculo":{"marca":"Renault","modelo":"Duster","placa":"SUU7J90"}},
      {"id":"os-1273","numero":1273,"status":"ENTREGUE","total":1730,"valorPago":1730,"custoTotalPecas":824.11,"lucroReal":905.89,"pago":true,"mecanico":"Diego","abertura":"2026-09-23T08:10:00-03:00","fechamento":"2026-09-24T16:00:00-03:00","cliente":{"id":"cli-zd","nome":"Helena Prates","apelido":null},"veiculo":{"marca":"Volkswagen","modelo":"Polo","placa":"QCU1J33"}},
      {"id":"os-1274","numero":1274,"status":"ENTREGUE","total":1280,"valorPago":1280,"custoTotalPecas":629.95,"lucroReal":650.05,"pago":true,"mecanico":"Alex","abertura":"2026-09-23T08:20:00-03:00","fechamento":"2026-09-23T15:00:00-03:00","cliente":{"id":"cli-ze","nome":"Gabriela Torres","apelido":null},"veiculo":{"marca":"Jeep","modelo":"Renegade","placa":"PET9T33"}},
      {"id":"os-1275","numero":1275,"status":"ENTREGUE","total":1850,"valorPago":850,"custoTotalPecas":840,"lucroReal":1010,"pago":false,"mecanico":"Diego","abertura":"2026-09-24T09:20:00-03:00","fechamento":"2026-09-26T17:30:00-03:00","cliente":{"id":"cli-andre","nome":"André Luiz Pacheco","apelido":"Dedé"},"veiculo":{"marca":"Volkswagen","modelo":"Gol","placa":"RJK2A77"}},
      {"id":"os-1276","numero":1276,"status":"ENTREGUE","total":2490,"valorPago":2490,"custoTotalPecas":1438.34,"lucroReal":1051.66,"pago":true,"mecanico":"Bruno","abertura":"2026-09-25T09:10:00-03:00","fechamento":"2026-09-25T18:00:00-03:00","cliente":{"id":"cli-zg","nome":"Fábio Nascimento","apelido":null},"veiculo":{"marca":"Toyota","modelo":"Corolla","placa":"PTG6H65"}},
      {"id":"os-1277","numero":1277,"status":"ENTREGUE","total":410,"valorPago":410,"custoTotalPecas":257.78,"lucroReal":152.22,"pago":true,"mecanico":"Alex","abertura":"2026-09-25T10:00:00-03:00","fechamento":"2026-09-25T18:40:00-03:00","cliente":{"id":"cli-zh","nome":"Daniel Azevedo","apelido":null},"veiculo":{"marca":"Nissan","modelo":"Kicks","placa":"RJP6F41"}},
      {"id":"os-1278","numero":1278,"status":"ENTREGUE","total":480,"valorPago":480,"custoTotalPecas":286.6,"lucroReal":193.4,"pago":true,"mecanico":"Diego","abertura":"2026-09-26T09:00:00-03:00","fechamento":"2026-09-26T17:30:00-03:00","cliente":{"id":"cli-zi","nome":"Vanessa Ribas","apelido":null},"veiculo":{"marca":"Nissan","modelo":"Kicks","placa":"RTP0T12"}},
      {"id":"os-1279","numero":1279,"status":"ENTREGUE","total":560,"valorPago":560,"custoTotalPecas":89.32,"lucroReal":470.68,"pago":true,"mecanico":"Diego","abertura":"2026-09-28T08:10:00-03:00","fechamento":"2026-09-28T18:10:00-03:00","cliente":{"id":"cli-zj","nome":"Beatriz Fontes","apelido":null},"veiculo":{"marca":"Fiat","modelo":"Mobi","placa":"RVM9L91"}},
      {"id":"os-1280","numero":1280,"status":"ENTREGUE","total":240,"valorPago":240,"custoTotalPecas":12.5,"lucroReal":227.5,"pago":true,"mecanico":"Bruno","abertura":"2026-09-28T10:10:00-03:00","fechamento":"2026-09-30T16:50:00-03:00","cliente":{"id":"cli-zk","nome":"Helena Prates","apelido":null},"veiculo":{"marca":"Renault","modelo":"Kwid","placa":"PDX5S16"}},
      {"id":"os-1281","numero":1281,"status":"ENTREGUE","total":380,"valorPago":380,"custoTotalPecas":237.93,"lucroReal":142.07,"pago":true,"mecanico":"Diego","abertura":"2026-09-29T08:10:00-03:00","fechamento":"2026-09-30T16:50:00-03:00","cliente":{"id":"cli-zl","nome":"Nelson Furtado","apelido":"Nelsinho"},"veiculo":{"marca":"Nissan","modelo":"Kicks","placa":"RRL3B96"}}
    ],
    "ordensAnterior": [
      {"total":740},
      {"total":240},
      {"total":1220},
      {"total":950},
      {"total":1340},
      {"total":1130},
      {"total":1620},
      {"total":2140},
      {"total":560},
      {"total":530},
      {"total":1500},
      {"total":1150},
      {"total":1680},
      {"total":410},
      {"total":730},
      {"total":1550},
      {"total":950},
      {"total":1240},
      {"total":500},
      {"total":1350},
      {"total":380},
      {"total":520},
      {"total":510},
      {"total":610},
      {"total":920},
      {"total":3030},
      {"total":530},
      {"total":1310},
      {"total":1110},
      {"total":490},
      {"total":460},
      {"total":1270},
      {"total":300},
      {"total":1410},
      {"total":1550},
      {"total":780},
      {"total":1600},
      {"total":1550},
      {"total":1090},
      {"total":450},
      {"total":1490}
    ],
    "recebidoOS": {"_sum":{"valor":49220}},
    "recebidoDivida": {"_sum":{"valor":0}},
    "totalDespesas": 19766.97,
    "resumoCalculado": {
      "osEntregues": 46,
      "faturado": 51080,
      "variacao": "+19% vs. período anterior",
      "ticketMedio": 1110.43,
      "recebido": 49220,
      "custoPecas": 23872.02,
      "lucroBruto": 27207.98,
      "despesasFixas": 19766.97,
      "lucroLiquido": 7441.01,
      "reservaSugerida": 2720.8
    }
  },
  "despesas": {
    "url": "/despesas?mes=2026-09",
    "mes": "2026-09",
    "competencia": "2026-09-01T03:00:00.000Z",
    "rotuloMes": "Setembro/2026",
    "ehMesAtual": false,
    "lancamentos": [
      {
        "id": "d-reg-aluguel",
        "categoriaId": "cat-aluguel",
        "recorrenteId": "reg-aluguel",
        "competencia": "2026-09-01T03:00:00.000Z",
        "descricao": "Aluguel do galpão",
        "valor": 4500,
        "valorPago": 4500,
        "fornecedor": "Locador do imóvel",
        "vencimento": "2026-09-05T03:00:00.000Z",
        "pago": true,
        "pagoEm": "2026-09-05T03:00:00.000Z",
        "formaPagamento": "BOLETO",
        "observacao": null,
        "cancelado": false,
        "parcelamentoId": null,
        "parcela": null,
        "parcelas": null,
        "categoria": {"id":"cat-aluguel","nome":"Aluguel","cor":"#7c3aed"}
      },
      {
        "id": "d-reg-sal-diego",
        "categoriaId": "cat-folha",
        "recorrenteId": "reg-sal-diego",
        "competencia": "2026-09-01T03:00:00.000Z",
        "descricao": "Salário — Diego",
        "valor": 3200,
        "valorPago": 3200,
        "fornecedor": null,
        "vencimento": "2026-09-05T03:00:00.000Z",
        "pago": true,
        "pagoEm": "2026-09-05T03:00:00.000Z",
        "formaPagamento": "PIX",
        "observacao": null,
        "cancelado": false,
        "parcelamentoId": null,
        "parcela": null,
        "parcelas": null,
        "categoria": {"id":"cat-folha","nome":"Salários","cor":"#2563eb"}
      },
      {
        "id": "d-reg-sal-bruno",
        "categoriaId": "cat-folha",
        "recorrenteId": "reg-sal-bruno",
        "competencia": "2026-09-01T03:00:00.000Z",
        "descricao": "Salário — Bruno",
        "valor": 3000,
        "valorPago": 3000,
        "fornecedor": null,
        "vencimento": "2026-09-05T03:00:00.000Z",
        "pago": true,
        "pagoEm": "2026-09-05T03:00:00.000Z",
        "formaPagamento": "PIX",
        "observacao": null,
        "cancelado": false,
        "parcelamentoId": null,
        "parcela": null,
        "parcelas": null,
        "categoria": {"id":"cat-folha","nome":"Salários","cor":"#2563eb"}
      },
      {
        "id": "d-reg-sal-alex",
        "categoriaId": "cat-folha",
        "recorrenteId": "reg-sal-alex",
        "competencia": "2026-09-01T03:00:00.000Z",
        "descricao": "Salário — Alex",
        "valor": 2600,
        "valorPago": 2600,
        "fornecedor": null,
        "vencimento": "2026-09-05T03:00:00.000Z",
        "pago": true,
        "pagoEm": "2026-09-05T03:00:00.000Z",
        "formaPagamento": "PIX",
        "observacao": null,
        "cancelado": false,
        "parcelamentoId": null,
        "parcela": null,
        "parcelas": null,
        "categoria": {"id":"cat-folha","nome":"Salários","cor":"#2563eb"}
      },
      {
        "id": "d-reg-contador",
        "categoriaId": "cat-servicos",
        "recorrenteId": "reg-contador",
        "competencia": "2026-09-01T03:00:00.000Z",
        "descricao": "Honorários do contador",
        "valor": 650,
        "valorPago": null,
        "fornecedor": "Escritório de contabilidade",
        "vencimento": "2026-09-10T03:00:00.000Z",
        "pago": false,
        "pagoEm": null,
        "formaPagamento": null,
        "observacao": null,
        "cancelado": false,
        "parcelamentoId": null,
        "parcela": null,
        "parcelas": null,
        "categoria": {"id":"cat-servicos","nome":"Contador e serviços","cor":"#ea580c"}
      },
      {
        "id": "d-reg-energia",
        "categoriaId": "cat-contas",
        "recorrenteId": "reg-energia",
        "competencia": "2026-09-01T03:00:00.000Z",
        "descricao": "Energia elétrica",
        "valor": 980,
        "valorPago": 1043.27,
        "fornecedor": "Distribuidora de energia",
        "vencimento": "2026-09-12T03:00:00.000Z",
        "pago": true,
        "pagoEm": "2026-09-12T03:00:00.000Z",
        "formaPagamento": "DEBITO_AUTOMATICO",
        "observacao": null,
        "cancelado": false,
        "parcelamentoId": null,
        "parcela": null,
        "parcelas": null,
        "categoria": {"id":"cat-contas","nome":"Água, luz e internet","cor":"#0d9488"}
      },
      {
        "id": "d-reg-agua",
        "categoriaId": "cat-contas",
        "recorrenteId": "reg-agua",
        "competencia": "2026-09-01T03:00:00.000Z",
        "descricao": "Água e esgoto",
        "valor": 210,
        "valorPago": 196.4,
        "fornecedor": "Companhia de saneamento",
        "vencimento": "2026-09-15T03:00:00.000Z",
        "pago": true,
        "pagoEm": "2026-09-15T03:00:00.000Z",
        "formaPagamento": "BOLETO",
        "observacao": null,
        "cancelado": false,
        "parcelamentoId": null,
        "parcela": null,
        "parcelas": null,
        "categoria": {"id":"cat-contas","nome":"Água, luz e internet","cor":"#0d9488"}
      },
      {
        "id": "d-reg-das",
        "categoriaId": "cat-impostos",
        "recorrenteId": "reg-das",
        "competencia": "2026-09-01T03:00:00.000Z",
        "descricao": "DAS — Simples Nacional",
        "valor": 1380,
        "valorPago": 1380,
        "fornecedor": null,
        "vencimento": "2026-09-20T03:00:00.000Z",
        "pago": true,
        "pagoEm": "2026-09-19T03:00:00.000Z",
        "formaPagamento": "PIX",
        "observacao": null,
        "cancelado": false,
        "parcelamentoId": null,
        "parcela": null,
        "parcelas": null,
        "categoria": {"id":"cat-impostos","nome":"Impostos","cor":"#dc2626"}
      },
      {
        "id": "d-reg-internet",
        "categoriaId": "cat-contas",
        "recorrenteId": "reg-internet",
        "competencia": "2026-09-01T03:00:00.000Z",
        "descricao": "Internet fibra",
        "valor": 149.9,
        "valorPago": 149.9,
        "fornecedor": "Provedor de internet",
        "vencimento": "2026-09-20T03:00:00.000Z",
        "pago": true,
        "pagoEm": "2026-09-20T03:00:00.000Z",
        "formaPagamento": "DEBITO_AUTOMATICO",
        "observacao": null,
        "cancelado": false,
        "parcelamentoId": null,
        "parcela": null,
        "parcelas": null,
        "categoria": {"id":"cat-contas","nome":"Água, luz e internet","cor":"#0d9488"}
      },
      {
        "id": "d-limpeza",
        "categoriaId": "cat-insumos",
        "recorrenteId": null,
        "competencia": "2026-09-01T03:00:00.000Z",
        "descricao": "Estopa, desengraxante e material de limpeza",
        "valor": 137.5,
        "valorPago": 137.5,
        "fornecedor": null,
        "vencimento": "2026-09-03T03:00:00.000Z",
        "pago": true,
        "pagoEm": "2026-09-03T03:00:00.000Z",
        "formaPagamento": "DINHEIRO",
        "observacao": null,
        "cancelado": false,
        "parcelamentoId": null,
        "parcela": null,
        "parcelas": null,
        "categoria": {"id":"cat-insumos","nome":"Insumos da oficina","cor":"#ca8a04"}
      },
      {
        "id": "d-soquetes",
        "categoriaId": "cat-ferramentas",
        "recorrenteId": null,
        "competencia": "2026-09-01T03:00:00.000Z",
        "descricao": "Jogo de soquetes 1/2\" com 32 peças",
        "valor": 689.9,
        "valorPago": 689.9,
        "fornecedor": "Loja de ferramentas",
        "vencimento": "2026-09-08T03:00:00.000Z",
        "pago": true,
        "pagoEm": "2026-09-08T03:00:00.000Z",
        "formaPagamento": "CARTAO_CREDITO",
        "observacao": null,
        "cancelado": false,
        "parcelamentoId": null,
        "parcela": null,
        "parcelas": null,
        "categoria": {"id":"cat-ferramentas","nome":"Ferramentas e equipamentos","cor":"#16a34a"}
      },
      {
        "id": "d-oleo-2",
        "categoriaId": "cat-insumos",
        "recorrenteId": null,
        "competencia": "2026-09-01T03:00:00.000Z",
        "descricao": "Óleo lubrificante a granel (tambor 200 L)",
        "valor": 1150,
        "valorPago": 1150,
        "fornecedor": "Distribuidora de lubrificantes",
        "vencimento": "2026-09-18T03:00:00.000Z",
        "pago": true,
        "pagoEm": "2026-09-18T03:00:00.000Z",
        "formaPagamento": "BOLETO",
        "observacao": null,
        "cancelado": false,
        "parcelamentoId": "parc-oleo-200l",
        "parcela": 2,
        "parcelas": 3,
        "categoria": {"id":"cat-insumos","nome":"Insumos da oficina","cor":"#ca8a04"}
      },
      {
        "id": "d-elevador",
        "categoriaId": "cat-ferramentas",
        "recorrenteId": null,
        "competencia": "2026-09-01T03:00:00.000Z",
        "descricao": "Manutenção do elevador automotivo",
        "valor": 850,
        "valorPago": 850,
        "fornecedor": "Assistência técnica",
        "vencimento": "2026-09-22T03:00:00.000Z",
        "pago": true,
        "pagoEm": "2026-09-22T03:00:00.000Z",
        "formaPagamento": "PIX",
        "observacao": null,
        "cancelado": false,
        "parcelamentoId": null,
        "parcela": null,
        "parcelas": null,
        "categoria": {"id":"cat-ferramentas","nome":"Ferramentas e equipamentos","cor":"#16a34a"}
      },
      {
        "id": "d-panfletos",
        "categoriaId": "cat-outros",
        "recorrenteId": null,
        "competencia": "2026-09-01T03:00:00.000Z",
        "descricao": "Panfletos e adesivos para a vitrine",
        "valor": 220,
        "valorPago": 220,
        "fornecedor": "Gráfica",
        "vencimento": "2026-09-26T03:00:00.000Z",
        "pago": true,
        "pagoEm": "2026-09-26T03:00:00.000Z",
        "formaPagamento": "PIX",
        "observacao": null,
        "cancelado": false,
        "parcelamentoId": null,
        "parcela": null,
        "parcelas": null,
        "categoria": {"id":"cat-outros","nome":"Outros","cor":"#71717a"}
      }
    ],
    "cancelados": [],
    "categorias": [
      {"id":"cat-aluguel","nome":"Aluguel","cor":"#7c3aed","ordem":1,"ativa":true},
      {"id":"cat-folha","nome":"Salários","cor":"#2563eb","ordem":2,"ativa":true},
      {"id":"cat-contas","nome":"Água, luz e internet","cor":"#0d9488","ordem":3,"ativa":true},
      {"id":"cat-impostos","nome":"Impostos","cor":"#dc2626","ordem":4,"ativa":true},
      {"id":"cat-servicos","nome":"Contador e serviços","cor":"#ea580c","ordem":5,"ativa":true},
      {"id":"cat-ferramentas","nome":"Ferramentas e equipamentos","cor":"#16a34a","ordem":6,"ativa":true},
      {"id":"cat-insumos","nome":"Insumos da oficina","cor":"#ca8a04","ordem":7,"ativa":true},
      {"id":"cat-outros","nome":"Outros","cor":"#71717a","ordem":8,"ativa":true}
    ],
    "regras": [
      {"id":"reg-aluguel","categoriaId":"cat-aluguel","descricao":"Aluguel do galpão","valor":4500,"fornecedor":"Locador do imóvel","diaVencimento":5,"periodicidade":"MENSAL","inicio":"2025-01-01T03:00:00.000Z","fim":null,"ativa":true,"observacao":null,"categoria":{"id":"cat-aluguel","nome":"Aluguel","cor":"#7c3aed"}},
      {"id":"reg-sal-diego","categoriaId":"cat-folha","descricao":"Salário — Diego","valor":3200,"fornecedor":null,"diaVencimento":5,"periodicidade":"MENSAL","inicio":"2025-01-01T03:00:00.000Z","fim":null,"ativa":true,"observacao":null,"categoria":{"id":"cat-folha","nome":"Salários","cor":"#2563eb"}},
      {"id":"reg-sal-bruno","categoriaId":"cat-folha","descricao":"Salário — Bruno","valor":3000,"fornecedor":null,"diaVencimento":5,"periodicidade":"MENSAL","inicio":"2025-01-01T03:00:00.000Z","fim":null,"ativa":true,"observacao":null,"categoria":{"id":"cat-folha","nome":"Salários","cor":"#2563eb"}},
      {"id":"reg-sal-alex","categoriaId":"cat-folha","descricao":"Salário — Alex","valor":2600,"fornecedor":null,"diaVencimento":5,"periodicidade":"MENSAL","inicio":"2025-01-01T03:00:00.000Z","fim":null,"ativa":true,"observacao":null,"categoria":{"id":"cat-folha","nome":"Salários","cor":"#2563eb"}},
      {"id":"reg-energia","categoriaId":"cat-contas","descricao":"Energia elétrica","valor":980,"fornecedor":"Distribuidora de energia","diaVencimento":12,"periodicidade":"MENSAL","inicio":"2025-01-01T03:00:00.000Z","fim":null,"ativa":true,"observacao":null,"categoria":{"id":"cat-contas","nome":"Água, luz e internet","cor":"#0d9488"}},
      {"id":"reg-agua","categoriaId":"cat-contas","descricao":"Água e esgoto","valor":210,"fornecedor":"Companhia de saneamento","diaVencimento":15,"periodicidade":"MENSAL","inicio":"2025-01-01T03:00:00.000Z","fim":null,"ativa":true,"observacao":null,"categoria":{"id":"cat-contas","nome":"Água, luz e internet","cor":"#0d9488"}},
      {"id":"reg-internet","categoriaId":"cat-contas","descricao":"Internet fibra","valor":149.9,"fornecedor":"Provedor de internet","diaVencimento":20,"periodicidade":"MENSAL","inicio":"2025-01-01T03:00:00.000Z","fim":null,"ativa":true,"observacao":null,"categoria":{"id":"cat-contas","nome":"Água, luz e internet","cor":"#0d9488"}},
      {"id":"reg-contador","categoriaId":"cat-servicos","descricao":"Honorários do contador","valor":650,"fornecedor":"Escritório de contabilidade","diaVencimento":10,"periodicidade":"MENSAL","inicio":"2025-01-01T03:00:00.000Z","fim":null,"ativa":true,"observacao":null,"categoria":{"id":"cat-servicos","nome":"Contador e serviços","cor":"#ea580c"}},
      {"id":"reg-das","categoriaId":"cat-impostos","descricao":"DAS — Simples Nacional","valor":1380,"fornecedor":null,"diaVencimento":20,"periodicidade":"MENSAL","inicio":"2025-01-01T03:00:00.000Z","fim":null,"ativa":true,"observacao":null,"categoria":{"id":"cat-impostos","nome":"Impostos","cor":"#dc2626"}},
      {"id":"reg-seguro","categoriaId":"cat-outros","descricao":"Seguro do imóvel","valor":2400,"fornecedor":"Seguradora","diaVencimento":15,"periodicidade":"ANUAL","inicio":"2026-03-01T03:00:00.000Z","fim":null,"ativa":true,"observacao":null,"categoria":{"id":"cat-outros","nome":"Outros","cor":"#71717a"}}
    ],
    "equilibrio": {
      "custoDoMes": 19766.97,
      "faturado": 51080,
      "lucroBruto": 27207.98,
      "resultado": 7441.01,
      "margem": 0.515,
      "necessario": 38382.47,
      "falta": 0,
      "osNoMes": 46,
      "osNaMargem": 130
    },
    "resumoCalculado": {
      "gastosDoMes": 19766.97,
      "lancamentos": 14,
      "jaPago": 19116.97,
      "emAberto": 650,
      "vencidas": {"valor":650,"contas":1},
      "gastosFixos": 16719.57,
      "gastosVariaveis": 3047.4,
      "custoOperacionalMensal": 16869.9
    }
  }
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
