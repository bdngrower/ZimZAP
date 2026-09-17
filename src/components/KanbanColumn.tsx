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
        background: isOver ? 'var(--surface-raised)' : 'var(--surface-base)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        transition: 'all 0.2s ease',
        overflow: 'hidden'
      }}
    >
      {/* Column Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--surface-elevated)'
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.75rem', minHeight: '150px' }}>
        <SortableContext items={contacts.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {contacts.map((contact) => (
            <KanbanCard key={contact.id} contact={contact} />
          ))}
          {contacts.length === 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                height: '100%'
              }}
            >
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nenhum contato</p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
