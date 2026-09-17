-- MÓDULO 1: Consolidação Multi-Tenant e Esquema

-- 1. Tabela Contacts: Remover UNIQUE global de phone e criar UNIQUE (organization_id, phone)
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_phone_key;
ALTER TABLE public.contacts ADD CONSTRAINT contacts_organization_phone_key UNIQUE (organization_id, phone);

-- 2. Atualizações no Esquema para Automações Avançadas e Chat (React Flow)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS current_flow_id UUID REFERENCES public.automations(id) ON DELETE SET NULL;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS current_flow_step INTEGER DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS current_node_id TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS bot_paused BOOLEAN DEFAULT false;

ALTER TABLE public.automations ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT false;
ALTER TABLE public.automations ADD COLUMN IF NOT EXISTS flow_data JSONB DEFAULT '{}'::jsonb;

-- 3. Criar tabela para Respostas Rápidas (Snippets / Atalhos)
CREATE TABLE IF NOT EXISTS public.quick_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    shortcut TEXT NOT NULL, 
    content TEXT NOT NULL,  
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, shortcut)
);
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;

-- 4. Criar tabela base para Integrações (Google Calendar, Office 365, etc)
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, 
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    config JSONB DEFAULT '{}'::jsonb, 
    status TEXT DEFAULT 'disconnected', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, provider)
);
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- 5. Criar tabela scheduled_messages
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, sent, failed
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

-- 6. Limpar e Consolidar RLS (Remover vulnerabilidades e service_role_policies)
-- Removemos as policies inseguras antigas e evitamos USING(true)
DO $$
DECLARE
  pol_record RECORD;
BEGIN
  FOR pol_record IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('contacts', 'messages', 'funnels', 'automations', 'whatsapp_accounts', 'quick_replies', 'integrations', 'scheduled_messages', 'organization_members', 'organizations')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_record.policyname, pol_record.tablename);
  END LOOP;
END
$$;

-- 7. RE-CRIAR TODAS AS POLICIES CORRETAMENTE (Tenant Isolation)
CREATE POLICY "Users can access their own organizations" ON public.organizations
    FOR ALL USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.organizations.id AND user_id = auth.uid()));

CREATE POLICY "Users can access their own memberships" ON public.organization_members
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Tenant isolation for contacts" ON public.contacts
    FOR ALL USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.contacts.organization_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.contacts.organization_id AND user_id = auth.uid()));

CREATE POLICY "Tenant isolation for messages" ON public.messages
    FOR ALL USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.messages.organization_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.messages.organization_id AND user_id = auth.uid()));

CREATE POLICY "Tenant isolation for funnels" ON public.funnels
    FOR ALL USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.funnels.organization_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.funnels.organization_id AND user_id = auth.uid()));

CREATE POLICY "Tenant isolation for automations" ON public.automations
    FOR ALL USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.automations.organization_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.automations.organization_id AND user_id = auth.uid()));

CREATE POLICY "Tenant isolation for whatsapp_accounts" ON public.whatsapp_accounts
    FOR ALL USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.whatsapp_accounts.organization_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.whatsapp_accounts.organization_id AND user_id = auth.uid()));

CREATE POLICY "Tenant isolation for quick_replies" ON public.quick_replies
    FOR ALL USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.quick_replies.organization_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.quick_replies.organization_id AND user_id = auth.uid()));

CREATE POLICY "Tenant isolation for integrations" ON public.integrations
    FOR ALL USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.integrations.organization_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.integrations.organization_id AND user_id = auth.uid()));

CREATE POLICY "Tenant isolation for scheduled_messages" ON public.scheduled_messages
    FOR ALL USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.scheduled_messages.organization_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.scheduled_messages.organization_id AND user_id = auth.uid()));

-- 8. Habilitar Realtime na tabela messages (para o chat)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime FOR TABLE public.messages;
    ELSE
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
EXCEPTION WHEN duplicate_object THEN
    -- já está na publication
END $$;
