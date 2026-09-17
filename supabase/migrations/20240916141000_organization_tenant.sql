-- Fase A: Fundação Multiempresa (Multi-Tenant B2B)

-- 1. Criação das tabelas base de Organização
CREATE TABLE public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    plan TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.organization_members (
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'agent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (organization_id, user_id)
);

-- Índices para performance no RLS
CREATE INDEX idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org_id ON public.organization_members(organization_id);

-- 2. Adicionar organization_id como NULLABLE nas tabelas de dados
ALTER TABLE public.contacts ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.funnels ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.automations ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Criar índices nas FKs
CREATE INDEX idx_contacts_org_id ON public.contacts(organization_id);
CREATE INDEX idx_messages_org_id ON public.messages(organization_id);
CREATE INDEX idx_funnels_org_id ON public.funnels(organization_id);
CREATE INDEX idx_automations_org_id ON public.automations(organization_id);

-- 3. Script de Backfill (Migração Segura e Reversível dos Dados Atuais)
DO $$
DECLARE
    r RECORD;
    new_org_id UUID;
BEGIN
    -- Itera sobre cada usuário único que possui registros em contacts, messages, funnels ou automations
    FOR r IN (
        SELECT DISTINCT user_id FROM public.contacts
        UNION SELECT DISTINCT user_id FROM public.messages
        UNION SELECT DISTINCT user_id FROM public.funnels
        UNION SELECT DISTINCT user_id FROM public.automations
    )
    LOOP
        -- Cria uma organização para este usuário
        INSERT INTO public.organizations (name) 
        VALUES ('Organização de ' || r.user_id::text)
        RETURNING id INTO new_org_id;

        -- Adiciona o usuário como owner
        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (new_org_id, r.user_id, 'owner');

        -- Associa os dados antigos à nova organização
        UPDATE public.contacts SET organization_id = new_org_id WHERE user_id = r.user_id;
        UPDATE public.messages SET organization_id = new_org_id WHERE user_id = r.user_id;
        UPDATE public.funnels SET organization_id = new_org_id WHERE user_id = r.user_id;
        UPDATE public.automations SET organization_id = new_org_id WHERE user_id = r.user_id;
    END LOOP;
END $$;

-- 4. Travar as colunas organization_id para NOT NULL após o backfill
ALTER TABLE public.contacts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.funnels ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.automations ALTER COLUMN organization_id SET NOT NULL;

-- 5. Remover obrigatoriedade do user_id (tenant agora é organization_id)
-- Vamos manter a coluna user_id como responsável/criador, mas tirar os defaults de auth.uid() para evitar inserções acidentais fora de contexto B2B.
ALTER TABLE public.contacts ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.messages ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.funnels ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.automations ALTER COLUMN user_id DROP DEFAULT;

-- Permitir que user_id seja nulo (pois alguns dados podem pertencer à organização sem dono específico)
ALTER TABLE public.contacts ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.messages ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.funnels ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.automations ALTER COLUMN user_id DROP NOT NULL;

-- 6. Refatorar as RLS Policies
-- Drop antigas (Fase 8)
DROP POLICY IF EXISTS "Users can only access their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can only access their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can only access their own funnels" ON public.funnels;
DROP POLICY IF EXISTS "Users can only access their own automations" ON public.automations;
DROP POLICY IF EXISTS "Users can only access nodes of their own automations" ON public.automation_nodes;

-- Segurança para novas tabelas B2B
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own organizations" ON public.organizations
    FOR ALL USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.organizations.id AND user_id = auth.uid()));

CREATE POLICY "Users can access their own memberships" ON public.organization_members
    FOR ALL USING (user_id = auth.uid());

-- Novas Policies B2B para Tabelas de Negócio
CREATE POLICY "Tenant isolation for contacts" ON public.contacts
    FOR ALL USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.contacts.organization_id AND user_id = auth.uid()));

CREATE POLICY "Tenant isolation for messages" ON public.messages
    FOR ALL USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.messages.organization_id AND user_id = auth.uid()));

CREATE POLICY "Tenant isolation for funnels" ON public.funnels
    FOR ALL USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.funnels.organization_id AND user_id = auth.uid()));

CREATE POLICY "Tenant isolation for automations" ON public.automations
    FOR ALL USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = public.automations.organization_id AND user_id = auth.uid()));

CREATE POLICY "Tenant isolation for automation_nodes" ON public.automation_nodes
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.automations a
        JOIN public.organization_members om ON a.organization_id = om.organization_id
        WHERE a.id = public.automation_nodes.automation_id AND om.user_id = auth.uid()
    ));

-- 7. Trigger de Criação Automática de Organização para Novos Usuários
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
BEGIN
    INSERT INTO public.organizations (name)
    VALUES ('Meu Negócio')
    RETURNING id INTO new_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
