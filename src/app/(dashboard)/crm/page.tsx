'use client';

import React from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function CRMPage() {
  return (
    <div className="flex flex-col h-full animate-fade-in">
      <PageHeader 
        title="Pipeline CRM" 
        description="Gerencie o progresso e o atendimento de cada contato."
      />
      
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <KanbanBoard />
      </div>
    </div>
  );
}
