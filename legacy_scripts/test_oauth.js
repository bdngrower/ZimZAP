const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
let appId = '';
let appSecret = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_META_APP_ID=')) {
    appId = line.split('=')[1].replace(/"/g, '').trim();
  }
  if (line.startsWith('META_APP_SECRET=')) {
    appSecret = line.split('=')[1].replace(/"/g, '').trim();
  }
});

const url = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=invalid_code_for_test`;

console.log("Calling URL:", url.replace(appSecret, 'HIDDEN'));

fetch(url)
  .then(res => res.json().then(data => ({status: res.status, data})))
  .then(console.log)
  .catch(console.error);
