import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ckqsbgxagozcscxmpqtg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcXNiZ3hhZ296Y3NjeG1wcXRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU3MDgyMSwiZXhwIjoyMTA1MTQ2ODIxfQ.bTMJ2VR4VAunpMTeuanF0xsOQFUXtcvrzab2yyrPkU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  // 1. Resetar contato preso no fluxo
  const { error: e1 } = await supabase
    .from('contacts')
    .update({ current_flow_id: null, current_node_id: null, name: 'Cristian Zimermann' })
    .eq('id', '0c69e77c-df8f-4873-b84b-342c4d6e14e0');
  console.log('1. Reset contato:', e1 ? e1.message : 'OK');

  // 2. Verificar se RLS policies existem na tabela messages
  const { data: policies, error: e2 } = await supabase.rpc('exec_sql', {
    sql: "SELECT policyname FROM pg_policies WHERE tablename = 'messages'"
  });
  console.log('2. Policies na tabela messages:', policies || e2?.message);
  
  // 3. Criar policy se não existir (via SQL direto)
  // Nota: isso precisa ser feito no SQL Editor do Supabase
  
  // 4. Verificar whatsapp_accounts
  const { data: waAccounts, error: e3 } = await supabase
    .from('whatsapp_accounts')
    .select('*');
  console.log('3. WhatsApp Accounts:', waAccounts, e3?.message);
}

fix();
