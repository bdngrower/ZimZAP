import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // organization_id
  const error = url.searchParams.get('error');

  if (error || !code || !state) {
    return NextResponse.redirect(new URL('/?error=google_auth_failed', req.url));
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${url.origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/?error=google_config_missing', req.url));
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      })
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('Google token error:', tokenData);
      return NextResponse.redirect(new URL('/?error=google_token_failed', req.url));
    }

    // Obter e-mail do usuário
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userInfo = await userInfoRes.json();

    // Salvar no Supabase
    // Como ainda não criamos a tabela calendar_connections, vou usar upsert para evitar duplicações se já existir
    const { error: dbError } = await supabaseAdmin.from('calendar_connections').upsert({
      organization_id: state,
      provider: 'google',
      provider_email: userInfo.email,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token, // Crucial para renovar o token offline
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'organization_id,provider' });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.redirect(new URL('/?error=database_error', req.url));
    }

    return NextResponse.redirect(new URL('/?success=google_connected', req.url));

  } catch (err) {
    console.error('OAuth callback exception:', err);
    return NextResponse.redirect(new URL('/?error=server_error', req.url));
  }
}
