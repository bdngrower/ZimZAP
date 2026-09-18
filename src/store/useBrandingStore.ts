import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export type OrganizationBranding = {
  organization_id: string;
  display_name: string | null;
  logo_path: string | null;
  primary_color: string;
  secondary_color: string;
  theme: 'light' | 'dark' | 'system';
};

type BrandingState = {
  branding: OrganizationBranding | null;
  loading: boolean;
  fetchBranding: (organizationId: string) => Promise<void>;
  updateBranding: (organizationId: string, updates: Partial<OrganizationBranding>) => Promise<boolean>;
};

const DEFAULT_BRANDING: OrganizationBranding = {
  organization_id: '',
  display_name: null,
  logo_path: null,
  primary_color: '#7c3aed',
  secondary_color: '#4f46e5',
  theme: 'dark'
};

export const useBrandingStore = create<BrandingState>((set, get) => ({
  branding: null,
  loading: false,

  fetchBranding: async (organizationId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('organization_branding')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching branding:', error);
      }

      set({ branding: data || { ...DEFAULT_BRANDING, organization_id: organizationId } });
    } catch (e) {
      console.error(e);
    } finally {
      set({ loading: false });
    }
  },

  updateBranding: async (organizationId, updates) => {
    set({ loading: true });
    try {
      const current = get().branding || { ...DEFAULT_BRANDING, organization_id: organizationId };
      const newBranding = { ...current, ...updates, organization_id: organizationId };

      const { data, error } = await supabase
        .from('organization_branding')
        .upsert(newBranding, { onConflict: 'organization_id' })
        .select()
        .single();

      if (error) {
        console.error('Error updating branding:', error);
        return false;
      }

      set({ branding: data });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      set({ loading: false });
    }
  }
}));
