import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Validar sessão autenticada
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { contact_id, text } = await request.json();

    if (!contact_id || !text) {
      return new NextResponse('Missing required fields: contact_id and text', { status: 400 });
    }

    // 1. Busca o contato de forma segura usando o Supabase Client autenticado.
    // O RLS garante que o usuário só consiga ver contatos da sua própria organização.
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('phone, organization_id')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      console.error('Contato não encontrado ou acesso negado (RLS):', contactError);
      return new NextResponse('Contact not found or access denied', { status: 403 });
    }

    const { phone, organization_id } = contact;

    // 2. Busca a conta do WhatsApp conectada para esta organização.
    const { data: waAcc, error: waError } = await supabase
      .from('whatsapp_accounts')
      .select('phone_number_id')
      .eq('organization_id', organization_id)
      .eq('connection_status', 'CONNECTED')
      .maybeSingle();

    if (waError || !waAcc || !waAcc.phone_number_id) {
      console.error(`Nenhuma conta WhatsApp configurada para org ${organization_id}.`);
      return NextResponse.json({ error: 'No WhatsApp account configured for this organization' }, { status: 500 });
    }

    const recipientPhoneId = waAcc.phone_number_id;

    // 3. Obter o Token Operacional 
    const operationalToken = process.env.META_SYSTEM_USER_TOKEN;
    if (!operationalToken) {
      console.error('META_SYSTEM_USER_TOKEN não configurado.');
      return new NextResponse('Server configuration error', { status: 500 });
    }
    
    // (Opcional) Centralizar a Graph API version
    const graphApiVersion = process.env.META_GRAPH_API_VERSION || 'v20.0';

    console.log(`🚀 Enviando mensagem para ${phone} via phone_number_id: ${recipientPhoneId}`);

    const sendUrl = `https://graph.facebook.com/${graphApiVersion}/${recipientPhoneId}/messages`;
    const sendRes = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${operationalToken}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: { preview_url: false, body: text }
      })
    });

    const sendData = await sendRes.json();
    
    if (!sendRes.ok) {
      console.error('Erro na API do WhatsApp:', sendData);
      return NextResponse.json({ error: sendData }, { status: 500 });
    }

    if (sendData.messages?.[0]?.id) {
      // Usamos supabaseAdmin para salvar o histórico pois queremos ignorar se o usuário que enviou
      // tem alguma restrição super-estrita de inserção, embora o RLS de insert permita se for da mesma org.
      const { error: insertErr } = await supabaseAdmin.from('messages').insert([{
        contact_id,
        organization_id,
        wa_message_id: sendData.messages[0].id,
        direction: 'outbound',
        type: 'text',
        content: text,
        status: 'sent'
      }]);

      if (insertErr) {
        console.error('Erro ao salvar mensagem outbound:', insertErr);
      }

      return NextResponse.json({ success: true, messageId: sendData.messages[0].id });
    }

    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });

  } catch (error) {
    console.error('Erro na rota de envio:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
