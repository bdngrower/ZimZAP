-- Fix: Habilitar Realtime na tabela messages para o chat atualizar sozinho
-- Sem isso, o Supabase não envia eventos de INSERT para o frontend

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
