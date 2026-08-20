-- Reparo de dados: `fechamento` sobrescrito pela data de edição.
--
-- Até este deploy, o PUT de /api/os/[id] regravava `fechamento = now()` a cada
-- edição de uma OS já entregue, em vez de carimbar só na transição. Resultado:
-- 25 OS carregam como "data de entrega" o instante de uma edição em lote, e o
-- dashboard as jogava todas no período atual (o filtro "Hoje" somava R$ 45 mil
-- de serviço entregue em julho).
--
-- A data real da entrega dessas OS não é recuperável — só a `abertura` sobreviveu
-- íntegra. Como a entrega acontece poucos dias depois da abertura, `abertura` é a
-- melhor aproximação disponível e mantém cada OS no mês em que foi trabalhada.
--
-- Só toca no que é comprovadamente artefato: `fechamento` colado no `updatedAt`
-- (janela de 5 min) e em dia diferente da abertura. Entrega registrada no mesmo
-- dia da abertura fica como está. Rodar de novo não altera mais nada, porque a
-- condição de dia diferente deixa de valer.
--
-- Brasília é UTC-3, então o corte de dia desconta 3h antes de truncar.
UPDATE "OrdemServico"
SET "fechamento" = "abertura"
WHERE "status" IN ('ENTREGUE', 'FECHADA')
  AND "fechamento" IS NOT NULL
  AND ABS(EXTRACT(EPOCH FROM ("fechamento" - "updatedAt"))) < 300
  AND date_trunc('day', "fechamento" - interval '3 hours')
      <> date_trunc('day', "abertura" - interval '3 hours');
