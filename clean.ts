import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { supabaseAdmin } from './src/lib/supabaseAdmin';

async function main() {
  console.log('Fetching contacts...');
  const { data: contacts, error: e1 } = await supabaseAdmin.from('contacts').select('id');
  
  if (e1) console.error(e1);
  
  if (contacts) {
    for (const c of contacts) {
      await supabaseAdmin.from('contacts').update({ current_node_id: null, current_flow_step: 0, bot_paused: false }).eq('id', c.id);
    }
    console.log('Reset ' + contacts.length + ' contacts.');
  }
  
  console.log('Deleting error messages...');
  const { error: delErr } = await supabaseAdmin.from('messages').delete().like('wa_message_id', 'error-%');
  console.log('Deleted error messages:', delErr || 'OK');
}
main();
