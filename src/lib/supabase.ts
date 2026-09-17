import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('⚠️ Credenciais do Supabase não encontradas. O cliente não funcionará corretamente.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
