-- Fase B: Camada de Conexão WhatsApp Multiempresa

-- 1. Tabela whatsapp_accounts (Representa a conexão do Tenant com a Meta)
CREATE TABLE public.whatsapp_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    waba_id TEXT, -- WhatsApp Business Account ID (pode ser nulo até a finalização do Embedded Signup)
    phone_number_id TEXT,
    display_phone_number TEXT,
    display_name TEXT,
    connection_status TEXT DEFAULT 'PENDING' CHECK (connection_status IN ('PENDING', 'CONNECTED', 'DISCONNECTED', 'ERROR')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para performance
CREATE INDEX idx_whatsapp_accounts_org_id ON public.whatsapp_accounts(organization_id);

-- 2. Tabela whatsapp_credentials (Armazenamento ultra-seguro de tokens)
-- Esta tabela não possui permissão de leitura para o Frontend (Sem RLS de select para usuários normais)
CREATE TABLE public.whatsapp_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    whatsapp_account_id UUID REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE NOT NULL UNIQUE,
    encrypted_system_user_token TEXT, -- Token permanente criptografado (Fase futura)
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_whatsapp_credentials_account_id ON public.whatsapp_credentials(whatsapp_account_id);


-- 3. RLS - Row Level Security

-- Habilitar RLS
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_credentials ENABLE ROW LEVEL SECURITY;

-- As contas (informações públicas como número e status) podem ser vistas e gerenciadas por membros da organização
CREATE POLICY "Tenant isolation for whatsapp_accounts" ON public.whatsapp_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id = public.whatsapp_accounts.organization_id 
            AND user_id = auth.uid()
        )
    );

-- As credenciais (tokens) NUNCA podem ser lidas pelos clientes via API/Frontend, apenas via service_role ou funções SECURITY DEFINER no backend.
-- Apenas o Backend Vercel com service_role_key terá acesso a esta tabela por padrão, pois não criaremos nenhuma Policy `FOR ALL` atrelada ao `auth.uid()`.
-- Isso garante que nenhuma falha no Frontend exponha chaves da Meta.

-- Opcionalmente, podemos permitir que os usuários insiram ou deletem credenciais através das integrações (ex: ao deletar a conta, apaga a credencial).
-- Porém o DELETE via CASCADE resolverá isso a partir de whatsapp_accounts. Portanto, whatsapp_credentials ficará SEM NENHUMA policy de select para o role "authenticated".
