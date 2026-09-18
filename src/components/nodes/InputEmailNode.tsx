import React from 'react';
import { BaseNode } from './BaseNode';
import { Mail } from 'lucide-react';
import { NodeProps } from 'reactflow';

export function InputEmailNode({ data, selected }: NodeProps) {
  const content = data.content || 'Salvar resposta como e-mail';
  const hasWarning = !data.content || data.content.trim() === '';

  return (
    <BaseNode
      title="Perguntar E-mail"
      icon={Mail}
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
