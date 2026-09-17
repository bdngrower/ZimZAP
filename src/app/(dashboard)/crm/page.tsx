'use client';

import React from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function CRMPage() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%', padding: '1.5rem' }}>
      <PageHeader 
        title="Pipeline CRM" 
        description="Gerencie o progresso e o atendimento de cada contato."
      />
      
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <KanbanBoard />
      </div>
    </div>
  );
}
