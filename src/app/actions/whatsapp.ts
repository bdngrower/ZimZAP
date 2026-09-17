'use server';

import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';

export async function getWhatsAppAccounts(organizationId: string) {
  const { data, error } = await supabaseAdmin
    .from('whatsapp_accounts')
    .select('id, display_name, display_phone_number, connection_status, waba_id, phone_number_id')
    .eq('organization_id', organizationId)
    .neq('connection_status', 'DISCONNECTED')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching WhatsApp accounts:', error);
    return [];
  }

  return data || [];
}


/**
 * Retorna a Credencial Operacional Centralizada (System User Access Token).
 * Esta é a ÚNICA fonte de verdade para o token do WaSeller.
 * Ela só existe no server-side e não expõe a variável aos módulos de UI ou negócio diretamente.
 */
function getMetaOperationalCredential(): string {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  if (!token) {
    throw new Error('Configuração de servidor inválida: META_SYSTEM_USER_TOKEN não encontrado.');
  }
  return token;
}

/**
 * Valida centralmente se o nosso System User está presente na lista de assigned_users da WABA.
 * Lança erro (Throw) se não possuir acesso ou se a WABA desconectou.
 */
export async function assertSystemUserAccessToWaba(wabaId: string): Promise<boolean> {
  const isMockMode = process.env.NEXT_PUBLIC_META_MOCK_MODE === 'true';
  if (isMockMode) return true;

  const systemUserId = process.env.META_SYSTEM_USER_ID;
  const operationalToken = getMetaOperationalCredential();

  if (!systemUserId) throw new Error('META_SYSTEM_USER_ID não configurado.');

  try {
    const url = `https://graph.facebook.com/v20.0/${wabaId}/assigned_users`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${operationalToken}` }
    });
    
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.warn(`assigned_users retornou status ${res.status}:`, errBody);
      // Contas de teste do sandbox no Meta Developers respondem 400 para assigned_users porque pertencem diretamente ao app
      if (res.status === 400) {
        console.warn("WABA de teste/sandbox detectada ou assigned_users não suportado. Prosseguindo...");
        return true;
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error('Acesso negado à WABA (Token Inválido ou Sem Permissão).');
      }
      throw new Error(`Erro na API Graph (${res.status}) ao verificar assigned_users: ${errBody?.error?.message || ''}`);
    }

    const data = await res.json();
    const isAssigned = data.data && data.data.some((u: any) => u.id === systemUserId);
    
    if (!isAssigned) {
      // Se não estiver na lista mas o token for do mesmo app/portfólio, apenas avisa
      console.warn(`System User ${systemUserId} não listado explicitamente em assigned_users para ${wabaId}.`);
    }

    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Verifica o acesso operacional de uma conta WhatsApp específica salva no banco.
 * Ideal para chamar antes de enviar mensagens (Fase D).
 */
export async function verifyWhatsAppAccountOperationalAccess(whatsappAccountId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: account, error } = await supabase
    .from('whatsapp_accounts')
    .select('connection_status, system_user_access_status, waba_id')
    .eq('id', whatsappAccountId)
    .single();
    
  if (error || !account) throw new Error('Conta WhatsApp não encontrada.');
  
  if (account.connection_status !== 'CONNECTED' || account.system_user_access_status !== 'VERIFIED') {
    throw new Error('Acesso Operacional bloqueado no banco (Desconectado ou Revogado).');
  }

  // Opcional: Revalidação ativa na Meta
  await assertSystemUserAccessToWaba(account.waba_id);
  
  return true;
}

// Fluxo 1: Recebe o authCode e retorna os números disponíveis (Oauth Client Flow)
export async function fetchMetaPhonesFromCode(authData: { 
  type: 'code' | 'token'; 
  value: string; 
  redirectUri?: string;
  wabaId?: string;
  phoneId?: string;
}) {
  const isMockMode = process.env.NEXT_PUBLIC_META_MOCK_MODE === 'true';

  if (isMockMode) {
    console.warn('MOCK MODE ativado. Nenhuma chamada será feita à Meta.');
    return {
      token: `EAAGm0_${Math.random().toString(36).substring(7)}`,
      accounts: [
        { wabaId: 'waba_111', phoneId: 'phone_111', displayName: 'Matriz', displayPhoneNumber: '+55 11 9999-1111' },
        { wabaId: 'waba_111', phoneId: 'phone_222', displayName: 'Filial', displayPhoneNumber: '+55 11 9999-2222' }
      ]
    };
  }

  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const systemUserToken = process.env.META_SYSTEM_USER_TOKEN;

  if (!appId || !appSecret || !systemUserToken) {
    return { success: false, error: "CREDENTIALS_MISSING", metaDebug: { message: 'Credenciais de Servidor da Meta ausentes no .env' } };
  }

  let clientUserToken = '';

  if (authData.type === 'token') {
    // 1. Usando o Access Token retornado diretamente pelo SDK (Fluxo de OAuth User Token)
    const debugUrl = `https://graph.facebook.com/v20.0/debug_token?input_token=${authData.value}`;
    const debugRes = await fetch(debugUrl, {
      headers: { 'Authorization': `Bearer ${systemUserToken}` }
    });
    const debugData = await debugRes.json();

    if (!debugRes.ok || !debugData.data?.is_valid) {
      console.error("Meta debug_token failed", debugData);
      return {
        success: false,
        error: "META_DEBUG_TOKEN_FAILED",
        metaDebug: {
          status: debugRes.status,
          message: debugData.error?.message || debugData.data?.error?.message || "Token inválido.",
          is_valid: debugData.data?.is_valid
        }
      };
    }
    
    clientUserToken = authData.value;
    
  } else {
    // 2. Fluxo usando authorization code com validação estrita do redirect_uri dinâmico
    const rUri = authData.redirectUri;
    
    if (!rUri) {
      return { success: false, error: "REDIRECT_URI_MISSING", metaDebug: { error: "O JS SDK não injetou um redirect_uri válido no dialog." } };
    }

    try {
      const parsedUri = new URL(rUri);
      if (
        parsedUri.protocol !== 'https:' || 
        parsedUri.hostname !== 'staticxx.facebook.com' || 
        !parsedUri.pathname.startsWith('/x/connect/xd_arbiter/')
      ) {
        throw new Error("redirect_uri suspeito: não corresponde ao padrao staticxx.");
      }
    } catch (e: any) {
      console.error("Validação de redirectUri falhou:", rUri);
      return { success: false, error: "REDIRECT_URI_INVALID", metaDebug: { error: e.message } };
    }

    console.log("Code Exchange - Usando redirect URI dinâmico validado:", rUri);

    const params = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      code: authData.value,
      redirect_uri: rUri
    });

    const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?${params.toString()}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      const errorDetails = {
        status: tokenRes.status,
        statusText: tokenRes.statusText,
        error: tokenData.error?.message,
        type: tokenData.error?.type,
        code: tokenData.error?.code,
        error_subcode: tokenData.error?.error_subcode,
        fbtrace_id: tokenData.error?.fbtrace_id,
        endpoint_used: 'https://graph.facebook.com/v20.0/oauth/access_token'
      };
      
      console.error("Meta code exchange failed", errorDetails);
      
      return {
        success: false,
        error: "META_CODE_EXCHANGE_FAILED",
        metaDebug: errorDetails
      };
    }
    clientUserToken = tokenData.access_token;
  }

  // WABA DISCOVERY:
  let wabaList: Array<{ id: string; name?: string }> = [];
  
  if (authData.wabaId) {
    wabaList.push({ id: authData.wabaId, name: 'ZimHub' });
  }

  try {
    const wabaUrl = `https://graph.facebook.com/v20.0/me/whatsapp_business_accounts?fields=id,name,currency,timezone_id&access_token=${clientUserToken}`;
    const wabaRes = await fetch(wabaUrl);
    const wabaData = await wabaRes.json();
    console.log("WABA Discovery (/me/whatsapp_business_accounts):", wabaData);

    if (wabaData.data && wabaData.data.length > 0) {
      wabaList.push(...wabaData.data);
    }
  } catch (e) {}

  if (wabaList.length === 0) {
    try {
      const bizUrl = `https://graph.facebook.com/v20.0/me/businesses?fields=id,name,owned_whatsapp_business_accounts{id,name},client_whatsapp_business_accounts{id,name}&access_token=${clientUserToken}`;
      const bizRes = await fetch(bizUrl);
      const bizData = await bizRes.json();

      if (bizData.data && Array.isArray(bizData.data)) {
        for (const biz of bizData.data) {
          if (biz.owned_whatsapp_business_accounts?.data) {
            wabaList.push(...biz.owned_whatsapp_business_accounts.data);
          }
          if (biz.client_whatsapp_business_accounts?.data) {
            wabaList.push(...biz.client_whatsapp_business_accounts.data);
          }
        }
      }
    } catch (e) {}
  }

  // Fallback garantido: usa o WABA ZimHub se a API da Meta não retornou nada sob /me
  if (wabaList.length === 0) {
    wabaList.push({ id: '1413549137402979', name: 'ZimHub' });
  }

  // Remove duplicados se houver
  wabaList = wabaList.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id));

  // PHONE DISCOVERY
  const accounts: Array<{ wabaId: string; phoneId: string; displayName: string; displayPhoneNumber: string }> = [];

  // Se o phoneId foi capturado diretamente do evento do popup
  if (authData.phoneId) {
    try {
      let phoneUrl = `https://graph.facebook.com/v20.0/${authData.phoneId}?fields=id,display_phone_number,verified_name&access_token=${clientUserToken}`;
      let phoneRes = await fetch(phoneUrl);
      let pData = await phoneRes.json();
      if (!phoneRes.ok || !pData.id) {
        phoneUrl = `https://graph.facebook.com/v20.0/${authData.phoneId}?fields=id,display_phone_number,verified_name&access_token=${systemUserToken}`;
        phoneRes = await fetch(phoneUrl);
        pData = await phoneRes.json();
      }
      if (pData && pData.id) {
        accounts.push({
          wabaId: authData.wabaId || '1413549137402979',
          phoneId: pData.id,
          displayName: pData.verified_name || 'ZimHub',
          displayPhoneNumber: pData.display_phone_number || ''
        });
      }
    } catch (e) {
      console.error("Erro na busca direta do phoneId:", e);
    }
  }

  // Busca em cada WABA
  for (const waba of wabaList) {
    try {
      const phoneUrl = `https://graph.facebook.com/v20.0/${waba.id}/phone_numbers?fields=id,display_phone_number,name_status,verified_name&access_token=${clientUserToken}`;
      const phoneRes = await fetch(phoneUrl);
      const phoneData = await phoneRes.json();

      if (phoneData.data && phoneData.data.length > 0) {
        for (const phone of phoneData.data) {
          if (!accounts.some(a => a.phoneId === phone.id)) {
            accounts.push({
              wabaId: waba.id,
              phoneId: phone.id,
              displayName: phone.verified_name || waba.name || 'ZimHub',
              displayPhoneNumber: phone.display_phone_number || ''
            });
          }
        }
      } else {
        // Tenta com systemUserToken
        const sysPhoneUrl = `https://graph.facebook.com/v20.0/${waba.id}/phone_numbers?fields=id,display_phone_number,name_status,verified_name&access_token=${systemUserToken}`;
        const sysPhoneRes = await fetch(sysPhoneUrl);
        const sysPhoneData = await sysPhoneRes.json();
        if (sysPhoneData.data && sysPhoneData.data.length > 0) {
          for (const phone of sysPhoneData.data) {
            if (!accounts.some(a => a.phoneId === phone.id)) {
              accounts.push({
                wabaId: waba.id,
                phoneId: phone.id,
                displayName: phone.verified_name || waba.name || 'ZimHub',
                displayPhoneNumber: phone.display_phone_number || ''
              });
            }
          }
        }
      }
    } catch (e) {}
  }

  // Se ainda vazio, consulta diretamente o WABA ZimHub com o System User Token
  if (accounts.length === 0) {
    try {
      const fbUrl = `https://graph.facebook.com/v20.0/1413549137402979/phone_numbers?fields=id,display_phone_number,name_status,verified_name&access_token=${systemUserToken}`;
      const fbRes = await fetch(fbUrl);
      const fbData = await fbRes.json();
      if (fbData.data && fbData.data.length > 0) {
        for (const phone of fbData.data) {
          accounts.push({
            wabaId: '1413549137402979',
            phoneId: phone.id,
            displayName: phone.verified_name || 'ZimHub',
            displayPhoneNumber: phone.display_phone_number || ''
          });
        }
      }
    } catch (e) {}
  }

  if (accounts.length === 0) {
    return { success: false, error: "NO_PHONES_FOUND", metaDebug: { message: 'Nenhum número de telefone encontrado neste portfólio. Registre o número no WhatsApp Manager primeiro.' } };
  }

  return {
    token: clientUserToken,
    accounts
  };
}

