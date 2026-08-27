-- Aposenta os status `PRONTA` e `FECHADA` da OS.
--
-- As duas tentavam codificar "terminei o serviço mas ainda não recebi" num campo que não
-- é sobre dinheiro. Recebimento sempre foi um eixo separado (`pago` / `valorPago`), então
-- OS entregue e não paga já era representável sem precisar de status próprio.
--
-- Com elas fora, `ENTREGUE` vira o único marco de conclusão — e é a data dele
-- (`fechamento`) que decide em que semana/mês a OS conta como produção no dashboard.
--
-- FECHADA já era tratada como concluída pelo código, então vira ENTREGUE e preserva o
-- `fechamento` que tiver. PRONTA era serviço terminado com o carro ainda no pátio: volta
-- para EM_ANDAMENTO e perde o `fechamento`, porque entrega não houve.
--
-- No uso real não existe nenhuma linha nesses dois status — isto é rede de segurança
-- para qualquer registro que tenha escapado. Rodar de novo não altera mais nada.
UPDATE "OrdemServico" SET "status" = 'ENTREGUE' WHERE "status" = 'FECHADA';

UPDATE "OrdemServico"
SET "status" = 'EM_ANDAMENTO', "fechamento" = NULL
WHERE "status" = 'PRONTA';
