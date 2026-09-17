'use client';

import React from 'react';
import { Settings } from '@/components/Settings';
import { PageHeader } from '@/components/ui/page-header';

export default function ConfiguracoesPage() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', height: '100%', padding: '1.5rem' }}>
      <PageHeader 
        title="Configurações da Organização" 
        description="Gerencie os dados, aparência, equipe e integrações do seu negócio."
      />
      
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* A própria Settings.tsx terá que ser refatorada na Fase 5 para remover o header interno que ela já tem */}
        <Settings />
      </div>
    </div>
  );
}
