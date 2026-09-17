-- Fase C.3: Metadados do System User

ALTER TABLE public.whatsapp_accounts
DROP COLUMN IF EXISTS system_user_assigned;

ALTER TABLE public.whatsapp_accounts
ADD COLUMN system_user_id TEXT,
ADD COLUMN system_user_verified_at TIMESTAMPTZ,
ADD COLUMN system_user_access_status TEXT DEFAULT 'PENDING';
