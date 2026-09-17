'use client';

import React from 'react';
import { AutomationsBoard } from '@/components/AutomationsBoard';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function AutomationsPage() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%', padding: '1.5rem' }}>
      <PageHeader 
        title="Automações" 
        description="Construa fluxos e responda mensagens automaticamente 24/7."
      />
      
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <AutomationsBoard />
      </div>
    </div>
  );
}
