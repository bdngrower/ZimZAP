import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ckqsbgxagozcscxmpqtg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcXNiZ3hhZ296Y3NjeG1wcXRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU3MDgyMSwiZXhwIjoyMTA1MTQ2ODIxfQ.bTMJ2VR4VAunpMTeuanF0xsOQFUXtcvrzab2yyrPkU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('contacts').select('id, current_node_id').limit(1);
  console.log("Contacts Check:", error ? error.message : "Success");
  
  const { data: m, error: me } = await supabase.from('messages').select('*').limit(5).order('created_at', { ascending: false });
  console.log("Latest Messages:", m);
}

test();
