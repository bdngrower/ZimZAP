'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster 
      position="top-right" 
      toastOptions={{
        style: {
          background: 'var(--surface-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-strong)',
          fontFamily: 'inherit'
        }
      }}
    />
  );
}
