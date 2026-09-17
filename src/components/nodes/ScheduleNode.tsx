import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const ScheduleNode = memo(({ data, isConnectable }: any) => {
  return (
    <div style={{
      background: 'rgba(20, 20, 20, 0.9)',
      border: '1px solid var(--accent-primary)',
      borderRadius: '8px',
      minWidth: '200px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      overflow: 'hidden'
    }}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} style={{ background: '#555' }} />
      
      <div style={{ 
        background: 'var(--accent-primary)', 
        padding: '8px 12px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>📅</span> Agendamento Inteligente
      </div>
      
      <div style={{ padding: '12px' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Duração: <strong>{data.duration || '30 min'}</strong>
        </p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
          O robô vai oferecer horários da sua agenda conectada.
        </p>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} style={{ background: '#555' }} />
    </div>
  );
});

ScheduleNode.displayName = 'ScheduleNode';
