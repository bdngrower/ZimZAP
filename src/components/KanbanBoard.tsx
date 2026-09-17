'use client';

import { useEffect, useState } from 'react';
import { useCRMStore, Contact } from '@/store/useCRMStore';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';

const COLUMNS = [
  { id: 'new', title: 'Novos Leads', color: 'var(--accent-primary)' },
  { id: 'negotiating', title: 'Em Negociação', color: 'var(--warning)' },
  { id: 'won', title: 'Venda Fechada', color: 'var(--success)' },
];

export function KanbanBoard() {
  const { contacts, loading, fetchContacts, moveContact, addMockContact } = useCRMStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchContacts();
  }, [fetchContacts]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // Previne clicks acidentais como drag
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const contactId = active.id as string;
    const newStatus = over.id as string;

    const contact = contacts.find((c) => c.id === contactId);

    if (contact && contact.status !== newStatus) {
      moveContact(contactId, newStatus);
    }
  };

  if (!isMounted) return null; // Previne hydration mismatch
  if (loading) return <div style={{ padding: '2rem' }}>Carregando CRM...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Test Controls */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={addMockContact} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
          + Adicionar Lead Fake (Supabase)
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflowX: 'auto', paddingBottom: '1rem' }}>
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              contacts={contacts.filter((c) => c.status === column.id)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
