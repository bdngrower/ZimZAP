import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { contact_id, phone, text, organization_id } = await request.json();

    if (!contact_id || !phone || !text) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Obter o Token Operacional
    const operationalToken = process.env.META_ACCESS_TOKEN || process.env.META_SYSTEM_USER_TOKEN;
    if (!operationalToken) {
      console.error('Nenhum token da Meta configurado.');
      return new NextResponse('Server configuration error', { status: 500 });
    }

    // Descobrir o recipientPhoneId associado ao organization_id ou usar o primeiro disponível
    let recipientPhoneId = null;
    if (organization_id) {
      const { data: waAcc } = await supabase
        .from('whatsapp_accounts')
        .select('phone_number_id')
        .eq('organization_id', organization_id)
        .maybeSingle();
      if (waAcc) recipientPhoneId = waAcc.phone_number_id;
    }

    // Se não achou pela organização, tenta pegar o primeiro disponível no banco
    if (!recipientPhoneId) {
      const { data: anyAcc } = await supabase
        .from('whatsapp_accounts')
        .select('phone_number_id')
        .limit(1)
        .maybeSingle();
      if (anyAcc) recipientPhoneId = anyAcc.phone_number_id;
    }

    if (!recipientPhoneId) {
      console.error('Nenhuma conta WhatsApp configurada no banco de dados.');
      return NextResponse.json({ error: 'No WhatsApp account configured' }, { status: 500 });
    }

    console.log(`🚀 Enviando mensagem manual para ${phone}: ${text}`);

    const sendUrl = `https://graph.facebook.com/v20.0/${recipientPhoneId}/messages`;
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

    console.log('API Graph send response:', sendData);

    if (sendData.messages?.[0]?.id) {
      // Salvar no banco de dados como enviada (outbound)
      const { error: insertErr } = await supabase.from('messages').insert([{
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
    console.error('Erro na rota de envio manual:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
