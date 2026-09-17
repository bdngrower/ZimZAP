const URL = "https://ckqsbgxagozcscxmpqtg.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcXNiZ3hhZ296Y3NjeG1wcXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzA4MjEsImV4cCI6MjEwNTE0NjgyMX0.u1nCQS7YAFTMgfY-tYcdyuWFVko-DJ1lVPauEdabpVA";

async function main() {
  const headers = {
    'apikey': KEY,
    'Authorization': 'Bearer ' + KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  console.log('Fetching contacts...');
  const res = await fetch(URL + '/rest/v1/contacts?select=id', { headers });
  const contacts = await res.json();
  
  if (Array.isArray(contacts)) {
    for (const c of contacts) {
      await fetch(URL + '/rest/v1/contacts?id=eq.' + c.id, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ current_node_id: null, current_flow_step: 0, bot_paused: false })
      });
    }
    console.log('Reset ' + contacts.length + ' contacts.');
  } else {
    console.log('Error fetching contacts:', contacts);
  }
  
  console.log('Deleting error messages...');
  const delRes = await fetch(URL + '/rest/v1/messages?wa_message_id=like.error-*', {
    method: 'DELETE',
    headers
  });
  console.log('Deleted error messages status:', delRes.status);
}
main();
