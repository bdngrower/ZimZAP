import React from 'react';
import { BaseNode } from './BaseNode';
import { User } from 'lucide-react';
import { NodeProps } from 'reactflow';

export function InputNameNode({ data, selected }: NodeProps) {
  const content = data.content || 'Salvar resposta como nome';
  const hasWarning = !data.content || data.content.trim() === '';

  return (
    <BaseNode
      title="Perguntar Nome"
      icon={User}
      color="#10b981" // emerald
      selected={selected}
      status={hasWarning ? 'warning' : 'default'}
    >
      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {content}
      </div>
    </BaseNode>
  );
}
