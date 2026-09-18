import React from 'react';
import { Handle, Position } from 'reactflow';
import { LucideIcon } from 'lucide-react';

interface BaseNodeProps {
  id?: string;
  selected?: boolean;
  icon: LucideIcon;
  title: string;
  color?: string;
  children: React.ReactNode;
  hasInput?: boolean;
  hasOutput?: boolean; // For default output, custom outputs can be managed inside children
  status?: 'warning' | 'error' | 'default';
}

export function BaseNode({
  selected,
  icon: Icon,
  title,
  color = '#8b5cf6', // var(--brand-primary) default
  children,
  hasInput = true,
  hasOutput = true,
  status = 'default'
}: BaseNodeProps) {
  return (
    <div 
      className={`glass-card transition-all duration-200 overflow-hidden ${selected ? 'ring-2' : ''}`}
      style={{
        width: 260,
        minHeight: 80,
        border: selected ? `1px solid ${color}` : '1px solid var(--border-color, rgba(0,0,0,0.1))',
        backgroundColor: 'var(--background-secondary, #ffffff)',
        boxShadow: selected ? `0 0 0 2px ${color}40, 0 8px 16px rgba(0,0,0,0.1)` : '0 4px 6px rgba(0,0,0,0.05)',
        opacity: 0.95,
      }}
    >
      {/* Header */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          background: 'var(--background-tertiary, rgba(0,0,0,0.05))',
          borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.1))'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          borderRadius: 6,
          background: `${color}22`,
          color: color
        }}>
          <Icon size={14} />
        </div>
        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {title}
        </h4>
        
        {status === 'warning' && (
          <div title="Precisa de atenção" style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: '0.9rem' }}>
            ⚠️
          </div>
        )}
      </div>

      {/* Body / Summary */}
      <div style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        {children}
      </div>

      {/* Standard Input Handle */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            width: 12,
            height: 12,
            background: 'var(--background-primary)',
            border: `2px solid ${color}`,
            left: -6,
            top: 22, // align with header vertically
          }}
        />
      )}

      {/* Standard Output Handle (Custom nodes like Menu might hide this and render their own) */}
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            width: 12,
            height: 12,
            background: 'var(--background-primary)',
            border: `2px solid ${color}`,
            right: -6,
            top: 22,
          }}
        />
      )}
    </div>
  );
}
