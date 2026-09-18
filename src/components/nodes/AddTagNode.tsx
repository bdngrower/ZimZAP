import React from 'react';
import { BaseNode } from './BaseNode';
import { Tag } from 'lucide-react';
import { NodeProps } from 'reactflow';

export function AddTagNode({ data, selected }: NodeProps) {
  const content = data.content || 'Nenhuma tag definida';
  const hasWarning = !data.content || data.content.trim() === '';

  return (
    <BaseNode
      title="Adicionar Tag"
      icon={Tag}
      color="#ec4899" // pink
      selected={selected}
      status={hasWarning ? 'warning' : 'default'}
    >
      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
        {content}
      </div>
    </BaseNode>
  );
}
