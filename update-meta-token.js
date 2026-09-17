import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ckqsbgxagozcscxmpqtg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcXNiZ3hhZ296Y3NjeG1wcXRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU3MDgyMSwiZXhwIjoyMTA1MTQ2ODIxfQ.bTMJ2VR4VAunpMTeuanF0xsOQFUXtcvrzab2yyrPkU0';

const supabase = createClient(supabaseUrl, supabaseKey);

const newToken = 'EAAPT2XQZBXEEBSobdl5hwdZAR9ogPAWjOdlF8LHwodVAJ2MZA0rp8j9ArGZBYDJdgt8JgMRNUbrSgkwQDuHq9E86GZBr5xDwyoi0Mnugtam2knYX7FEiiEi31lbQPiOGVy5hsEHFmuNqtg7HkEFOZAbNQbyMO2wBwSCWxChNq7Ek9DY5ti45EOUnT4Nn0o5T3yjHHHoqKi4osRZB5aLEc0VlrfOfi97jLM6GnsgiJzsEbxBZC0Q4QAZBu9ulOZCGFsp3M5nbbMRDIQCmYjMyZC6O1CZA4wZDZD';

async function updateToken() {
  // 1. Atualizar todas as contas de whatsapp existentes com o novo access_token
  const { data, error } = await supabase
    .from('whatsapp_accounts')
    .update({ access_token: newToken })
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select();

  console.log('Update whatsapp_accounts:', error ? error.message : 'Sucesso!', data);

  // 2. Resetar o contato do Cristian no fluxo para começar do zero
  const { error: errContact } = await supabase
    .from('contacts')
    .update({ 
      current_flow_id: null, 
      current_node_id: null,
      custom_fields: {}
    })
    .eq('phone', '5519986008812');

  console.log('Reset contato Cristian:', errContact ? errContact.message : 'OK');
}

updateToken();
