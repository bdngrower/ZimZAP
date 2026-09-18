const fs = require('fs');
const https = require('https');

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\n]+)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\n]+)/);

const url = urlMatch[1].replace(/['"]/g, '');
const key = keyMatch[1].replace(/['"]/g, '');

const options = {
  hostname: new URL(url).hostname,
  path: '/rest/v1/contacts?phone=eq.5519986008812',
  method: 'GET',
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (d) => { data += d; });
  res.on('end', () => { console.log(data); });
});

req.on('error', (e) => { console.error(e); });
req.end();
