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
    if (!branding) return;

    // Aplica as cores ao :root
    document.documentElement.style.setProperty('--brand-primary', branding.primary_color);
    document.documentElement.style.setProperty('--brand-secondary', branding.secondary_color);

    // Salva o tema no localStorage para evitar FOUC no próximo reload
    localStorage.setItem('zimzap-theme', branding.theme);

    const applyTheme = (theme: string) => {
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (isDark) {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    };

    applyTheme(branding.theme);

    if (branding.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

  }, [branding]);

  return <>{children}</>;
}
