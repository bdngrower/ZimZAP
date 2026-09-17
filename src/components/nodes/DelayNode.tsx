import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const DelayNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div className="react-flow__node-default" style={{ 
      background: 'rgba(20, 20, 20, 0.8)', 
      border: '1px solid var(--accent-primary)',
      borderRadius: '8px',
      padding: '10px 15px',
      width: '200px',
      color: 'white',
      backdropFilter: 'blur(10px)'
    }}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} style={{ background: 'var(--accent-primary)' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '1.2rem' }}>⏳</span>
        <strong style={{ fontSize: '0.9rem' }}>Atraso (Delay)</strong>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tempo (segundos):</label>
        <input 
          type="number" 
          defaultValue={data.delay_seconds || 5}
          onChange={(e) => {
            if (data.onChange) {
              data.onChange({ delay_seconds: parseInt(e.target.value) || 0 });
            }
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            padding: '5px',
            borderRadius: '4px',
            width: '100%'
          }}
        />
        <small style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Máx recomendado: 15s</small>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} style={{ background: 'var(--accent-primary)' }} />
    </div>
  );
});

DelayNode.displayName = 'DelayNode';
