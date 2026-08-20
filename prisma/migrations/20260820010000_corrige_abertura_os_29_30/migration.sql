-- Correção pontual de data: OS #29 e #30 foram cadastradas com a data errada.
--
-- As duas foram criadas durante a organização inicial do sistema e ficaram com
-- `abertura` em 13/08, mas o serviço é desta semana. Como OS ainda no pátio é
-- atribuída ao período da abertura, elas apareciam em "Mês" e ficavam fora de
-- "Semana".
--
-- Desloca 4 dias (13/08 -> 17/08, segunda desta semana) preservando o horário,
-- então a ordem entre as duas e a hora de entrada continuam as mesmas.
--
-- Só age sobre OS ainda no pátio e com a data exata que se quer corrigir, então
-- rodar de novo — ou rodar num banco onde a data já esteja certa — não faz nada.
-- Brasília é UTC-3: o corte de dia desconta 3h antes de truncar.
UPDATE "OrdemServico"
SET "abertura" = "abertura" + interval '4 days'
WHERE "numero" IN (29, 30)
  AND "status" NOT IN ('ENTREGUE', 'FECHADA', 'CANCELADA')
  AND date_trunc('day', "abertura" - interval '3 hours') = DATE '2026-08-13';
