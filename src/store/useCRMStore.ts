import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export type Contact = {
  id: string;
  name: string;
  phone: string;
  status: string; // 'new', 'negotiating', 'won', 'lost'
  labels: string[];
  created_at: string;
  updated_at?: string;
  organization_id: string;
  bot_paused?: boolean;
};

type CRMState = {
  currentOrganizationId: string | null;
  contacts: Contact[];
  loading: boolean;
  activeContactId: string | null;
  fetchUserOrganization: () => Promise<void>;
  fetchContacts: () => Promise<void>;
  setContacts: (contacts: Contact[]) => void;
  moveContact: (contactId: string, newStatus: string) => Promise<void>;
  addMockContact: () => Promise<void>;
  openModal: (contactId: string) => void;
  closeModal: () => void;
  toggleBotPaused: (contactId: string, paused: boolean) => Promise<void>;
};

export const useCRMStore = create<CRMState>((set, get) => ({
  currentOrganizationId: null,
  contacts: [],
  loading: true,
  activeContactId: null,

  openModal: (contactId) => set({ activeContactId: contactId }),
  closeModal: () => set({ activeContactId: null }),
  setContacts: (contacts) => set({ contacts }),

  fetchUserOrganization: async () => {
    // Pega a primeira organização da qual o usuário é membro
    const { data, error } = await supabase
      .from('organization_members')
      .select('organization_id')
      .limit(1)
      .single();

    if (!error && data) {
      set({ currentOrganizationId: data.organization_id });
    } else {
      console.error('Error fetching organization:', error);
    }
  },

  fetchContacts: async () => {
    set({ loading: true });
    
    // Ordena por updated_at (se houver) ou created_at para as mensagens recentes sempre subirem
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      set({ contacts: data, loading: false });
    } else {
      console.error('Error fetching contacts:', error);
      set({ loading: false });
    }
  },

  moveContact: async (contactId, newStatus) => {
    // Atualização Otimista no Zustand
    set((state) => ({
      contacts: state.contacts.map((c) => 
        c.id === contactId ? { ...c, status: newStatus } : c
      ),
    }));

    // Sincroniza com Supabase
    const { error } = await supabase
      .from('contacts')
      .update({ status: newStatus })
      .eq('id', contactId);

    if (error) {
      console.error('Error moving contact:', error);
      // Opcional: Reverter estado em caso de erro
      get().fetchContacts();
    }
  },

  toggleBotPaused: async (contactId, paused) => {
    set((state) => ({
      contacts: state.contacts.map((c) => 
        c.id === contactId ? { ...c, bot_paused: paused } : c
      ),
    }));

    const { error } = await supabase
      .from('contacts')
      .update({ bot_paused: paused })
      .eq('id', contactId);

    if (error) {
      console.error('Error toggling bot status:', error);
      get().fetchContacts();
    }
  },

  addMockContact: async () => {
    const orgId = get().currentOrganizationId;
    if (!orgId) {
      console.error('Nenhuma organização selecionada');
      return;
    }

    const newContact = {
      organization_id: orgId,
      name: `Lead ${Math.floor(Math.random() * 1000)}`,
      phone: `551199999${Math.floor(Math.random() * 9999)}`,
      status: 'new',
    };

    const { data, error } = await supabase
      .from('contacts')
      .insert([newContact])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({
        contacts: [data, ...state.contacts],
      }));
    } else {
      console.error('Erro ao inserir Lead:', error);
    }
  },
}));
