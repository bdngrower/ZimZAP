-- Atualizações no Esquema para React Flow Automations

-- Tabela de Automations: adicionando suporte a grafos (React Flow)
ALTER TABLE public.automations ADD COLUMN IF NOT EXISTS flow_data JSONB DEFAULT '{}'::jsonb;

-- Atualizar Tabela Contacts para usar ID do Nó como String (React Flow IDs são strings)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS current_node_id TEXT;
