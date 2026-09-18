-- Migration Fase 5: Organization Branding e Identidade Persistente

-- 1. Criação da Tabela organization_branding
CREATE TABLE IF NOT EXISTS public.organization_branding (
    organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    display_name TEXT,
    logo_path TEXT,
    primary_color TEXT DEFAULT '#7c3aed',
    secondary_color TEXT DEFAULT '#4f46e5',
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.organization_branding ENABLE ROW LEVEL SECURITY;

-- 2. Policies de RLS para a Tabela

-- Qualquer membro da organização pode LER o branding
CREATE POLICY "Members can view branding" ON public.organization_branding
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id = public.organization_branding.organization_id 
            AND user_id = auth.uid()
        )
    );

-- Somente owner e admin podem INSERIR
CREATE POLICY "Admins can insert branding" ON public.organization_branding
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id = public.organization_branding.organization_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Somente owner e admin podem ATUALIZAR
CREATE POLICY "Admins can update branding" ON public.organization_branding
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id = public.organization_branding.organization_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id = public.organization_branding.organization_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Somente owner e admin podem DELETAR
CREATE POLICY "Admins can delete branding" ON public.organization_branding
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id = public.organization_branding.organization_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );


-- 3. Atualização de updated_at trigger (caso use a function genérica de trigger)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_organization_branding_updated_at ON public.organization_branding;
CREATE TRIGGER update_organization_branding_updated_at
    BEFORE UPDATE ON public.organization_branding
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- 4. Storage Bucket para Assets de Brand (Público para leitura)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('brand_assets', 'brand_assets', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Policies de RLS para o Storage
-- Todos podem visualizar o logo (acesso público de leitura não requer auth.uid(), mas pra lista precisa)
-- Normalmente bucket público libera acesso via URL sem token, mas o SELECT no banco storage.objects:
CREATE POLICY "Public Access to Brand Assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'brand_assets');

-- Apenas owners e admins podem fazer INSERT em brand_assets/organizations/{org_id}/...
CREATE POLICY "Admins can insert brand assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'brand_assets' AND
        (storage.foldername(name))[1] = 'organizations' AND
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id::text = (storage.foldername(name))[2]
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Apenas owners e admins podem fazer UPDATE (substituição)
CREATE POLICY "Admins can update brand assets" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'brand_assets' AND
        (storage.foldername(name))[1] = 'organizations' AND
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id::text = (storage.foldername(name))[2]
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Apenas owners e admins podem DELETAR
CREATE POLICY "Admins can delete brand assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'brand_assets' AND
        (storage.foldername(name))[1] = 'organizations' AND
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id::text = (storage.foldername(name))[2]
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );
