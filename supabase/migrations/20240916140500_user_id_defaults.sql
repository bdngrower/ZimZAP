-- Adicionar DEFAULT auth.uid() para facilitar as inserções automáticas no Supabase.

ALTER TABLE public.contacts ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.messages ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.funnels ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.automations ALTER COLUMN user_id SET DEFAULT auth.uid();
