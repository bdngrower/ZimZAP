import React, { memo } from 'react';
import { BaseNode } from './BaseNode';
import { HeadphonesIcon } from 'lucide-react';
import { NodeProps } from 'reactflow';

export const HumanHandoffNode = memo(({ selected }: NodeProps) => {
  return (
    <BaseNode
      title="Transbordo Humano"
      icon={HeadphonesIcon}
      color="#ef4444" // red
      selected={selected}
      hasOutput={false} // Transbordo usually stops automation
    >
      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        Pausar automação e alertar equipe
      </div>
    </BaseNode>
  );
});

HumanHandoffNode.displayName = 'HumanHandoffNode';