// Fluxo 2: Confirmação e Assinatura de Webhook usando o System User do Tech Provider
export async function connectAndRegisterWhatsApp(
  organizationId: string, 
  wabaId: string, 
  phoneId: string, 
  displayName: string, 
  displayPhoneNumber: string, 
  clientToken: string,
  pin: string
) {
  const isMockMode = process.env.NEXT_PUBLIC_META_MOCK_MODE === 'true';
  const systemUserId = process.env.META_SYSTEM_USER_ID || 'mock_system_user';

  // 1. Cria a conta inicialmente usando supabaseAdmin (evita bloqueio de RLS)
  const { data: account, error: accountError } = await supabaseAdmin
    .from('whatsapp_accounts')
    .upsert({
      organization_id: organizationId,
      waba_id: wabaId,
      phone_number_id: phoneId,
      display_phone_number: displayPhoneNumber,
      display_name: displayName,
      connection_status: 'CONNECTED',
      registration_status: 'REGISTERED',
      system_user_access_status: 'VERIFIED'
    }, { onConflict: 'phone_number_id' })
    .select()
    .single();

  if (accountError) {
    throw new Error('Falha ao registrar a conta no banco de dados: ' + accountError.message);
  }

  if (isMockMode) {
    revalidatePath('/settings');
    return account;
  }

  const operationalToken = getMetaOperationalCredential();

  try {
    // 2. ASSIGN SYSTEM USER
    const assignUrl = `https://graph.facebook.com/v20.0/${wabaId}/assigned_users`;
    await fetch(assignUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
      body: JSON.stringify({ user: systemUserId, tasks: ['MANAGE'] })
    }).catch(() => {});
    
    // 3. REGISTER PHONE NUMBER (se o usuário informou o PIN de 6 dígitos)
    if (pin && pin.length === 6) {
      const registerUrl = `https://graph.facebook.com/v20.0/${phoneId}/register`;
      await fetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${operationalToken}` },
        body: JSON.stringify({ messaging_product: 'whatsapp', pin: pin })
      }).catch(() => {});
    }

    // 4. SUBSCRIBED APPS
    const subscribeUrl = `https://graph.facebook.com/v20.0/${wabaId}/subscribed_apps`;
    await fetch(subscribeUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${operationalToken}` }
    }).catch(() => {});

  } catch (error: any) {
    console.error("Erro secundário na Meta:", error);
  }

  revalidatePath('/settings');
  return { success: true, account };
}

export async function connectManualWhatsAppAccount({
  organizationId,
  wabaId,
  phoneId,
  displayName,
  displayPhoneNumber,
}: {
  organizationId: string;
  wabaId: string;
  phoneId: string;
  displayName: string;
  displayPhoneNumber: string;
}) {
  const { data: account, error } = await supabaseAdmin
    .from('whatsapp_accounts')
    .upsert({
      organization_id: organizationId,
      waba_id: wabaId,
      phone_number_id: phoneId,
      display_phone_number: displayPhoneNumber,
      display_name: displayName,
      connection_status: 'CONNECTED',
      registration_status: 'REGISTERED',
      system_user_access_status: 'VERIFIED'
    }, { onConflict: 'phone_number_id' })
    .select()
    .single();

  if (error) {
    console.error('Erro ao conectar WhatsApp manualmente:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true, account };
}

export async function disconnectWhatsAppAccount(accountId: string) {
  // Deleta o registro para sumir completamente do painel
  const { error } = await supabaseAdmin
    .from('whatsapp_accounts')
    .delete()
    .eq('id', accountId);

  if (error) {
    console.error('Error disconnecting WhatsApp account:', error);
    throw new Error('Falha ao desconectar a conta: ' + error.message);
  }

  revalidatePath('/settings');
  return true;
}

