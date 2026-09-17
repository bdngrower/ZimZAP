'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { KanbanBoard } from '@/components/KanbanBoard';
import { CardModal } from '@/components/CardModal';
import { AutomationsBoard } from '@/components/AutomationsBoard';
import { MassMessaging } from '@/components/MassMessaging';
import { Settings } from '@/components/Settings';
import { createClient } from '@/utils/supabase/client';
import { useCRMStore } from '@/store/useCRMStore';

export default function Home() {
  const [activeTab, setActiveTab] = useState('crm');
  const router = useRouter();
  const supabase = createClient();
  const { currentOrganizationId, fetchUserOrganization } = useCRMStore();

  useEffect(() => {
    fetchUserOrganization();
  }, [fetchUserOrganization]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (!currentOrganizationId) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Carregando ambiente...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', padding: '1rem', gap: '1rem' }}>
      
      {/* Sidebar */}
      <aside className="glass-panel" style={{ width: '250px', display: 'flex', flexDirection: 'column', padding: '1.5rem', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }} className="text-gradient">WaSeller</h2>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              className={`btn ${activeTab === 'crm' ? 'btn-primary' : 'btn-glass'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
              onClick={() => setActiveTab('crm')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
              Kanban CRM
            </button>
            <button 
              className={`btn ${activeTab === 'fluxos' ? 'btn-primary' : 'btn-glass'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
              onClick={() => setActiveTab('fluxos')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Automação
            </button>
            <button 
              className={`btn ${activeTab === 'campanhas' ? 'btn-primary' : 'btn-glass'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
              onClick={() => setActiveTab('campanhas')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"></path><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              Envios em Massa
            </button>
            <button 
              className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-glass'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
              onClick={() => setActiveTab('settings')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              Configurações
            </button>
          </nav>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            className="btn btn-glass" 
            style={{ width: '100%', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            onClick={handleLogout}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Sair
          </button>

          <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-tertiary)' }}></div>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Meu Negócio</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Plano Premium</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="glass-panel animate-fade-in-up" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0 }} className="text-accent-gradient">CRM Inteligente</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Gerencie suas conversas da API Oficial em tempo real.</p>
          </div>
          
          <button className="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nova Conversa
          </button>
        </header>

        {/* Board Area */}
        {activeTab === 'crm' && <KanbanBoard />}
        {activeTab === 'fluxos' && <AutomationsBoard />}
        {activeTab === 'campanhas' && <MassMessaging />}
        {activeTab === 'settings' && <Settings />}

      </main>

      {/* Global Modals */}
      <CardModal />
    </div>
  );
}
