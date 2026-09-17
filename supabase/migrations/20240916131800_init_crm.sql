-- Script para inicialização do Banco de Dados do CRM (Supabase)

-- 1. Tabela de Contatos (Leads/Clientes)
CREATE TABLE public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    labels TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Mensagens (WhatsApp API)
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    wa_message_id TEXT UNIQUE,
    direction TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    content TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Funis (Funnels)
CREATE TABLE public.funnels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#8b5cf6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Segurança (RLS - Row Level Security)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for now on contacts" ON public.contacts FOR ALL USING (true);
CREATE POLICY "Allow all operations for now on messages" ON public.messages FOR ALL USING (true);
CREATE POLICY "Allow all operations for now on funnels" ON public.funnels FOR ALL USING (true);
