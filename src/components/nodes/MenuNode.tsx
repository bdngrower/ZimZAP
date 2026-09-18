import { Handle, Position } from 'reactflow';

export function MenuNode({ data, isConnectable }: any) {
  return (
    <div style={{
      background: 'rgba(20,20,20,0.9)',
      border: '1px solid rgba(255,255,255,0.2)',
      padding: '10px 15px',
      borderRadius: '8px',
      minWidth: '200px',
      color: 'white',
      fontSize: '12px'
    }}>
      {/* Input Handle (Left) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        isConnectable={isConnectable} 
        style={{ background: '#555' }}
      />
      
      <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffb347' }}>
        🔀 Oferecer Escolhas
      </div>
      <div style={{ marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
        {data.content || 'Faça uma pergunta...'}
      </div>

      {/* Dynamic Handles for Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {data.options && data.options.length > 0 ? (
          data.options.map((opt: string, index: number) => (
            <div key={index} style={{ 
              background: 'rgba(255,255,255,0.1)', 
              padding: '6px', 
              borderRadius: '4px',
              position: 'relative',
              textAlign: 'right'
            }}>
              <span>{opt}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={`option-${index}`}
                style={{ top: '50%', right: '-15px', background: '#4caf50' }}
                isConnectable={isConnectable}
              />
            </div>
          ))
        ) : (
          <div style={{ fontSize: '10px', color: '#888' }}>Nenhuma opção adicionada</div>
        )}

        {/* Invalid Response Fallback */}
        <div style={{
          marginTop: '4px',
          background: 'rgba(255,69,58,0.1)',
          border: '1px dashed rgba(255,69,58,0.4)',
          padding: '6px',
          borderRadius: '4px',
          position: 'relative',
          textAlign: 'right',
          color: 'rgba(255,255,255,0.8)'
        }}>
          <span>Em caso de resposta inválida</span>
          <Handle
            type="source"
            position={Position.Right}
            id="fallback"
            style={{ top: '50%', right: '-15px', background: '#FF453A' }}
            isConnectable={isConnectable}
          />
        </div>
      </div>
    </div>
  );
}
