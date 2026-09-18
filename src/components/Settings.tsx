'use client';

import { useState, useEffect, useRef } from 'react';
import { useCRMStore } from '@/store/useCRMStore';
import { getWhatsAppAccounts, fetchMetaPhonesFromCode, connectAndRegisterWhatsApp, disconnectWhatsAppAccount } from '@/app/actions/whatsapp';
import { toast } from 'sonner';

// Tipagem global para o SDK do Facebook
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

export function Settings() {
  const { currentOrganizationId } = useCRMStore();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para o Modal de Seleção de Números
  const [availablePhones, setAvailablePhones] = useState<any[]>([]);
  const [tempToken, setTempToken] = useState<string>('');
  
  // Estado para o fluxo de PIN (Etapa 2 do modal)
  const [selectedPhoneForPin, setSelectedPhoneForPin] = useState<any | null>(null);
  const [pin, setPin] = useState('');

  const oauthRedirectUriRef = useRef<string | null>(null);
  const loginInProgressRef = useRef(false);
  const lastEmbeddedSignupDataRef = useRef<{ wabaId?: string; phoneId?: string } | null>(null);

  // Inicializa o SDK do Facebook
  useEffect(() => {
    // Evita carregar duplicado
    if (document.getElementById('facebook-jssdk')) return;

    window.fbAsyncInit = function() {
      window.FB.init({
        appId            : process.env.NEXT_PUBLIC_META_APP_ID || 'MOCK_APP_ID',
        autoLogAppEvents : true,
        xfbml            : true,
        version          : 'v20.0'
      });
    };

    const js = document.createElement('script');
    js.id = 'facebook-jssdk';
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    document.body.appendChild(js);

    // Listener Oficial do WA_EMBEDDED_SIGNUP
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://facebook.com") return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log("Official WA_EMBEDDED_SIGNUP Event:", {
            event: data.event,
            waba_id: data.data?.waba_id,
            phone_number_id: data.data?.phone_number_id
          });
          if (data.data?.waba_id || data.data?.phone_number_id) {
            lastEmbeddedSignupDataRef.current = {
              wabaId: data.data?.waba_id,
              phoneId: data.data?.phone_number_id
            };
          }
        }
      } catch (err) {
        // Ignora mensagens que não são JSON válido (ex: cb=...)
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (currentOrganizationId) {
      loadAccounts();
    }
  }, [currentOrganizationId]);

  const loadAccounts = async () => {
    setLoading(true);
    const data = await getWhatsAppAccounts(currentOrganizationId!);
    setAccounts(data);
    setLoading(false);
  };

  const handleConnect = () => {
    const orgId = useCRMStore.getState().currentOrganizationId;
    if (!orgId) {
      toast.error('Sem organização selecionada');
      return;
    }
    
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID;
    const isMockMode = process.env.NEXT_PUBLIC_META_MOCK_MODE === 'true';

    if (isMockMode) {
      console.warn("AVISO: MOCK MODE ativado. Simulando resposta da Meta.");
      processMetaCallback({ type: 'code', value: 'mock_auth_code_123' });
      return;
    }

    if (!appId || !configId) {
      toast.error('Erro de Configuração', { description: 'NEXT_PUBLIC_META_APP_ID ou CONFIG_ID estão ausentes no ambiente.' });
      return;
    }

    if (!window.FB) {
      toast.error('Erro', { description: 'SDK do Facebook não carregado.' });
      return;
    }
    
    if (loginInProgressRef.current) return;
    loginInProgressRef.current = true;
    oauthRedirectUriRef.current = null;
    lastEmbeddedSignupDataRef.current = null;
    
    // INSTRUMENTAÇÃO: Intercepta window.open de forma síncrona
    const originalOpen = window.open;
    window.open = function (url?: string | URL, target?: string, features?: string) {
      if (typeof url === 'string') {
        try {
          const urlObj = new URL(url);
          if (urlObj.hostname === 'www.facebook.com' && urlObj.pathname.includes('/dialog/oauth')) {
            const rUri = urlObj.searchParams.get('redirect_uri');
            if (rUri) {
              oauthRedirectUriRef.current = rUri; // Exatamente como recebido do SDK
              console.log("Captured OAuth redirect host:", new URL(rUri).hostname);
              console.log("Captured OAuth redirect URI:", rUri);
            }
          }
        } catch (e) {
          // ignora falhas de parse de outras aberturas
        }
      }
      return originalOpen.call(window, url, target, features);
    };

    // Fluxo Real do Embedded Signup
    window.FB.login((response: any) => {
      // Restaura window.open ANTES de rodar lógica assíncrona
      window.open = originalOpen;
      
      try {
        if (response.authResponse) {
          const { code, accessToken } = response.authResponse;
          
          if (accessToken) {
            processMetaCallback({ 
              type: 'token', 
              value: accessToken,
              wabaId: lastEmbeddedSignupDataRef.current?.wabaId,
              phoneId: lastEmbeddedSignupDataRef.current?.phoneId
            });
          } else if (code) {
            const captured = oauthRedirectUriRef.current;
            if (!captured) {
              console.error("OAUTH_REDIRECT_URI_NOT_CAPTURED: Interceptação do window.open falhou.");
              toast.error('Falha de segurança na captura da URI. Tente novamente.');
              return;
            }
            processMetaCallback({ 
              type: 'code', 
              value: code, 
              redirectUri: captured,
              wabaId: lastEmbeddedSignupDataRef.current?.wabaId,
              phoneId: lastEmbeddedSignupDataRef.current?.phoneId
            });
          } else {
            console.error("Nem code nem accessToken retornados pela Meta.", response.authResponse);
          }
        } else {
          console.error('Login cancelado ou não autorizado.', response);
        }
      } finally {
        loginInProgressRef.current = false;
      }
    }, {
      config_id: configId, 
      response_type: 'code',
      override_default_response_type: true,
      extras: { setup: {} }
    });
  };

  const processMetaCallback = async (authData: { 
    type: 'code' | 'token', 
    value: string, 
    redirectUri?: string,
    wabaId?: string,
    phoneId?: string
  }) => {
    setLoading(true);
    try {
      const result = await fetchMetaPhonesFromCode(authData);
      
      if (result.success === false) {
        const dbg = result.metaDebug as any;
        console.error("Meta API Error:", dbg);
        toast.error('Erro na autenticação OAuth', { 
          description: `Status: ${dbg?.status}. ${dbg?.error || dbg?.message}` 
        });
        setLoading(false);
        return;
      }
      
      const { token, accounts: phones } = result as any;
      
      if (phones.length === 1) {
        // Se só tem 1 número, já exibe direto a tela de pedir PIN para ele
        setTempToken(token);
        setSelectedPhoneForPin(phones[0]);
        setLoading(false);
      } else if (phones.length > 1) {
        // Se tiver mais de 1, exibe o modal de escolher qual número primeiro
        setTempToken(token);
        setAvailablePhones(phones);
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Falha ao buscar números autorizados pela Meta.');
      setLoading(false);
    }
  };

  const submitConnection = async () => {
    if (!pin || pin.length !== 6) {
      toast.error('Por favor, digite o PIN de exatos 6 dígitos criado no Facebook.');
      return;
    }
    setLoading(true);
    try {
      const res = await connectAndRegisterWhatsApp(
        currentOrganizationId!,
        selectedPhoneForPin.wabaId,
        selectedPhoneForPin.phoneId,
        selectedPhoneForPin.displayName,
        selectedPhoneForPin.displayPhoneNumber,
        tempToken,
        pin
      );
      
      if (res && (res as any).success === false) {
        toast.error('Erro ao registrar WhatsApp', { description: (res as any).error });
        setLoading(false);
        return;
      }
      
      // Limpa tudo e atualiza
      setAvailablePhones([]);
      setSelectedPhoneForPin(null);
      setTempToken('');
      setPin('');
      
      await loadAccounts();
      toast.success('WhatsApp registrado com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Falha ao registrar e conectar a conta de WhatsApp.');
      setLoading(false);
    }
  };



  const handleDisconnect = async (id: string) => {
    setLoading(true);
    try {
      await disconnectWhatsAppAccount(id);
      await loadAccounts();
      toast.success('Conta desconectada com sucesso.');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao desconectar conta.");
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
        
        {/* WhatsApp Accounts */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--success)' }}>📱</span> Contas WhatsApp
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }} onClick={handleConnect} disabled={loading} title="Popup Embedded Signup Oficial">
                Conectar WhatsApp
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {loading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Carregando contas...</p>
            ) : accounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Nenhum WhatsApp conectado</p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={handleConnect}>Conectar WhatsApp</button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                  A autorização usará o processo Embedded Signup oficial da Meta.
                </p>
              </div>
            ) : (
              accounts.map((account) => (
                <div key={account.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem 0' }}>{account.display_name}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{account.display_phone_number}</p>
                    <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: account.connection_status === 'CONNECTED' ? 'var(--success)' : 'var(--warning)' }}>
                      {account.connection_status}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-glass" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={handleConnect}>Reconectar</button>
                    <button 
                      className="btn btn-glass" 
                      style={{ padding: '0.4rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                      onClick={() => handleDisconnect(account.id)}
                    >
                      Desconectar
                    </button>
                  </div>
                </div>
              ))
            )}

          </div>
        </div>

      </div>


      {/* Modal Picker de Múltiplos Números (Passo 1) */}
      {availablePhones.length > 0 && !selectedPhoneForPin && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Selecione o Número</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Sua conta Meta autorizou mais de um número de WhatsApp. Qual deles você deseja conectar?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {availablePhones.map((phone, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPhoneForPin(phone)}
                  className="btn btn-glass"
                  style={{ textAlign: 'left', padding: '1rem', width: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <span style={{ fontWeight: 'bold' }}>{phone.displayName}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{phone.displayPhoneNumber}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setAvailablePhones([]); setTempToken(''); }}
              className="btn btn-glass" style={{ width: '100%' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal Input do PIN (Passo 2) */}
      {selectedPhoneForPin && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Confirme seu PIN</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Para registrar o número <b>{selectedPhoneForPin.displayPhoneNumber}</b>, digite o PIN de 6 dígitos criado no Facebook.
            </p>
            <input 
              type="text" 
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Ex: 123456"
              className="input"
              style={{ width: '100%', textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem', marginBottom: '1.5rem' }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  setSelectedPhoneForPin(null);
                  if (availablePhones.length === 1) setAvailablePhones([]);
                }}
                className="btn btn-glass" style={{ flex: 1 }}
              >
                Voltar
              </button>
              <button
                onClick={submitConnection}
                disabled={pin.length !== 6 || loading}
                className="btn btn-primary" style={{ flex: 1 }}
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

