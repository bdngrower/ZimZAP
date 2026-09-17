import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contact_id, organization_id, content, scheduled_at } = body;

    if (!contact_id || !organization_id || !content || !scheduled_at) {
      return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('scheduled_messages')
      .insert([
        {
          contact_id,
          organization_id,
          content,
          scheduled_at,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao agendar mensagem:', error);
      return NextResponse.json({ error: 'Erro interno ao agendar' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Erro na API de agendamento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
