-- Atualizações no Esquema para Automações Avançadas e Chat

-- Adicionar controle de automação na tabela contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS current_flow_id UUID REFERENCES public.automations(id) ON DELETE SET NULL;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS current_flow_step INTEGER DEFAULT 0;

-- Tabela de Automations (caso falte alguma coluna)
ALTER TABLE public.automations ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT false;

-- Permitir RLS caso não esteja ativo
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for now on automations" ON public.automations FOR ALL USING (true);
