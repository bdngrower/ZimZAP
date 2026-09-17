'use client';

import React from 'react';
import { Settings } from '@/components/Settings';
import { PageHeader } from '@/components/ui/page-header';

export default function ConfiguracoesPage() {
  return (
    <div className="flex flex-col h-full animate-fade-in">
      <PageHeader 
        title="Configurações da Organização" 
        description="Gerencie os dados, aparência, equipe e integrações do seu negócio."
      />
      
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* A própria Settings.tsx terá que ser refatorada na Fase 5 para remover o header interno que ela já tem */}
        <Settings />
      </div>
    </div>
  );
}
