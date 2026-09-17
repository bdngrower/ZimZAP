import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { getFreeSlots, createEvent } from '@/lib/googleCalendar';

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'WaSellerWebh00k';

// Método GET: Utilizado pela Meta para verificar o Webhook
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado com sucesso pela Meta!');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error('❌ Falha na verificação do Webhook.');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// Método POST: Utilizado para receber as mensagens do WhatsApp
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verifica se é um evento do WhatsApp
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            // Nova Mensagem Recebida
            const message = change.value.messages[0];
            const contact = change.value.contacts[0];
            
            const wa_message_id = message.id;
            const phone = contact.wa_id;
            const name = contact.profile.name;
            const type = message.type;
            const text = type === 'text' ? message.text.body : '[Mídia/Outro]';

            console.log(`📩 Nova mensagem de ${name} (${phone}): ${text}`);

            // 0. Descobre a organization_id vinculada a esta conta WhatsApp
            const recipientPhoneId = change.value.metadata?.phone_number_id;
            let orgId: string | null = null;
            if (recipientPhoneId) {
              const { data: waAcc } = await supabase
                .from('whatsapp_accounts')
                .select('organization_id')
                .eq('phone_number_id', recipientPhoneId)
                .single();
              if (waAcc) orgId = waAcc.organization_id;
            }

            // Fallback se não achou pela conta: pega a primeira organização existente
            if (!orgId) {
              const { data: fallbackOrg } = await supabase
                .from('organizations')
                .select('id')
                .limit(1)
                .single();
              if (fallbackOrg) orgId = fallbackOrg.id;
            }

            // 1. Verifica se o contato existe ou cria um novo vinculado à organização
            let { data: dbContact, error: fetchContactErr } = await supabase
              .from('contacts')
              .select('id, organization_id, current_flow_id, current_node_id, bot_paused')
              .eq('phone', phone)
              .maybeSingle();

            if (fetchContactErr) {
              console.error('Erro ao buscar contato no Supabase:', fetchContactErr);
            }

            if (!dbContact) {
              const { data: newContact, error: insertContactErr } = await supabase
                .from('contacts')
                .insert([{ 
                  name: name || phone, 
                  phone, 
                  status: 'new',
                  organization_id: orgId 
                }])
                .select()
                .single();

              if (insertContactErr) {
                console.error('Erro ao criar novo contato no Supabase:', insertContactErr);
              } else {
                dbContact = newContact;
                console.log('✅ Contato salvo no CRM com sucesso:', newContact);
              }
            }

            // 2. Salva a mensagem no banco
            if (dbContact) {
              const { error: msgErr } = await supabase.from('messages').insert([{
                contact_id: dbContact.id,
                organization_id: dbContact.organization_id,
                wa_message_id,
                direction: 'inbound',
                type,
                content: text
              }]);
              if (msgErr) {
                console.error('Erro ao inserir mensagem no Supabase:', msgErr);
              } else {
                console.log('✅ Mensagem gravada no banco com sucesso!');
                // Atualiza o updated_at do contato para que ele suba no Kanban
                await supabase.from('contacts').update({ updated_at: new Date().toISOString() }).eq('id', dbContact.id);
              }

              // 3. AUTOMAÇÃO / BOT: Responde automaticamente se houver fluxo ativo
              if (dbContact.bot_paused) {
                console.log(`⏸️ Bot pausado para ${name}. A mensagem foi recebida, mas o bot não vai responder.`);
                return new NextResponse('OK', { status: 200 });
              }

              try {
                // Remove fallback to META_ACCESS_TOKEN because if it's set in Vercel but expired, it intercepts the working system token.
                const operationalToken = process.env.META_SYSTEM_USER_TOKEN;

                if (operationalToken && recipientPhoneId) {
                  let activeFlowId = dbContact.current_flow_id;
                  let currentNodeId = dbContact.current_node_id;
                  let shouldProcessNextNode = true;
                  let flowData: any = null;

                  // Função auxiliar para carregar o fluxo
                  const loadFlowData = async (flowId: string) => {
                    const { data } = await supabase.from('automations').select('flow_data').eq('id', flowId).single();
                    return data?.flow_data;
                  };

                  if (activeFlowId) {
                    flowData = await loadFlowData(activeFlowId);
                  }

                  // Se o contato já está em um fluxo, verifica qual era o nó atual (que estava aguardando resposta)
                  if (activeFlowId && currentNodeId && flowData) {
                    const previousNode = flowData.nodes?.find((n: any) => n.id === currentNodeId);
                      
                    // Se o nó anterior exigia entrada (como perguntar nome ou menu de escolhas)
                    if (previousNode) {
                      if (previousNode.data?.type === 'input_name') {
                        await supabase.from('contacts').update({ name: text }).eq('id', dbContact.id);
                        console.log(`👤 Nome do contato atualizado para: ${text}`);
                        const nextEdge = flowData.edges?.find((e: any) => e.source === currentNodeId);
                        currentNodeId = nextEdge ? nextEdge.target : null;
                      } else if (previousNode.data?.type === 'input_email') {
                        console.log(`📧 E-mail recebido: ${text}`);
                        const nextEdge = flowData.edges?.find((e: any) => e.source === currentNodeId);
                        currentNodeId = nextEdge ? nextEdge.target : null;
                      } else if (previousNode.data?.type === 'offer_choices') {
                        const options = previousNode.data?.options || [];
                        const userText = text?.trim() || '';
                        let selectedOptionIndex = -1;

                        const numericChoice = parseInt(userText);
                        if (!isNaN(numericChoice) && numericChoice > 0 && numericChoice <= options.length) {
                          selectedOptionIndex = numericChoice - 1;
                        } else {
                          selectedOptionIndex = options.findIndex((opt: string) => opt.toLowerCase() === userText.toLowerCase());
                        }

                        if (selectedOptionIndex !== -1) {
                          const nextEdge = flowData.edges?.find((e: any) => e.source === currentNodeId && e.sourceHandle === `option-${selectedOptionIndex}`);
                          currentNodeId = nextEdge ? nextEdge.target : null;
                          console.log(`🔀 Usuário escolheu opção ${selectedOptionIndex + 1}. Próximo nó: ${currentNodeId}`);
                        } else {
                          // Resposta inválida — o bot vai re-processar o nó atual (repetir o menu)
                          shouldProcessNextNode = true;
                          console.log(`❌ Resposta inválida para menu: ${userText}. Repetindo menu.`);
                        }
                      } else if (previousNode.data?.type === 'schedule_appointment') {
                        const userText = text?.trim() || '';
                        const numericChoice = parseInt(userText);
                        
                        if (!isNaN(numericChoice) && numericChoice > 0 && numericChoice <= 3) {
                          // Busca o token do Google e recalcula os slots para pegar a escolha do usuário
                          const { data: calConn } = await supabase.from('calendar_connections').select('access_token').eq('organization_id', dbContact.organization_id).eq('provider', 'google').maybeSingle();
                          
                          if (calConn?.access_token) {
                            try {
                              const slots = await getFreeSlots(calConn.access_token);
                              const chosenSlot = slots[numericChoice - 1];
                              
                              if (chosenSlot) {
                                await createEvent(
                                  calConn.access_token, 
                                  chosenSlot.start, 
                                  chosenSlot.end, 
                                  `Reunião com ${dbContact.name}`, 
                                  `Agendado via WhatsApp. Telefone: ${dbContact.phone}`
                                );
                                
                                // Enviar confirmação direta
                                const confirmUrl = `https://graph.facebook.com/v20.0/${recipientPhoneId}/messages`;
                                await fetch(confirmUrl, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${operationalToken}` },
                                  body: JSON.stringify({
                                    messaging_product: 'whatsapp',
                                    to: phone,
                                    type: 'text',
                                    text: { body: `✅ Seu horário foi confirmado para ${chosenSlot.label}!` }
                                  })
                                });
                                console.log('✅ Agendamento criado no Google Calendar com sucesso.');
                              } else {
                                console.log('❌ Slot não disponível ou índice inválido.');
                                shouldProcessNextNode = true; // Repetir
                              }
                            } catch (e) {
                              console.error('Erro ao criar agendamento no Google Calendar:', e);
                              shouldProcessNextNode = true;
                            }
                          } else {
                            console.log('❌ Google Calendar não conectado.');
                            shouldProcessNextNode = true;
                          }
                        } else {
                          shouldProcessNextNode = true; // Resposta inválida, repete o menu de agendamento
                        }
                        
                        if (!shouldProcessNextNode) {
                          const nextEdge = flowData.edges?.find((e: any) => e.source === currentNodeId);
                          currentNodeId = nextEdge ? nextEdge.target : null;
                        }
                      } else {
                        // Para outros nós de input — avança normalmente
                        const nextEdge = flowData.edges?.find((e: any) => e.source === currentNodeId);
                        currentNodeId = nextEdge ? nextEdge.target : null;
                      }
                    }
                  }

                  // Se não tem fluxo ativo ou o fluxo anterior terminou, inicia o fluxo ativo da organização
                  if ((!activeFlowId || !currentNodeId) && dbContact.organization_id) {
                    const { data: orgFlow } = await supabase
                      .from('automations')
                      .select('id, flow_data')
                      .eq('organization_id', dbContact.organization_id)
                      .eq('active', true)
                      .order('created_at', { ascending: false })
                      .limit(1)
                      .maybeSingle();

                    if (orgFlow && orgFlow.flow_data?.nodes?.length > 0) {
                      activeFlowId = orgFlow.id;
                      flowData = orgFlow.flow_data;
                      
                      // O primeiro nó é aquele que não é "target" de nenhuma aresta (ou simplesmente o primeiro do array)
                      const targets = new Set(flowData.edges?.map((e: any) => e.target));
                      const startNode = flowData.nodes.find((n: any) => !targets.has(n.id)) || flowData.nodes[0];
                      
                      currentNodeId = startNode.id;
                      shouldProcessNextNode = true;
                      await supabase.from('contacts').update({ 
                        current_flow_id: activeFlowId,
                        current_node_id: currentNodeId
                      }).eq('id', dbContact.id);
                    } else {
                      shouldProcessNextNode = false;
                    }
                  }

                  // Processa o próximo nó (ou os próximos se não exigirem resposta do usuário)
                  while (activeFlowId && shouldProcessNextNode && currentNodeId) {
                    const node = flowData?.nodes?.find((n: any) => n.id === currentNodeId);

                    if (!node) {
                      // Fim do fluxo
                      await supabase.from('contacts').update({ current_flow_id: null, current_node_id: null }).eq('id', dbContact.id);
                      console.log('✅ Fluxo de automação concluído para este contato.');
                      break;
                    }

                    if (node.data?.type === 'add_tag') {
                      const tagText = node.data?.content;
                      if (tagText) {
                        const { data: currentContact } = await supabase.from('contacts').select('labels').eq('id', dbContact.id).single();
                        const currentLabels = currentContact?.labels || [];
                        if (!currentLabels.includes(tagText)) {
                          await supabase.from('contacts').update({ labels: [...currentLabels, tagText] }).eq('id', dbContact.id);
                          console.log(`🏷️ Tag ${tagText} adicionada ao lead!`);
                        }
                      }
                      
                      // Avança
                      const nextEdge = flowData.edges?.find((e: any) => e.source === currentNodeId);
                      currentNodeId = nextEdge ? nextEdge.target : null;
                      await supabase.from('contacts').update({ current_node_id: currentNodeId }).eq('id', dbContact.id);
                    } 
                    else if (node.data?.type === 'human_handoff') {
                      await supabase.from('contacts').update({ bot_paused: true }).eq('id', dbContact.id);
                      console.log(`🧑‍💻 Transbordo humano ativado para o lead! Bot pausado.`);
                      
                      // Avança o nó atual para quando o bot for reativado ele continuar de onde parou (se houver próximo)
                      const nextEdge = flowData.edges?.find((e: any) => e.source === currentNodeId);
                      currentNodeId = nextEdge ? nextEdge.target : null;
                      await supabase.from('contacts').update({ current_node_id: currentNodeId }).eq('id', dbContact.id);
                      
                      // Interrompe o processamento automático
                      break;
                    }
                    else if (node.data?.type === 'delay') {
                      const delaySec = node.data?.delay_seconds || 5;
                      console.log(`⏳ Aplicando delay de ${delaySec} segundos...`);
                      
                      // Limite de segurança para Serverless (max 15s)
                      const safeDelay = Math.min(delaySec, 15);
                      await new Promise(resolve => setTimeout(resolve, safeDelay * 1000));
                      
                      const nextEdge = flowData.edges?.find((e: any) => e.source === currentNodeId);
                      currentNodeId = nextEdge ? nextEdge.target : null;
                      await supabase.from('contacts').update({ current_node_id: currentNodeId }).eq('id', dbContact.id);
                    }
                    else if (['message', 'input_name', 'input_email', 'offer_choices'].includes(node.data?.type)) {
                      // Formata a mensagem. Se o conteúdo estiver vazio, usa fallbacks inteligentes.
                      let messageContent = node.data?.content || '';
                      
                      // Fallback para nós sem conteúdo configurado
                      if (!messageContent.trim()) {
                        const fallbacks: Record<string, string> = {
                          'message': 'Olá! 👋',
                          'input_name': 'Qual é o seu nome?',
                          'input_email': 'Qual é o seu e-mail?',
                          'offer_choices': 'Escolha uma das opções abaixo:'
                        };
                        messageContent = fallbacks[node.data?.type] || 'Olá!';
                      }
                      
                      if (node.data?.type === 'offer_choices' && node.data?.options?.length > 0) {
                        messageContent += '\n\nResponda com o número da opção desejada:\n';
                        node.data.options.forEach((opt: string, idx: number) => {
                          messageContent += `${idx + 1} - ${opt}\n`;
                        });
                      }
                      
                      if (node.data?.type === 'schedule_appointment') {
                        const { data: calConn } = await supabase.from('calendar_connections').select('access_token').eq('organization_id', dbContact.organization_id).eq('provider', 'google').maybeSingle();
                        if (calConn?.access_token) {
                          try {
                            const slots = await getFreeSlots(calConn.access_token);
                            if (slots.length > 0) {
                              messageContent += '\n\nResponda com o número do horário desejado:\n';
                              slots.forEach((s: any, idx: number) => {
                                messageContent += `${idx + 1} - ${s.label}\n`;
                              });
                            } else {
                              messageContent = 'Desculpe, não tenho horários livres no momento. Tente novamente mais tarde.';
                            }
                          } catch (e) {
                            messageContent = 'Desculpe, ocorreu um erro ao consultar minha agenda.';
                          }
                        } else {
                          messageContent = 'Desculpe, meu calendário não está conectado no momento.';
                        }
                      }

                      console.log(`🤖 Bot enviando: ${messageContent}`);

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
                          text: { preview_url: false, body: messageContent }
                        })
                      });

                      const sendData = await sendRes.json();
                      if (!sendRes.ok) {
                        console.error('❌ Erro ao enviar mensagem via Graph API:', JSON.stringify(sendData));
                        // DUMP ERROR TO DB SO WE CAN SEE IT
                        await supabase.from('messages').insert([{
                          contact_id: dbContact.id,
                          organization_id: dbContact.organization_id,
                          wa_message_id: 'error-' + Date.now(),
                          direction: 'outbound',
                          type: 'text',
                          content: 'ERRO META API: ' + JSON.stringify(sendData)
                        }]);
                      }
                      if (sendData.messages?.[0]?.id) {
                        await supabase.from('messages').insert([{
                          contact_id: dbContact.id,
                          organization_id: dbContact.organization_id,
                          wa_message_id: sendData.messages[0].id,
                          direction: 'outbound',
                          type: 'text',
                          content: messageContent
                        }]);
                      }
                      
                      // Se o nó exige resposta do usuário, paramos o loop para aguardar a próxima mensagem real
                      if (['input_name', 'input_email', 'offer_choices', 'schedule_appointment'].includes(node.data?.type)) {
                        shouldProcessNextNode = false;
                        console.log(`⏳ Bot aguardando resposta do usuário para avançar (Nó: ${node.data?.type})...`);
                        // Salva o nó atual no banco para que a próxima mensagem saiba de onde continuar
                        await supabase.from('contacts').update({ current_node_id: currentNodeId }).eq('id', dbContact.id);
                      } else {
                        // É apenas 'message', avança para o próximo
                        const nextEdge = flowData.edges?.find((e: any) => e.source === currentNodeId);
                        currentNodeId = nextEdge ? nextEdge.target : null;
                        await supabase.from('contacts').update({ current_node_id: currentNodeId }).eq('id', dbContact.id);
                      }
                    } else {
                      // Tipo desconhecido, avança
                      const nextEdge = flowData.edges?.find((e: any) => e.source === currentNodeId);
                      currentNodeId = nextEdge ? nextEdge.target : null;
                      await supabase.from('contacts').update({ current_node_id: currentNodeId }).eq('id', dbContact.id);
                    }
                    
                    if (!currentNodeId) {
                      await supabase.from('contacts').update({ current_flow_id: null, current_node_id: null }).eq('id', dbContact.id);
                      console.log('✅ Fluxo de automação concluído.');
                    }
                  }
                }
              } catch (autoErr) {
                console.error('Erro no fluxo de automação automática:', autoErr);
              }
            }
          }
          
          if (change.value.statuses) {
            // Atualização de Status (Entregue, Lido, Falha)
            const status = change.value.statuses[0];
            console.log(`✓ Status da mensagem ${status.id}: ${status.status}`);
            
            if (status.errors) {
              console.error(`❌ Erro detalhado do WhatsApp para a mensagem ${status.id}:`, JSON.stringify(status.errors, null, 2));
            }

            // Atualiza o status no banco
            await supabase
              .from('messages')
              .update({ status: status.status })
              .eq('wa_message_id', status.id);
          }
        }
      }
      return NextResponse.json({ status: 'success' }, { status: 200 });
    } else {
      return new NextResponse('Not a WhatsApp Event', { status: 404 });
    }
  } catch (error) {
    console.error('Erro ao processar Webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
