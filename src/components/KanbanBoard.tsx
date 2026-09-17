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
import { createClient } from '@/utils/supabase/client';

const COLUMNS = [
  { id: 'new', title: 'Novos Leads', color: 'var(--accent-primary)' },
  { id: 'negotiating', title: 'Em Negociação', color: 'var(--warning)' },
  { id: 'won', title: 'Venda Fechada', color: 'var(--success)' },
];

export function KanbanBoard() {
  const { contacts, loading, fetchContacts, moveContact, addMockContact, currentOrganizationId } = useCRMStore();
  const [isMounted, setIsMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setIsMounted(true);
    fetchContacts();

    // Inscrição Realtime para atualizar os contatos quando chegarem mensagens ou novos leads
    const channel = supabase
      .channel('kanban-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
        fetchContacts();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchContacts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

    // Drop inválido (fora do board)
    if (!over) return;

    const contactId = active.id as string;
    let newStatus = over.id as string;

    // Verifica se soltou direto na coluna
    const isColumn = COLUMNS.some((col) => col.id === newStatus);
    
    if (!isColumn) {
      // Se não é coluna, soltou sobre outro card. Pegamos o status desse card alvo.
      const targetContact = contacts.find((c) => c.id === newStatus);
      if (targetContact) {
        newStatus = targetContact.status;
      } else {
        return; // Alvo não reconhecido
      }
    }

    const contact = contacts.find((c) => c.id === contactId);

    if (contact && contact.status !== newStatus) {
      moveContact(contactId, newStatus);
    }
  };

  if (!isMounted) return null; // Previne hydration mismatch
  if (loading) return <div style={{ padding: '2rem' }}>Carregando CRM...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Test Controls Removido para produção */}

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
