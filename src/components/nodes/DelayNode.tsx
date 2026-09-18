import React, { memo } from 'react';
import { BaseNode } from './BaseNode';
import { Clock } from 'lucide-react';
import { NodeProps } from 'reactflow';

export const DelayNode = memo(({ data, selected }: NodeProps) => {
  const seconds = data.delay_seconds || 5;
  const hasWarning = !data.delay_seconds;

  return (
    <BaseNode
      title="Atraso (Delay)"
      icon={Clock}
      color="#f59e0b" // amber
      selected={selected}
      status={hasWarning ? 'warning' : 'default'}
    >
      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        Aguardar {seconds} {seconds === 1 ? 'segundo' : 'segundos'}
      </div>
    </BaseNode>
  );
});

DelayNode.displayName = 'DelayNode';
