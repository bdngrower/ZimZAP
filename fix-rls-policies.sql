-- Fix: Adicionar RLS policies para a tabela messages e contacts

-- === MESSAGES ===
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read org messages" ON public.messages;
CREATE POLICY "Members can read org messages" ON public.messages
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can insert org messages" ON public.messages;
CREATE POLICY "Members can insert org messages" ON public.messages
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access messages" ON public.messages;
CREATE POLICY "Service role full access messages" ON public.messages
  FOR ALL USING (true) WITH CHECK (true);

-- === CONTACTS ===
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read org contacts" ON public.contacts;
CREATE POLICY "Members can read org contacts" ON public.contacts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can update org contacts" ON public.contacts;
CREATE POLICY "Members can update org contacts" ON public.contacts
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access contacts" ON public.contacts;
CREATE POLICY "Service role full access contacts" ON public.contacts
  FOR ALL USING (true) WITH CHECK (true);
