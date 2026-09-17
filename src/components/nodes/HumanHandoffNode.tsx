import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const HumanHandoffNode = memo(({ isConnectable }: NodeProps) => {
  return (
    <div className="react-flow__node-default" style={{ 
      background: 'rgba(255, 69, 58, 0.1)', 
      border: '1px solid rgba(255, 69, 58, 0.5)',
      borderRadius: '8px',
      padding: '10px 15px',
      width: '200px',
      color: 'white',
      backdropFilter: 'blur(10px)'
    }}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} style={{ background: '#FF453A' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
        <span style={{ fontSize: '1.2rem' }}>🧑‍💻</span>
        <strong style={{ fontSize: '0.9rem', color: '#FF453A' }}>Transbordo</strong>
      </div>
      
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        Pausa o bot e envia o contato para atendimento humano.
      </div>
      
      {/* Node final, geralmente não tem saída, mas vamos deixar uma caso queiram reconectar */}
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} style={{ background: '#FF453A' }} />
    </div>
  );
});

HumanHandoffNode.displayName = 'HumanHandoffNode';
