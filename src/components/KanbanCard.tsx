'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Contact, useCRMStore } from '@/store/useCRMStore';

interface KanbanCardProps {
  contact: Contact;
  forceOverlay?: boolean;
}

export function KanbanCard({ contact, forceOverlay = false }: KanbanCardProps) {
  const openModal = useCRMStore((state) => state.openModal);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !forceOverlay ? 0.3 : 1, // original semi-transparente
    cursor: forceOverlay ? 'grabbing' : 'grab',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return { bg: 'rgba(139, 92, 246, 0.2)', text: 'var(--accent-primary)' };
      case 'negotiating':
        return { bg: 'rgba(245, 158, 11, 0.2)', text: 'var(--warning)' };
      case 'won':
        return { bg: 'rgba(16, 185, 129, 0.2)', text: 'var(--success)' };
      default:
        return { bg: 'rgba(255,255,255,0.1)', text: 'white' };
    }
  };

  const statusColors = getStatusColor(contact.status);

  // Formata o horário da última atividade (Ex: "10:42" ou "Ontem")
  const dateObj = new Date(contact.updated_at || contact.created_at);
  const timeString = isNaN(dateObj.getTime())
    ? ''
    : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="kanban-card"
      onClick={(e) => {
        // Se estiver arrastando, não abre o modal
        if (isDragging) return;
        openModal(contact.id);
      }}
      style={{
        ...style,
        padding: '1.25rem',
        backgroundColor: 'var(--surface-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        boxShadow: forceOverlay 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)' 
          : '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: forceOverlay ? 9999 : 1,
        touchAction: 'none' // Previne scroll no mobile durante drag
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {contact.name}
        </h4>
        <button 
          onPointerDown={(e) => {
            e.stopPropagation();
            openModal(contact.id);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.2)', 
            color: 'var(--text-primary)', 
            cursor: 'pointer',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          💬 Chat
        </button>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
        {contact.phone}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '4px 8px',
            background: statusColors.bg,
            color: statusColors.text,
            borderRadius: '4px',
            width: 'fit-content'
          }}
        >
          {contact.status.toUpperCase()}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Última ativ: {timeString}
        </span>
      </div>
    </div>
  );
}
