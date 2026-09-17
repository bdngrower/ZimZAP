-- Script de Migração para Multi-Tenant e Automações Dinâmicas

-- 1. Limpar dados de teste (já que não possuem user_id e a nova política exigirá isso)
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.contacts CASCADE;
TRUNCATE TABLE public.funnels CASCADE;

-- 2. Adicionar coluna user_id atrelada ao Auth do Supabase
ALTER TABLE public.contacts ADD COLUMN user_id UUID REFERENCES auth.users(id) NOT NULL;
ALTER TABLE public.messages ADD COLUMN user_id UUID REFERENCES auth.users(id) NOT NULL;
ALTER TABLE public.funnels ADD COLUMN user_id UUID REFERENCES auth.users(id) NOT NULL;

-- 3. Atualizar as políticas de Segurança RLS (Multi-Tenant)
DROP POLICY IF EXISTS "Allow all operations for now on contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow all operations for now on messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all operations for now on funnels" ON public.funnels;

CREATE POLICY "Users can only access their own contacts" ON public.contacts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own messages" ON public.messages
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own funnels" ON public.funnels
    FOR ALL USING (auth.uid() = user_id);

-- 4. Criar tabela de Automações (Fase 9)
CREATE TABLE public.automations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT false,
    trigger_type TEXT DEFAULT 'status_change',
    trigger_value TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Criar tabela de Nós da Automação (Passos do Fluxo)
CREATE TABLE public.automation_nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    node_type TEXT NOT NULL, -- 'message', 'delay', 'audio'
    content TEXT, -- The text message or audio URL
    delay_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Segurança para Automações
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own automations" ON public.automations
    FOR ALL USING (auth.uid() = user_id);

-- Para os nós (automation_nodes), a política verifica o user_id da automação pai
CREATE POLICY "Users can only access nodes of their own automations" ON public.automation_nodes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.automations a
            WHERE a.id = automation_nodes.automation_id
            AND a.user_id = auth.uid()
        )
    );
