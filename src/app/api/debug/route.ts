import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export async function GET() {
  const { data: accounts, error: e0 } = await supabase.from('whatsapp_accounts').select('*');
  const { data: contacts, error: e1 } = await supabase.from('contacts').select('*').limit(5).order('created_at', { ascending: false });
  const { data: messages, error: e2 } = await supabase.from('messages').select('*').limit(5).order('timestamp', { ascending: false });
  const { data: automations, error: e3 } = await supabase.from('automations').select('*').limit(5).order('created_at', { ascending: false });
  const e4 = {
    hasMetaAccessToken: !!process.env.META_ACCESS_TOKEN,
    metaAccessTokenLength: process.env.META_ACCESS_TOKEN?.length || 0,
    hasSystemUserToken: !!process.env.META_SYSTEM_USER_TOKEN,
    systemUserTokenLength: process.env.META_SYSTEM_USER_TOKEN?.length || 0
  };
  
  return NextResponse.json({ accounts, e0, contacts, e1, messages, e2, automations, e3, e4 });
}
