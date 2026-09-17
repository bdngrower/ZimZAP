'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Contact } from '@/store/useCRMStore';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  contacts: Contact[];
}

export function KanbanColumn({ id, title, color, contacts }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        width: '320px',
        minWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        background: isOver ? 'rgba(255,255,255,0.05)' : 'transparent',
        borderRadius: 'var(--radius-md)',
        transition: 'background 0.2s',
      }}
    >
      {/* Column Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 1rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: color,
            }}
          ></div>
          <h3 style={{ fontSize: '1rem', margin: 0 }}>{title}</h3>
        </div>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {contacts.length}
        </span>
      </div>

      {/* Cards Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <SortableContext items={contacts.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {contacts.map((contact) => (
            <KanbanCard key={contact.id} contact={contact} />
          ))}
          {contacts.length === 0 && (
            <div
              style={{
                padding: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                marginTop: '0.5rem',
              }}
            >
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Vazio</p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
