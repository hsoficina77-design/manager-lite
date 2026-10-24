-- Tempo de entrega medido, não digitado.
--
-- A faixa que a loja digitava ("de 20 a 40 min") sai: toda loja passa a mostrar a faixa
-- padrão até ter entregas suficientes e, daí em diante, o tempo real dela — do pedido
-- até as peças chegarem na oficina. O tempo fica gravado na loja e é recalculado a cada
-- entrega (lib/balcao.ts, medirEntregasDaLoja).
ALTER TABLE "Loja" DROP COLUMN "entregaMin",
DROP COLUMN "entregaMax",
ADD COLUMN "entregaMedia" INTEGER,
ADD COLUMN "entregasMedidas" INTEGER NOT NULL DEFAULT 0;

-- A medição começa agora, sem aproveitar as entregas antigas: as que já estavam
-- entregues antes da confirmação da oficina ganharam um "recebido" com a hora daquela
-- migração, e entrariam na conta com dias de entrega.
ALTER TABLE "CotacaoLoja" ADD COLUMN "entregueEm" TIMESTAMP(3);
