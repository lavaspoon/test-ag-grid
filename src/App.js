import { useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import {
  Workflow,
  Play,
  Save,
  RotateCcw,
  X,
  Table2,
  Code2,
} from 'lucide-react';
import NodePalette from './components/palette/NodePalette';
import WorkflowCanvas from './components/canvas/WorkflowCanvas';
import NodeConfigPanel from './components/panels/NodeConfigPanel';
import PreviewGrid from './components/grid/PreviewGrid';
import { useWorkflowStore } from './store/workflowStore';
import './App.css';

ModuleRegistry.registerModules([AllCommunityModule]);

function JsonPanel() {
  const getWorkflowJson = useWorkflowStore((s) => s.getWorkflowJson);
  const getValidation = useWorkflowStore((s) => s.getValidation);
  const json = getWorkflowJson();
  const validation = getValidation();

  return (
    <div className="json-panel">
      <div className="json-panel-bar">
        <span className={`json-status ${validation.valid ? 'ok' : 'warn'}`}>
          {validation.valid ? '✓ 워크플로우 유효 — 저장 가능' : '⚠ ' + validation.errors.join(' · ')}
        </span>
        <span className="json-hint">백엔드 저장 포맷 (AgentWorkflow JSON)</span>
      </div>
      <pre className="json-body">{JSON.stringify(json, null, 2)}</pre>
    </div>
  );
}

function AppContent() {
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const setWorkflowName = useWorkflowStore((s) => s.setWorkflowName);
  const loadSample = useWorkflowStore((s) => s.loadSample);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const nodes = useWorkflowStore((s) => s.nodes);
  const bottomTab = useWorkflowStore((s) => s.bottomTab);
  const setBottomTab = useWorkflowStore((s) => s.setBottomTab);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const [runMsg, setRunMsg] = useState(null);

  const handleRun = useCallback(() => {
    const v = useWorkflowStore.getState().getValidation();
    if (!v.valid) { setRunMsg({ type: 'error', text: v.errors.join(' · ') }); return; }
    setRunMsg({ type: 'info', text: '실행 시뮬레이션: Trigger → DB 조회 → 필터 → 집계 → AI 분석 → Excel · 이메일 출력' });
    setBottomTab('preview');
  }, [setBottomTab]);

  return (
    <div className="app-root">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">
            <Workflow size={18} strokeWidth={2} color="#2563EB" />
          </div>
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
            <RotateCcw size={13} strokeWidth={2} />
            샘플 불러오기
          </button>
          <button type="button" className="btn btn-outline">
            <Save size={13} strokeWidth={2} />
            저장
          </button>
          <button type="button" className="btn btn-primary" onClick={handleRun}>
            <Play size={12} strokeWidth={2.5} />
            수동 실행
          </button>
        </div>
      </header>

      {/* ── Notice banner ── */}
      {runMsg && (
        <div className={`run-banner run-banner--${runMsg.type}`}>
          <span>{runMsg.text}</span>
          <button type="button" className="banner-close" onClick={() => setRunMsg(null)}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Workspace ── */}
      <div className="app-workspace">
        <div className="workspace-top">
          <NodePalette />
          <div className="canvas-area">
            <ReactFlowProvider>
              <WorkflowCanvas />
            </ReactFlowProvider>
          </div>
          <NodeConfigPanel />
        </div>

        {/* Bottom: full-width data panel */}
        <div className="workspace-bottom">
          <div className="data-panel-header">
            <div className="data-panel-tabs">
              <button
                type="button"
                className={`data-tab ${bottomTab === 'preview' ? 'active' : ''}`}
                onClick={() => setBottomTab('preview')}
              >
                <Table2 size={13} strokeWidth={2} />
                데이터 미리보기
              </button>
              <button
                type="button"
                className={`data-tab ${bottomTab === 'json' ? 'active' : ''}`}
                onClick={() => setBottomTab('json')}
              >
                <Code2 size={13} strokeWidth={2} />
                워크플로우 JSON
              </button>
            </div>
            {bottomTab === 'preview' && selectedNode && (
              <div className="data-panel-context">
                <span
                  className="data-panel-node-badge"
                  style={{
                    background: `var(--cat-${selectedNode.data.category})15`,
                    color: `var(--cat-${selectedNode.data.category})`,
                  }}
                >
                  {selectedNode.data.label}
                </span>
                <span className="data-panel-hint">노드 선택 시 해당 단계 미리보기</span>
              </div>
            )}
          </div>
          <div className="data-panel-body">
            {bottomTab === 'preview' ? (
              <PreviewGrid nodeType={selectedNode?.data?.type} />
            ) : (
              <JsonPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
