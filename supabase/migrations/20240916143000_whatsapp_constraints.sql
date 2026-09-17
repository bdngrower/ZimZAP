-- Fase C: Constraints de Idempotência e Concorrência para Embedded Signup

-- 1. Prevenir que um mesmo número de WhatsApp seja conectado duas vezes
-- Isso evita sequestro de conta e garante que, se o usuário clicar no popup 2 vezes, atualizemos a mesma conta em vez de criar uma duplicata.
ALTER TABLE public.whatsapp_accounts ADD CONSTRAINT unique_phone_number_id UNIQUE (phone_number_id);

-- O WABA (WhatsApp Business Account) também poderia ter UNIQUE, porém em empresas grandes é perfeitamente legal ter Múltiplos Números na mesma WABA, 
-- divididos em múltiplas conexões/organizações (ex: Matriz conecta Número 1 da WABA X, Filial conecta Número 2 da WABA X).
-- Portanto, o Phone Number ID é o ativo que deve ser estritamente único.
