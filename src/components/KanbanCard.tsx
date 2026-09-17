'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Contact, useCRMStore } from '@/store/useCRMStore';

interface KanbanCardProps {
  contact: Contact;
}

export function KanbanCard({ contact }: KanbanCardProps) {
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
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
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
        boxShadow: isDragging ? '0 10px 25px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: isDragging ? 999 : 1,
        touchAction: 'none' // Previne scroll no mobile durante drag
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColors.text }}></div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusColors.text }}>
            {contact.status.toUpperCase()}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🕒</span> {timeString}
        </span>
      </div>
      
      <h4 style={{ margin: '0 0 0.5rem 0' }}>{contact.name}</h4>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
        {contact.phone}
      </p>
    </div>
  );
}
