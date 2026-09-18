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
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { createClient } from '@/utils/supabase/client';
import { KANBAN_STAGES } from '@/store/useCRMStore';

const COLUMNS = [
  { id: 'new', title: 'Novos Leads', color: 'var(--accent-primary)' },
  { id: 'negotiating', title: 'Em Negociação', color: 'var(--warning)' },
  { id: 'won', title: 'Venda Fechada', color: 'var(--success)' },
];

export function KanbanBoard() {
  const { contacts, loading, fetchContacts, moveContact, currentOrganizationId } = useCRMStore();
  const [isMounted, setIsMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    // Drop inválido (fora do board)
    if (!over) return;

    const contactId = active.id as string;
    let targetId = over.id as string;

    // Acha o card arrastado
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    let newStatus = targetId;

    // Se o alvo não for uma coluna válida (KANBAN_STAGES), vamos descobrir de onde veio
    if (!KANBAN_STAGES.includes(newStatus as any)) {
      // Significa que soltou sobre outro card (o over é o ID do card alvo)
      const targetContact = contacts.find((c) => c.id === targetId);
      if (targetContact && KANBAN_STAGES.includes(targetContact.status as any)) {
        newStatus = targetContact.status;
      } else {
        // Alvo inválido (soltou em lugar desconhecido)
        return; 
      }
    }

    if (contact.status !== newStatus) {
      moveContact(contactId, newStatus);
    }
  };

  const activeContact = activeId ? contacts.find((c) => c.id === activeId) : null;

  if (!isMounted) return null; // Previne hydration mismatch
  if (loading) return <div style={{ padding: '2rem' }}>Carregando CRM...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflowX: 'auto', overflowY: 'hidden', paddingBottom: '1rem' }}>
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
        <DragOverlay>
          {activeContact ? <KanbanCard contact={activeContact} forceOverlay={true} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
