'use client';

import { useState } from 'react';

export function MassMessaging() {
  const [step, setStep] = useState(1);

  return (
    <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0' }}>Disparos em Massa</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Envie mensagens para centenas de clientes de uma vez, sujeito às políticas do WhatsApp.</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flex: 1 }}>
        
        {/* Etapas */}
        <div style={{ width: '250px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ opacity: step >= 1 ? 1 : 0.5 }}>
              <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step >= 1 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>1</div>
                Público-Alvo
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '34px' }}>Selecione quem vai receber.</p>
            </div>
            
            <div style={{ opacity: step >= 2 ? 1 : 0.5 }}>
              <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step >= 2 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>2</div>
                Mensagem
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '34px' }}>Escreva o que será enviado.</p>
            </div>

            <div style={{ opacity: step >= 3 ? 1 : 0.5 }}>
              <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step >= 3 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>3</div>
                Revisão & Envio
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '34px' }}>Confirme os dados antes do disparo.</p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div style={{ flex: 1, paddingLeft: '1rem', display: 'flex', flexDirection: 'column' }}>
          
          {step === 1 && (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Filtrar por Etapa do CRM</label>
                <select className="input" style={{ width: '100%', maxWidth: '400px' }}>
                  <option value="all">Todas as Etapas</option>
                  <option value="new">Somente Novos Leads</option>
                  <option value="negotiating">Somente Em Negociação</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Ou filtrar por Tags Específicas</label>
                <input type="text" className="input" placeholder="Ex: vip, b2b, cliente-antigo" style={{ width: '100%', maxWidth: '400px' }} />
              </div>

              <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', maxWidth: '400px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-secondary)' }}>Público Estimado: ~234 Contatos</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Os contatos filtrados receberão sua mensagem sequencialmente, respeitando as pausas anti-spam.</p>
              </div>

              <button className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => setStep(2)}>
                Próximo Passo
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Conteúdo da Mensagem</label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Dica: Você pode usar variáveis como {'{nome}'} para chamar o cliente pelo nome.</p>
                <textarea className="input" rows={6} style={{ width: '100%', resize: 'none' }} placeholder="Olá {nome}, temos uma oferta especial para você hoje..."></textarea>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Anexar Mídia (Opcional)</label>
                <div style={{ border: '1px dashed rgba(255,255,255,0.2)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Arraste uma imagem ou clique para selecionar.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                <button className="btn btn-glass" onClick={() => setStep(1)}>Voltar</button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>Próximo Passo</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
              
              <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--accent-primary)', background: 'rgba(99, 102, 241, 0.05)' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Tudo pronto para o disparo! 🚀</h3>
                <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li><strong>Público-Alvo:</strong> Todos os contatos na etapa "Novos Leads"</li>
                  <li><strong>Mensagem:</strong> Texto formatado (sem mídia)</li>
                  <li><strong>Segurança Anti-Spam:</strong> Intervalo de 15 a 35 segundos entre cada mensagem.</li>
                  <li><strong>Custo estimado:</strong> As mensagens serão tarifadas na sua conta Meta.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                <button className="btn btn-glass" onClick={() => setStep(2)}>Voltar</button>
                <button className="btn btn-primary" style={{ background: 'var(--success)' }}>
                  ▶ Iniciar Disparo
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
