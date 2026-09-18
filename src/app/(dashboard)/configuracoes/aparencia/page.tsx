'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { useBrandingStore } from '@/store/useBrandingStore';
import { useCRMStore } from '@/store/useCRMStore';
import { createClient } from '@/utils/supabase/client';
import { Upload, Trash } from 'lucide-react';
import { toast } from 'sonner';

export default function AparenciaPage() {
  const { currentOrganizationId } = useCRMStore();
  const { branding, updateBranding } = useBrandingStore();
  const supabase = createClient();

  const [primaryColor, setPrimaryColor] = useState('#7c3aed');
  const [secondaryColor, setSecondaryColor] = useState('#4f46e5');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [displayName, setDisplayName] = useState('');
  const [logoPath, setLogoPath] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (branding) {
      setPrimaryColor(branding.primary_color);
      setSecondaryColor(branding.secondary_color);
      setTheme(branding.theme);
      setDisplayName(branding.display_name || '');
      setLogoPath(branding.logo_path);
    }
  }, [branding]);

  const handleSave = async () => {
    if (!currentOrganizationId) return;
    setLoading(true);
    
    // Validate hex
    const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
    if (!hexRegex.test(primaryColor) || !hexRegex.test(secondaryColor)) {
      toast.error('Cor inválida', { description: 'Use o formato HEX, ex: #7c3aed' });
      setLoading(false);
      return;
    }

    const success = await updateBranding(currentOrganizationId, {
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      theme,
      display_name: displayName,
      logo_path: logoPath
    });

    if (success) {
      toast.success('Identidade visual atualizada.');
    } else {
      toast.error('Não foi possível salvar as configurações.');
    }
    setLoading(false);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Nenhum arquivo selecionado.');
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const allowedExts = ['png', 'jpg', 'jpeg', 'webp'];
      
      if (!allowedExts.includes(fileExt?.toLowerCase() || '')) {
        throw new Error('Apenas imagens PNG, JPG ou WEBP são permitidas.');
      }
      
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('O arquivo não pode ser maior que 2MB.');
      }

      const filePath = `organizations/${currentOrganizationId}/logo-${Date.now()}.${fileExt}`;

      let { error: uploadError } = await supabase.storage
        .from('brand_assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('brand_assets').getPublicUrl(filePath);
      
      if (data?.publicUrl) {
        setLogoPath(data.publicUrl);
        toast.success('Logo enviada com sucesso!');
      }
      
    } catch (error: any) {
      toast.error('Erro no upload', { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    // Usamos toast customizado para confirmar a deleção, ou o botão direto
    // Como confirm() bloqueia a thread, vamos remover e fazer direto
    setLogoPath(null);
    toast.success('Logo removida. Salve as alterações para confirmar.');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', height: '100%', padding: '1.5rem' }}>
      <PageHeader 
        title="Aparência" 
        description="Personalize as cores, tema e logo do seu espaço de trabalho."
      />
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Painel de Configurações */}
        <div className="glass-panel" style={{ flex: '1 1 400px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nome de Exibição</label>
            <input 
              type="text" 
              className="input" 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)} 
              placeholder="Ex: Minha Empresa"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Logo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px dashed var(--border-subtle)' }}>
                {logoPath ? (
                  <img src={logoPath} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Logo</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                  <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} disabled={uploading}>
                    <Upload size={14} style={{ marginRight: '0.5rem', display: 'inline-block' }} /> 
                    {uploading ? 'Enviando...' : 'Fazer Upload'}
                  </button>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </div>
                {logoPath && (
                  <button className="btn btn-glass" style={{ color: 'var(--danger)', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={removeLogo}>
                    <Trash size={14} style={{ marginRight: '0.5rem', display: 'inline-block' }} /> Remover Logo
                  </button>
                )}
              </div>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PNG, JPG ou WEBP. Máx 2MB. Quadrado recomendado.</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Cor Primária</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={primaryColor} 
                  onChange={e => setPrimaryColor(e.target.value)} 
                  style={{ width: '40px', height: '40px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                />
                <input 
                  type="text" 
                  className="input" 
                  value={primaryColor} 
                  onChange={e => setPrimaryColor(e.target.value)} 
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Cor Secundária</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={secondaryColor} 
                  onChange={e => setSecondaryColor(e.target.value)} 
                  style={{ width: '40px', height: '40px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                />
                <input 
                  type="text" 
                  className="input" 
                  value={secondaryColor} 
                  onChange={e => setSecondaryColor(e.target.value)} 
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tema</label>
            <select className="input" value={theme} onChange={e => setTheme(e.target.value as any)} style={{ width: '100%' }}>
              <option value="dark">Escuro</option>
              <option value="light">Claro</option>
              <option value="system">Sistema</option>
            </select>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {/* Live Preview Pane */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview Ao Vivo</h3>
          
          <div 
            style={{ 
              borderRadius: '12px', 
              padding: '1.5rem', 
              border: '1px solid var(--border-subtle)', 
              background: 'var(--surface-base)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              
              // Injeção de variáveis locais para o preview
              '--preview-primary': primaryColor,
              '--preview-secondary': secondaryColor,
            } as React.CSSProperties}
            className={theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : ''}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--preview-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {logoPath ? (
                  <img src={logoPath} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>
                    {displayName ? displayName.substring(0, 2).toUpperCase() : 'ZZ'}
                  </span>
                )}
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{displayName || 'ZimZAP'}</span>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--preview-primary)', color: 'white', border: 'none', fontWeight: 500 }}>
                Botão Primário
              </button>
              <button style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'transparent', color: 'var(--preview-primary)', border: '1px solid var(--preview-primary)', fontWeight: 500 }}>
                Botão Secundário
              </button>
            </div>
            
            <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--preview-secondary)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Card de Exemplo</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Este elemento demonstra o uso da cor secundária na borda, e o fundo responsivo ao tema escolhido.</p>
            </div>

          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>As alterações só serão aplicadas em todo o sistema após clicar em "Salvar".</p>
        </div>

      </div>
    </div>
  );
}
