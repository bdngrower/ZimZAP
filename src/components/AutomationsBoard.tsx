'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, { 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges, 
  Background, 
  Controls,
  MiniMap,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  MarkerType,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { createClient } from '@/utils/supabase/client';
import { useCRMStore } from '@/store/useCRMStore';
import { MenuNode } from './nodes/MenuNode';
import { DelayNode } from './nodes/DelayNode';
import { HumanHandoffNode } from './nodes/HumanHandoffNode';
import { ScheduleNode } from './nodes/ScheduleNode';
import { MessageNode } from './nodes/MessageNode';
import { InputNameNode } from './nodes/InputNameNode';
import { InputEmailNode } from './nodes/InputEmailNode';
import { AddTagNode } from './nodes/AddTagNode';
import { DefaultNodeWrapper } from './nodes/DefaultNodeWrapper';

const nodeTypes = {
  message: MessageNode,
  offer_choices: MenuNode,
  input_name: InputNameNode,
  input_email: InputEmailNode,
  add_tag: AddTagNode,
  delay: DelayNode,
  human_handoff: HumanHandoffNode,
  schedule_appointment: ScheduleNode,
  default: DefaultNodeWrapper,
};

const nodeTypesList = [
  { type: 'message', label: '💬 Enviar Mensagem' },
  { type: 'offer_choices', label: '🔀 Oferecer Escolhas' },
  { type: 'input_name', label: '👤 Perguntar Nome' },
  { type: 'input_email', label: '📧 Perguntar E-mail' },
  { type: 'add_tag', label: '🏷️ Adicionar Tag' },
  { type: 'delay', label: '⏳ Atraso (Delay)' },
  { type: 'human_handoff', label: '🧑‍💻 Transbordo Humano' },
  { type: 'schedule_appointment', label: '📅 Agendamento Inteligente' },
];

