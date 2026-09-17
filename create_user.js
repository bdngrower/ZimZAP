const url = 'https://ckqsbgxagozcscxmpqtg.supabase.co/auth/v1/signup';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcXNiZ3hhZ296Y3NjeG1wcXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzA4MjEsImV4cCI6MjEwNTE0NjgyMX0.u1nCQS7YAFTMgfY-tYcdyuWFVko-DJ1lVPauEdabpVA';

fetch(url, {
  method: 'POST',
  headers: {
    'apikey': anonKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'criszimn@gmail.com',
    password: 'Cr1$Z_8812',
    data: {
      name: 'Cris Zimn'
    }
  })
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(err => console.error(err));
