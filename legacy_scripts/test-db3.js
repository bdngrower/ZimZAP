import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ckqsbgxagozcscxmpqtg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcXNiZ3hhZ296Y3NjeG1wcXRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU3MDgyMSwiZXhwIjoyMTA1MTQ2ODIxfQ.bTMJ2VR4VAunpMTeuanF0xsOQFUXtcvrzab2yyrPkU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('messages').insert([{
    contact_id: '0c69e77c-df8f-4873-b84b-342c4d6e14e0',
    wa_message_id: 'test_123',
    direction: 'inbound',
    type: 'text',
    content: 'test text'
  }]);
  
  console.log("Insert Result:", error || "Success");
}

test();
