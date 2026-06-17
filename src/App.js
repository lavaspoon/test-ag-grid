import { useState, useCallback, useMemo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import {
  Workflow, Play, Save, RotateCcw, X, ChevronRight, BarChart2,
} from 'lucide-react';
import NodePalette from './components/palette/NodePalette';
import WorkflowCanvas from './components/canvas/WorkflowCanvas';
import NodeConfigPanel from './components/panels/NodeConfigPanel';
import DataViewer from './components/dataview/DataViewer';
import { useWorkflowStore } from './store/workflowStore';
import { getNodeIcon } from './lib/nodeIcons';
import { NODE_CATEGORIES } from './data/nodeDefinitions';
import './App.css';

ModuleRegistry.registerModules([AllCommunityModule]);

/* ─── Topological sort ────────────────────────────────── */
function topoSort(nodes, edges) {
  if (!nodes.length) return [];
  const inDegree = new Map(nodes.map((n) => [n.id, 0]));
  const adj = new Map(nodes.map((n) => [n.id, []]));
  edges.forEach((e) => {
    if (adj.has(e.source)) adj.get(e.source).push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });
  const queue = nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id);
  const result = [];
  while (queue.length) {
    const id = queue.shift();
    const node = nodes.find((n) => n.id === id);
    if (node) result.push(node);
    for (const next of adj.get(id) || []) {
      const deg = (inDegree.get(next) || 1) - 1;
      inDegree.set(next, deg);
      if (deg === 0) queue.push(next);
    }
  }
  nodes.forEach((n) => { if (!result.find((r) => r.id === n.id)) result.push(n); });
  return result;
}

/* ─── Pipeline strip ──────────────────────────────────── */
function PipelineStrip({ onOpenDataViewer }) {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const ordered = useMemo(() => topoSort(nodes, edges), [nodes, edges]);

  if (!ordered.length) return null;

  return (
    <div className="pipeline-strip">
      <div className="pipeline-nodes">
        {ordered.map((node, idx) => {
          const cat = NODE_CATEGORIES[node.data.category];
          const Icon = getNodeIcon(node.data.type);
          const isSelected = node.id === selectedNodeId;
          return (
            <div key={node.id} className="pipeline-step-wrap">
              <button
                className={`pipeline-step ${isSelected ? 'active' : ''}`}
                style={{ '--step-color': cat?.color }}
                onClick={() => selectNode(isSelected ? null : node.id)}
                title={node.data.label}
              >
                {Icon && <Icon size={12} strokeWidth={2} />}
                <span>{node.data.label}</span>
              </button>
              {idx < ordered.length - 1 && (
                <ChevronRight size={12} color="#D1D5DB" className="pipeline-arrow" />
              )}
            </div>
          );
        })}
      </div>
      <button className="pipeline-open-dv" onClick={onOpenDataViewer}>
        <BarChart2 size={13} strokeWidth={2} />
        데이터 뷰어
      </button>
    </div>
  );
}

/* ─── Builder ─────────────────────────────────────────── */
function BuilderView({ onOpenDataViewer }) {
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const setWorkflowName = useWorkflowStore((s) => s.setWorkflowName);
  const loadSample = useWorkflowStore((s) => s.loadSample);
  const [runMsg, setRunMsg] = useState(null);

  const handleRun = useCallback(() => {
    const v = useWorkflowStore.getState().getValidation();
    if (!v.valid) { setRunMsg({ type: 'error', text: v.errors.join(' · ') }); return; }
    setRunMsg({ type: 'info', text: '실행 시뮬레이션 완료: Trigger → DB 조회 → 필터 → 집계 → AI 분석 → 출력' });
  }, []);

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo"><Workflow size={18} strokeWidth={2} color="#2563EB" /></div>
          <span className="app-name">1인 1에이전트</span>
          <span className="app-divider">/</span>
          <input
            className="workflow-name-input"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            spellCheck={false}
          />
        </div>
        <div className="app-header-right">
          <button type="button" className="btn btn-ghost" onClick={loadSample}>
            <RotateCcw size={13} /> 샘플 불러오기
          </button>
          <button type="button" className="btn btn-outline">
            <Save size={13} /> 저장
          </button>
          <button type="button" className="btn btn-ghost" onClick={onOpenDataViewer}>
            <BarChart2 size={13} /> 데이터 뷰어
          </button>
          <button type="button" className="btn btn-primary" onClick={handleRun}>
            <Play size={12} strokeWidth={2.5} /> 수동 실행
          </button>
        </div>
      </header>

      {runMsg && (
        <div className={`run-banner run-banner--${runMsg.type}`}>
          <span>{runMsg.text}</span>
          <button className="banner-close" onClick={() => setRunMsg(null)}><X size={13} /></button>
        </div>
      )}

      <PipelineStrip onOpenDataViewer={onOpenDataViewer} />

      <div className="app-workspace">
        <div className="workspace-top">
          <NodePalette />
          <div className="canvas-area">
            <ReactFlowProvider><WorkflowCanvas /></ReactFlowProvider>
          </div>
          <NodeConfigPanel />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('builder');
  return view === 'builder'
    ? <BuilderView onOpenDataViewer={() => setView('dataview')} />
    : <DataViewer onBack={() => setView('builder')} />;
}
