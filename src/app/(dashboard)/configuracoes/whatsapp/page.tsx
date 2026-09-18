'use client';

import React from 'react';
import { Settings } from '@/components/Settings';
import { PageHeader } from '@/components/ui/page-header';

export default function WhatsAppPage() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', height: '100%', padding: '1.5rem' }}>
      <PageHeader 
        title="WhatsApp" 
        description="Gerencie os números conectados para sua organização."
      />
      
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Settings />
      </div>
    </div>
  );
}
