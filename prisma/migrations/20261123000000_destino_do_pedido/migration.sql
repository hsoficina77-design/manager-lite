-- Destino do pedido (oficina, CNPJ, endereço, quem recebe), gravado quando a oficina fecha
-- o pedido. Só coluna nova em tabela que já tem RLS (CotacaoLoja): a política e os gatilhos
-- dela valem para a coluna nova.
ALTER TABLE "CotacaoLoja" ADD COLUMN "destino" JSONB;
