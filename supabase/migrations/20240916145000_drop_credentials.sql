-- Fase C.2: Adoção do MODELO B (System User Master)

-- 1. Removemos a tabela de credenciais efêmeras, pois usaremos o System User Token
DROP TABLE IF EXISTS public.whatsapp_credentials;

-- 2. Adicionamos campos para controle da transação de Tech Provider
ALTER TABLE public.whatsapp_accounts
ADD COLUMN system_user_assigned BOOLEAN DEFAULT false,
ADD COLUMN registration_status TEXT DEFAULT 'PENDING';
