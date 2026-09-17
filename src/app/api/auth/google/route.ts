import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const organization_id = url.searchParams.get('organization_id');

  if (!organization_id) {
    return NextResponse.json({ error: 'organization_id ausente' }, { status: 400 });
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${url.origin}/api/auth/google/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'Configuração do Google Client ID ausente no servidor' }, { status: 500 });
  }

  const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email');
  
  // Pass organization_id in state parameter
  const state = encodeURIComponent(organization_id);
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;

  return NextResponse.redirect(authUrl);
}
