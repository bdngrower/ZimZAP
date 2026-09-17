-- Script para inicialização do Banco de Dados do CRM (Supabase)

-- 1. Tabela de Contatos (Leads/Clientes)
CREATE TABLE public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    labels TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'new', -- new, negotiating, won, lost
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Mensagens (WhatsApp API)
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    wa_message_id TEXT UNIQUE, -- ID original da mensagem da API do WhatsApp
    direction TEXT NOT NULL, -- 'inbound' (recebida) ou 'outbound' (enviada)
    type TEXT DEFAULT 'text', -- text, image, audio, document
    content TEXT NOT NULL, -- Conteúdo da mensagem (texto) ou URL da mídia
    status TEXT DEFAULT 'sent', -- sent, delivered, read (apenas para outbound)
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
-- Por enquanto, para facilitar a migração e testes iniciais, vamos permitir leitura/escrita autenticada e anônima se for o caso
-- (Recomenda-se ajustar em produção)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for now on contacts" ON public.contacts FOR ALL USING (true);
CREATE POLICY "Allow all operations for now on messages" ON public.messages FOR ALL USING (true);
CREATE POLICY "Allow all operations for now on funnels" ON public.funnels FOR ALL USING (true);
