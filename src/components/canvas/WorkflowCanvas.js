import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import AgentNode from '../nodes/AgentNode';
import { useWorkflowStore } from '../../store/workflowStore';
import { NODE_CATEGORIES } from '../../data/nodeDefinitions';

const nodeTypes = { agentNode: AgentNode };

const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { strokeWidth: 2 },
};

function CanvasInner() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const onConnect = useWorkflowStore((s) => s.onConnect);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const addNode = useWorkflowStore((s) => s.addNode);
  const getValidation = useWorkflowStore((s) => s.getValidation);

  const validation = getValidation();

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow');
      if (!type) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode(type, position);
    },
    [screenToFlowPosition, addNode]
  );

  const onNodeClick = useCallback((_, node) => selectNode(node.id), [selectNode]);
  const onPaneClick = useCallback(() => selectNode(null), [selectNode]);

  const nodesWithSelection = nodes.map((n) => ({
    ...n,
    selected: n.id === selectedNodeId,
  }));

  return (
    <div className="canvas-wrap" ref={reactFlowWrapper} onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#D1D5DB" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => NODE_CATEGORIES[n.data?.category]?.color || '#9CA3AF'}
          maskColor="rgba(244,245,247,0.85)"
          pannable
          zoomable
        />
        <Panel position="top-left" style={{ margin: '10px' }}>
          <div className={`canvas-validation-badge ${validation.valid ? 'ok' : 'warn'}`}>
            {validation.valid ? (
              <><CheckCircle2 size={12} /> DAG 유효</>
            ) : (
              <><AlertCircle size={12} /> {validation.errors[0]}</>
            )}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function WorkflowCanvas() {
  return (
    <section className="canvas-section">
      <CanvasInner />
    </section>
  );
}
