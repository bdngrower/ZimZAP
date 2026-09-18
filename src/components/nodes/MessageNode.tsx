import React from 'react';
import { BaseNode } from './BaseNode';
import { MessageSquare } from 'lucide-react';
import { NodeProps } from 'reactflow';

export function MessageNode({ data, selected }: NodeProps) {
  const content = data.content || 'Nenhuma mensagem configurada';
  const hasWarning = !data.content || data.content.trim() === '';

  return (
    <BaseNode
      title="Enviar Mensagem"
      icon={MessageSquare}
      color="#3b82f6" // blue
      selected={selected}
      status={hasWarning ? 'warning' : 'default'}
    >
      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {content}
      </div>
    </BaseNode>
  );
}
