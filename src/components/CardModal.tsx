'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useCRMStore } from '@/store/useCRMStore';
import { createClient } from '@/utils/supabase/client';

export function CardModal() {
  const { contacts, activeContactId, closeModal, toggleBotPaused } = useCRMStore();
  const [activeTab, setActiveTab] = useState<'chat' | 'perfil' | 'agendamento'>('chat');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [quickReplies, setQuickReplies] = useState<any[]>([]);
  const [filteredReplies, setFilteredReplies] = useState<any[]>([]);
  
  // Schedule state
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleMessage, setScheduleMessage] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const supabase = createClient();

  // Derive contact from contacts array (no hooks after this)
  const contact = useMemo(() => {
    if (!activeContactId) return null;
    return contacts.find((c) => c.id === activeContactId) || null;
  }, [contacts, activeContactId]);

  // Fetch messages function
  const fetchMessages = useCallback(async () => {
    if (!activeContactId) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('contact_id', activeContactId)
      .order('timestamp', { ascending: true });
    if (data) setMessages(data);
  }, [activeContactId]);

  // ALL useEffect hooks MUST be before any conditional return
  useEffect(() => {
    if (activeContactId && activeTab === 'chat') {
      fetchMessages();
      
      // Subscribe to real-time new messages
      const channel = supabase
        .channel(`messages-${activeContactId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `contact_id=eq.${activeContactId}` }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeContactId, activeTab, fetchMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (activeContactId && activeTab === 'chat' && contact) {
      const fetchQuickReplies = async () => {
        const { data } = await supabase.from('quick_replies').select('*').eq('organization_id', contact.organization_id);
        if (data) setQuickReplies(data);
      };
      fetchQuickReplies();
    }
  }, [activeContactId, activeTab, contact]);

  // Reset state when modal closes
  useEffect(() => {
    if (!activeContactId) {
      setMessages([]);
      setNewMessage('');
      setQuickReplies([]);
      setFilteredReplies([]);
      setActiveTab('chat');
    }
  }, [activeContactId]);

  // NOW we can do conditional returns — all hooks are above
  if (!activeContactId || !contact) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    
    if (val.startsWith('/')) {
      const search = val.toLowerCase();
      setFilteredReplies(quickReplies.filter(qr => qr.shortcut.toLowerCase().includes(search) || qr.shortcut.toLowerCase().includes(val.substring(1).toLowerCase())));
    } else {
      setFilteredReplies([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    setFilteredReplies([]);
    
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: activeContactId,
          phone: contact.phone,
          text: newMessage,
          organization_id: contact.organization_id
        })
      });
      
      if (res.ok) {
        setNewMessage('');
      } else {
        console.error('Falha ao enviar');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleScheduleMessage = async () => {
    if (!scheduleDate || !scheduleTime || !scheduleMessage.trim() || scheduling || !contact) return;
    setScheduling(true);

    try {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
      const res = await fetch('/api/messages/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: activeContactId,
          organization_id: contact.organization_id,
          content: scheduleMessage,
          scheduled_at: scheduledDateTime.toISOString(),
        }),
      });

      if (res.ok) {
        setScheduleMessage('');
        setScheduleDate('');
        setScheduleTime('');
        alert('Mensagem agendada com sucesso!');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Erro ao agendar: ${data.error || 'Falha na requisição'}`);
      }
    } catch (err) {
      console.error('Erro ao agendar:', err);
      alert('Erro inesperado ao agendar mensagem.');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem'
      }}
      onClick={closeModal}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '800px',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()} // Evita fechar ao clicar dentro
      >
        {/* Header */}
        <header style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{contact?.name?.charAt(0) || '?'}</span>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {contact?.name || 'Desconhecido'}
                {contact.bot_paused ? (
                  <span style={{ fontSize: '0.7rem', background: 'rgba(255, 69, 58, 0.2)', color: '#FF453A', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255, 69, 58, 0.5)' }}>Atendimento Humano</span>
                ) : (
                  <span style={{ fontSize: '0.7rem', background: 'rgba(48, 209, 88, 0.2)', color: '#30D158', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(48, 209, 88, 0.5)' }}>Bot Ativo</span>
                )}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{contact.phone}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => toggleBotPaused(contact.id, !contact.bot_paused)}
              className="btn"
              style={{
                background: contact.bot_paused ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255, 69, 58, 0.2)',
                color: contact.bot_paused ? '#30D158' : '#FF453A',
                border: `1px solid ${contact.bot_paused ? 'rgba(48, 209, 88, 0.5)' : 'rgba(255, 69, 58, 0.5)'}`,
                padding: '6px 12px',
                fontSize: '0.85rem'
              }}
            >
              {contact.bot_paused ? 'Devolver para Bot' : 'Assumir Atendimento'}
            </button>
            <button 
              className="btn btn-glass"
              style={{ padding: '8px', borderRadius: '50%' }}
              onClick={closeModal}
            >
              ✕
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            style={{
              flex: 1, padding: '1rem', background: 'transparent', border: 'none', color: 'white',
              borderBottom: activeTab === 'chat' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer', opacity: activeTab === 'chat' ? 1 : 0.6
            }}
            onClick={() => setActiveTab('chat')}
          >
            Chat API
          </button>

          <button
            style={{
              flex: 1, padding: '1rem', background: 'transparent', border: 'none', color: 'white',
              borderBottom: activeTab === 'agendamento' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer', opacity: activeTab === 'agendamento' ? 1 : 0.6
            }}
            onClick={() => setActiveTab('agendamento')}
          >
            Agendamento
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          
          {activeTab === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                {messages.length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nenhuma mensagem ainda.</p>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} style={{ 
                      alignSelf: msg.direction === 'inbound' ? 'flex-start' : 'flex-end', 
                      background: msg.direction === 'inbound' ? 'rgba(255,255,255,0.05)' : 'var(--accent-primary)', 
                      padding: '0.8rem', 
                      borderRadius: msg.direction === 'inbound' ? '12px 12px 12px 0' : '12px 12px 0 12px', 
                      maxWidth: '80%',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                      <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginTop: '4px', textAlign: 'right' }}>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                        {msg.direction === 'outbound' && ` • ${msg.status}`}
                      </span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
                {filteredReplies.length > 0 && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '8px', overflow: 'hidden', zIndex: 10, boxShadow: '0 -4px 12px rgba(0,0,0,0.5)' }}>
                    {filteredReplies.map(qr => (
                      <div 
                        key={qr.id} 
                        onClick={() => { setNewMessage(qr.content); setFilteredReplies([]); }}
                        style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <strong style={{ color: 'var(--accent-primary)', marginRight: '8px', minWidth: '80px' }}>{qr.shortcut}</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{qr.content}</span>
                      </div>
                    ))}
                  </div>
                )}
                <input 
                  type="text" 
                  placeholder="Digite sua mensagem ou / para atalhos..." 
                  className="input" 
                  style={{ flex: 1 }} 
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button className="btn btn-primary" onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          )}



          {activeTab === 'agendamento' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Programe uma mensagem para ser enviada automaticamente no futuro.</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Data</label>
                  <input type="date" className="input" style={{ width: '100%' }} value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Hora</label>
                  <input type="time" className="input" style={{ width: '100%' }} value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Mensagem</label>
                <textarea className="input" rows={4} style={{ width: '100%', resize: 'none' }} placeholder="Escreva a mensagem a ser agendada..." value={scheduleMessage} onChange={e => setScheduleMessage(e.target.value)}></textarea>
              </div>
              <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={handleScheduleMessage} disabled={scheduling || !scheduleDate || !scheduleTime || !scheduleMessage.trim()}>
                {scheduling ? 'Agendando...' : 'Agendar Envio'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
