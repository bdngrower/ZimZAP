'use client';

import React from 'react';
import { MassMessaging } from '@/components/MassMessaging';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export default function CampanhasPage() {
  return (
    <div className="flex flex-col h-full animate-fade-in">
      <PageHeader 
        title="Envios em Massa" 
        description="Agende e dispare mensagens para listas de contatos com facilidade."
      >
        <Button variant="primary">
          <Send size={18} />
          Nova Campanha
        </Button>
      </PageHeader>
      
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <MassMessaging />
      </div>
    </div>
  );
}
