'use client';

import { useEffect } from 'react';
import { useCRMStore } from '@/store/useCRMStore';
import { useBrandingStore } from '@/store/useBrandingStore';

export function OrganizationBrandingProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganizationId } = useCRMStore();
  const { branding, fetchBranding } = useBrandingStore();

  useEffect(() => {
    if (currentOrganizationId) {
      fetchBranding(currentOrganizationId);
    }
  }, [currentOrganizationId, fetchBranding]);

  useEffect(() => {
    if (branding) {
      // Aplica as cores ao :root
      document.documentElement.style.setProperty('--brand-primary', branding.primary_color);
      document.documentElement.style.setProperty('--brand-secondary', branding.secondary_color);

      // Aplica o tema
      if (branding.theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        // Adicionar class no body também pode ser útil dependendo da config do tailwind
      } else if (branding.theme === 'dark') {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      } else {
        // System
        document.documentElement.classList.remove('light', 'dark');
      }
    }
  }, [branding]);

  return <>{children}</>;
}
