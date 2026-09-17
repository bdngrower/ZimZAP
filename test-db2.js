import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ckqsbgxagozcscxmpqtg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcXNiZ3hhZ296Y3NjeG1wcXRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU3MDgyMSwiZXhwIjoyMTA1MTQ2ODIxfQ.bTMJ2VR4VAunpMTeuanF0xsOQFUXtcvrzab2yyrPkU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: c } = await supabase.from('contacts').select('*').limit(3).order('created_at', { ascending: false });
  console.log("Contacts:", c);
  
  const { data: m } = await supabase.from('messages').select('*').limit(3).order('timestamp', { ascending: false });
  console.log("Messages:", m);
  
  const { data: a } = await supabase.from('automations').select('id, name, active, organization_id, flow_data').limit(3);
  console.log("Automations:", a);
}

test();
