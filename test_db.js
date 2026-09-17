const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ckqsbgxagozcscxmpqtg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcXNiZ3hhZ296Y3NjeG1wcXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzA4MjEsImV4cCI6MjEwNTE0NjgyMX0.u1nCQS7YAFTMgfY-tYcdyuWFVko-DJ1lVPauEdabpVA');
async function main() {
  const { data, error } = await supabase.from('whatsapp_accounts').select('id, access_token');
  console.log('DATA:', data);
  console.log('ERROR:', error);
}
main();
