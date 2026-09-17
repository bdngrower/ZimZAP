import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    // Buscar mensagens agendadas pendentes que já passaram do horário
    const { data: messages, error: fetchError } = await supabaseAdmin
      .from('scheduled_messages')
      .select('*, contacts(phone)')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());

    if (fetchError) {
      console.error('Erro ao buscar mensagens agendadas:', fetchError);
      return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 });
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ success: true, message: 'Nenhuma mensagem para enviar.' });
    }

    const operationalToken = process.env.META_SYSTEM_USER_TOKEN;
    if (!operationalToken) {
      return NextResponse.json({ error: 'Token do Meta não configurado' }, { status: 500 });
    }

    const results = [];

    for (const msg of messages) {
      const recipientPhone = msg.contacts?.phone;
      if (!recipientPhone) continue;

      // Pegar a conta do WhatsApp da organização
      const { data: account } = await supabaseAdmin
        .from('whatsapp_accounts')
        .select('phone_number_id')
        .eq('organization_id', msg.organization_id)
        .eq('connection_status', 'CONNECTED')
        .limit(1)
        .maybeSingle();

      if (!account?.phone_number_id) {
        await supabaseAdmin.from('scheduled_messages').update({ status: 'failed', error_message: 'Conta WhatsApp não encontrada' }).eq('id', msg.id);
        continue;
      }

      // Enviar via Meta API
      const sendUrl = `https://graph.facebook.com/v20.0/${account.phone_number_id}/messages`;
      const sendRes = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${operationalToken}`
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipientPhone,
          type: 'text',
          text: { body: msg.content }
        })
      });

      const sendData = await sendRes.json();

      if (sendRes.ok && sendData.messages?.[0]?.id) {
        // Sucesso: registrar mensagem na tabela principal
        await supabaseAdmin.from('messages').insert([{
          contact_id: msg.contact_id,
          organization_id: msg.organization_id,
          wa_message_id: sendData.messages[0].id,
          direction: 'outbound',
          type: 'text',
          content: msg.content,
          status: 'sent'
        }]);

        // Marcar como enviada
        await supabaseAdmin.from('scheduled_messages').update({ status: 'sent' }).eq('id', msg.id);
        
        // Atualizar contato no kanban
        await supabaseAdmin.from('contacts').update({ updated_at: new Date().toISOString() }).eq('id', msg.contact_id);

        results.push({ id: msg.id, status: 'sent' });
      } else {
        // Falha
        await supabaseAdmin.from('scheduled_messages').update({ 
          status: 'failed', 
          error_message: JSON.stringify(sendData)
        }).eq('id', msg.id);
        results.push({ id: msg.id, status: 'failed' });
      }
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (error: any) {
    console.error('Erro na API de cron:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