export function AutomationsBoard() {
  const [flows, setFlows] = useState<any[]>([]);
  const [activeFlow, setActiveFlow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // React Flow State
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Selected Node Editor
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const supabase = createClient();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  useEffect(() => {
    fetchFlows();
  }, []);

  useEffect(() => {
    if (activeFlow) {
      if (activeFlow.flow_data && activeFlow.flow_data.nodes) {
        setNodes(activeFlow.flow_data.nodes || []);
        setEdges(activeFlow.flow_data.edges || []);
      } else {
        setNodes([]);
        setEdges([]);
      }
      setSelectedNode(null);
    }
  }, [activeFlow]);

  const fetchFlows = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('automations').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setFlows(data);
      if (data.length > 0 && !activeFlow) setActiveFlow(data[0]);
    }
    setLoading(false);
  };

  const createFlow = async () => {
    const orgId = useCRMStore.getState().currentOrganizationId;
    if (!orgId) {
      alert('Sem organização selecionada');
      return;
    }

    const newFlow = { 
      name: 'Novo Fluxo ' + (flows.length + 1),
      organization_id: orgId,
      flow_data: { nodes: [], edges: [] }
    };

    const { data, error } = await supabase.from('automations').insert([newFlow]).select().single();
    if (!error && data) {
      setFlows([data, ...flows]);
      setActiveFlow(data);
    }
  };

  const deleteFlow = async (id: string) => {
    if (!confirm('Tem certeza que deseja apagar este fluxo e desconectar os leads ativos nele?')) return;
    
    // First remove references from contacts
    await supabase.from('contacts').update({ current_flow_id: null, current_node_id: null }).eq('current_flow_id', id);
    
    // Then delete the flow
    await supabase.from('automations').delete().eq('id', id);
    
    setFlows(flows.filter(f => f.id !== id));
    if (activeFlow?.id === id) setActiveFlow(null);
  };

  const toggleFlow = async (flow: any) => {
    const newActiveState = !flow.active;
    setFlows(flows.map(f => f.id === flow.id ? { ...f, active: newActiveState } : f));
    if (activeFlow?.id === flow.id) setActiveFlow({ ...activeFlow, active: newActiveState });
    await supabase.from('automations').update({ active: newActiveState }).eq('id', flow.id);
  };

  // React Flow Handlers
  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)), []);

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }) || { x: 100, y: 100 };

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type, // Directly use the specific type (message, input_name, etc.)
        position,
        data: { 
          label: nodeTypesList.find(n => n.type === type)?.label, 
          type, 
          content: '',
          options: type === 'offer_choices' ? ['Opção 1', 'Opção 2'] : undefined,
          duration: type === 'schedule_appointment' ? '30 min' : undefined
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance],
  );

  const onNodeClick = (event: any, node: Node) => {
    setSelectedNode(node);
  };

  const updateSelectedNodeContent = (content: string) => {
    if (!selectedNode) return;
    const updatedNode = { ...selectedNode, data: { ...selectedNode.data, content } };
    setSelectedNode(updatedNode);
    setNodes(nds => nds.map(n => n.id === updatedNode.id ? updatedNode : n));
  };

  const updateSelectedNodeOptions = (options: string[]) => {
    if (!selectedNode) return;
    const updatedNode = { ...selectedNode, data: { ...selectedNode.data, options } };
    setSelectedNode(updatedNode);
    setNodes(nds => nds.map(n => n.id === updatedNode.id ? updatedNode : n));
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
    setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const saveFlowData = async () => {
    if (!activeFlow) return;
    setSaving(true);
    const flow_data = { nodes, edges };
    
    // Update local
    const updatedFlow = { ...activeFlow, flow_data };
    setActiveFlow(updatedFlow);
    setFlows(flows.map(f => f.id === activeFlow.id ? updatedFlow : f));
    
    // Update DB
    await supabase.from('automations').update({ flow_data }).eq('id', activeFlow.id);
    setSaving(false);
  };

  if (loading && flows.length === 0) return <div style={{ padding: '2rem' }}>Carregando fluxos...</div>;

  return (
    <div style={{ display: 'flex', gap: '1rem', height: '100%', padding: '1rem', boxSizing: 'border-box' }}>
      
      {/* Left Sidebar: Palette & Flow List combined */}
      <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Meus Fluxos</h3>
          <button className="btn btn-primary" onClick={createFlow} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>+ Novo</button>
        </div>

        <select 
          className="input"
          style={{ width: '100%', fontSize: '0.85rem', padding: '0.4rem' }}
          value={activeFlow?.id || ''}
          onChange={(e) => setActiveFlow(flows.find(f => f.id === e.target.value))}
        >
          {flows.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

        {activeFlow && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); deleteFlow(activeFlow.id); }}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}
              title="Apagar Fluxo"
            >🗑️ Excluir Fluxo</button>
            <div 
              onClick={(e) => { e.stopPropagation(); toggleFlow(activeFlow); }}
              style={{ width: '36px', height: '20px', borderRadius: '10px', background: activeFlow.active ? 'var(--success)' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer' }}
              title={activeFlow.active ? "Desativar fluxo" : "Ativar fluxo"}
            >
              <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: activeFlow.active ? '18px' : '2px', transition: 'left 0.2s' }}></div>
            </div>
          </div>
        )}

        <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Componentes</h4>
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
            onClick={saveFlowData}
            disabled={saving}
          >
            {saving ? 'Salvando...' : '💾 Salvar'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
          {nodeTypesList.map((nt) => (
            <div 
              key={nt.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', nt.type);
                e.dataTransfer.effectAllowed = 'move';
              }}
              style={{ 
                padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.05)', 
                borderRadius: 'var(--radius-sm)', cursor: 'grab', fontSize: '0.85rem',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
              className="hover:bg-white/10 transition-colors"
            >
              {nt.label}
            </div>
          ))}
        </div>
      </div>

      {activeFlow ? (
        <div style={{ flex: 1, display: 'flex', gap: '1rem', overflow: 'hidden' }}>
          
          {/* React Flow Container */}
          <div className="glass-panel" style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: 0 }} ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onPaneClick={() => setSelectedNode(null)}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={{ type: 'smoothstep', style: { strokeWidth: 2, stroke: '#8b5cf6' } }}
              fitView
            >
              <Background color="#555" gap={16} variant={BackgroundVariant.Dots} size={1} />
              <Controls position="bottom-left" />
              <MiniMap 
                nodeStrokeColor="#000" 
                nodeColor="#222" 
                maskColor="rgba(0,0,0,0.2)"
                position="bottom-right" 
                style={{ background: '#111', border: '1px solid #333' }}
              />
            </ReactFlow>
          </div>

          {/* Right Sidebar: Properties Panel */}
          {selectedNode && (
            <div style={{ 
              width: '320px', 
              background: 'rgba(0,0,0,0.2)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1.5rem',
              border: '1px solid rgba(255,255,255,0.1)',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>Propriedades</h4>
                <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
              
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                {nodeTypesList.find(n => n.type === selectedNode.data.type)?.label}
              </p>

              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                {selectedNode.data.type === 'add_tag' ? 'Nome da Tag:' : 
                 selectedNode.data.type === 'schedule_appointment' ? 'Mensagem de Apresentação (ex: Escolha um horário):' : 
                 'Conteúdo da Mensagem/Pergunta:'}
              </label>
              <textarea 
                className="input" 
                rows={4} 
                style={{ width: '100%', resize: 'vertical' }}
                value={selectedNode.data.content || ''}
                onChange={(e) => updateSelectedNodeContent(e.target.value)}
                placeholder="Escreva aqui..."
              ></textarea>

              {selectedNode.data.type === 'schedule_appointment' && (
                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    Duração do Compromisso:
                  </label>
                  <select 
                    className="input" 
                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
                    value={selectedNode.data.duration || '30 min'}
                    onChange={(e) => {
                      const updatedNode = { ...selectedNode, data: { ...selectedNode.data, duration: e.target.value } };
                      setSelectedNode(updatedNode);
                      setNodes(nds => nds.map(n => n.id === updatedNode.id ? updatedNode : n));
                    }}
                  >
                    <option value="15 min">15 min</option>
                    <option value="30 min">30 min</option>
                    <option value="45 min">45 min</option>
                    <option value="1 hora">1 hora</option>
                  </select>
                </div>
              )}

              {selectedNode.data.type === 'offer_choices' && (
                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    Opções:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedNode.data.options?.map((opt: string, idx: number) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          className="input" 
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(selectedNode.data.options || [])];
                            newOpts[idx] = e.target.value;
                            updateSelectedNodeOptions(newOpts);
                          }}
                        />
                        <button 
                          onClick={() => {
                            const newOpts = [...(selectedNode.data.options || [])];
                            newOpts.splice(idx, 1);
                            updateSelectedNodeOptions(newOpts);
                          }}
                          style={{ background: 'rgba(255,0,0,0.1)', border: 'none', color: 'var(--danger)', borderRadius: '4px', cursor: 'pointer', padding: '0 0.5rem' }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => updateSelectedNodeOptions([...(selectedNode.data.options || []), 'Nova Opção'])}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem', width: '100%', marginTop: '0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                    className="hover:bg-white/10 transition-colors"
                  >
                    + Adicionar Opção
                  </button>
                </div>
              )}
              
              <button 
                className="btn" 
                style={{ width: '100%', marginTop: '2rem', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: 'var(--danger)' }}
                onClick={deleteSelectedNode}
              >
                Excluir Nó
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Selecione ou crie um fluxo.</p>
        </div>
      )}
    </div>
  );
}
