'use client';

import React from 'react';
import { AutomationsBoard } from '@/components/AutomationsBoard';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function AutomationsPage() {
  return (
    <div className="flex flex-col h-full animate-fade-in">
      <PageHeader 
        title="Automações" 
        description="Construa fluxos e responda mensagens automaticamente 24/7."
      />
      
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <AutomationsBoard />
      </div>
    </div>
  );
}
