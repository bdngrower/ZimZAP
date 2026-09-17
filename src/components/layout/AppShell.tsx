'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageSquare, LayoutDashboard, Zap, Send, Calendar, Settings, LogOut, User, Menu } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useCRMStore } from '@/store/useCRMStore';

const MAIN_MODULES = [
  { id: 'crm', label: 'CRM', icon: LayoutDashboard, href: '/crm' },
  { id: 'automacoes', label: 'Automações', icon: Zap, href: '/automacoes' },
];

const BOTTOM_MODULES = [
  { id: 'configuracoes', label: 'Configurações', icon: Settings, href: '/configuracoes' }
];

const MODULE_SUBSECTIONS: Record<string, { label: string; href: string }[]> = {
  'configuracoes': [
    { label: 'Geral', href: '/configuracoes' },
  ],
  'crm': [
    { label: 'Pipeline', href: '/crm' },
  ]
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { currentOrganizationId, fetchUserOrganization } = useCRMStore();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchUserOrganization();
  }, [fetchUserOrganization]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const currentModuleId = pathname.split('/')[1] || 'crm';
  const subsections = MODULE_SUBSECTIONS[currentModuleId] || [];
  const hasSubsections = subsections.length > 0;

  if (!currentOrganizationId) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Carregando ambiente...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
      
      {/* Tier 1: Main Sidebar (Narrow) */}
      <aside 
        style={{
          width: '68px',
          backgroundColor: 'var(--surface-elevated)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '1rem 0',
          zIndex: 40
        }}
        className="hidden md:flex"
      >
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
          <Zap size={20} color="white" />
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, width: '100%', alignItems: 'center' }}>
          {MAIN_MODULES.map(mod => {
            const isActive = currentModuleId === mod.id;
            return (
              <Link key={mod.id} href={mod.href} style={{ 
                width: '44px', height: '44px', borderRadius: '8px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: isActive ? 'var(--brand-primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
              title={mod.label}
              className={!isActive ? 'hover:bg-surface-raised hover:text-text-primary' : ''}
              >
                <mod.icon size={20} />
              </Link>
            );
          })}
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
          {BOTTOM_MODULES.map(mod => {
            const isActive = currentModuleId === mod.id;
            return (
              <Link key={mod.id} href={mod.href} style={{ 
                width: '44px', height: '44px', borderRadius: '8px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: isActive ? 'var(--brand-primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
              title={mod.label}
              className={!isActive ? 'hover:bg-surface-raised hover:text-text-primary' : ''}
              >
                <mod.icon size={20} />
              </Link>
            );
          })}
          
          <button 
            title="Perfil / Sair"
            onClick={handleLogout}
            style={{ 
              width: '44px', height: '44px', borderRadius: '8px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)',
              marginTop: '0.5rem'
            }}
            className="hover:bg-surface-raised hover:text-danger"
          >
            <User size={20} />
          </button>
        </div>
      </aside>

      {/* Tier 2: Secondary Sidebar */}
      {hasSubsections && (
        <aside
          style={{
            width: '230px',
            backgroundColor: 'var(--surface-base)',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 30
          }}
          className="hidden md:flex"
        >
          <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {MAIN_MODULES.find(m => m.id === currentModuleId)?.label || BOTTOM_MODULES.find(m => m.id === currentModuleId)?.label}
            </h2>
          </div>
          <nav style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {subsections.map(sub => {
              const isActive = pathname === sub.href;
              return (
                <Link key={sub.href} href={sub.href} 
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 500 : 400,
                    backgroundColor: isActive ? 'var(--surface-raised)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                  className={!isActive ? 'hover:bg-surface-raised hover:text-text-primary' : ''}
                >
                  {sub.label}
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* TopBar */}
        <header style={{ 
          height: '60px', 
          borderBottom: '1px solid var(--border-subtle)', 
          backgroundColor: 'var(--surface-glass)',
          backdropFilter: 'var(--glass-blur)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          zIndex: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Contexto da Organização */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--brand-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'white' }}>ZZ</span>
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>ZimZAP</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }} className="bg-surface-base">
          {children}
        </main>
      </div>

    </div>
  );
}
