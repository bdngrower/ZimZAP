import React, { memo } from 'react';
import { BaseNode } from './BaseNode';
import { ListTree } from 'lucide-react';
import { Handle, Position, NodeProps } from 'reactflow';

export const MenuNode = memo(({ data, isConnectable, selected }: NodeProps) => {
  const options = data.options || [];
  const hasWarning = options.length === 0;

  return (
    <BaseNode
      title="Oferecer Escolhas"
      icon={ListTree}
      color="#f97316" // orange
      selected={selected}
      status={hasWarning ? 'warning' : 'default'}
      hasOutput={false} // We provide custom handles
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {options.length > 0 ? (
          options.map((opt: string, index: number) => (
            <div 
              key={index}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '6px 24px 6px 10px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                minHeight: '30px'
              }}
            >
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                {opt}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={`option-${index}`}
                isConnectable={isConnectable}
                style={{
                  width: 12,
                  height: 12,
                  background: 'var(--background-primary)',
                  border: '2px solid #f97316',
                  right: -6,
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              />
            </div>
          ))
        ) : (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '4px 0' }}>
            Nenhuma opção
          </div>
        )}

        {/* Fallback Handle */}
        <div 
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px dashed rgba(239, 68, 68, 0.3)',
            padding: '6px 24px 6px 10px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            marginTop: '4px',
            minHeight: '30px'
          }}
        >
          <span style={{ color: 'var(--danger)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Resposta inválida
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id="fallback"
            isConnectable={isConnectable}
            style={{
              width: 12,
              height: 12,
              background: 'var(--background-primary)',
              border: '2px solid var(--danger)',
              right: -6,
              top: '50%',
              transform: 'translateY(-50%)'
            }}
          />
        </div>
      </div>
    </BaseNode>
  );
});

MenuNode.displayName = 'MenuNode';
