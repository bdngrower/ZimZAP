-- 1. Adicionar suporte a transbordo humano (pausa do bot) na tabela contacts
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS bot_paused BOOLEAN DEFAULT false;

-- 2. Criar tabela para Respostas Rápidas (Snippets / Atalhos)
CREATE TABLE IF NOT EXISTS public.quick_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    shortcut TEXT NOT NULL, -- Ex: "/bomdia"
    content TEXT NOT NULL,  -- Ex: "Bom dia! Como podemos ajudar hoje?"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, shortcut) -- Impede atalhos duplicados na mesma organização
);

-- Habilitar RLS e criar políticas para quick_replies
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read own organization quick replies" ON public.quick_replies;
CREATE POLICY "Members can read own organization quick replies" ON public.quick_replies
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Members can insert own organization quick replies" ON public.quick_replies;
CREATE POLICY "Members can insert own organization quick replies" ON public.quick_replies
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Members can update own organization quick replies" ON public.quick_replies;
CREATE POLICY "Members can update own organization quick replies" ON public.quick_replies
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Members can delete own organization quick replies" ON public.quick_replies;
CREATE POLICY "Members can delete own organization quick replies" ON public.quick_replies
    FOR DELETE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

-- 3. Criar tabela base para Integrações (Google Calendar, Office 365, etc)
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'google_calendar', 'office_365'
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    config JSONB DEFAULT '{}'::jsonb, -- Configurações extras (ex: calendar_id ativo)
    status TEXT DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, provider) -- Apenas uma integração por provedor por organização
);

-- Habilitar RLS e criar políticas para integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read own organization integrations" ON public.integrations;
CREATE POLICY "Members can read own organization integrations" ON public.integrations
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Members can insert own organization integrations" ON public.integrations;
CREATE POLICY "Members can insert own organization integrations" ON public.integrations
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Members can update own organization integrations" ON public.integrations;
CREATE POLICY "Members can update own organization integrations" ON public.integrations
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Members can delete own organization integrations" ON public.integrations;
CREATE POLICY "Members can delete own organization integrations" ON public.integrations
    FOR DELETE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));
