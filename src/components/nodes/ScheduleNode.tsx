import React, { memo } from 'react';
import { BaseNode } from './BaseNode';
import { Calendar } from 'lucide-react';
import { NodeProps } from 'reactflow';

export const ScheduleNode = memo(({ data, selected }: NodeProps) => {
  const duration = data.duration || '30 min';

  return (
    <BaseNode
      title="Agendamento Inteligente"
      icon={Calendar}
      color="#8b5cf6" // purple
      selected={selected}
    >
      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        Oferecer slots de {duration}
      </div>
    </BaseNode>
  );
});

ScheduleNode.displayName = 'ScheduleNode';
