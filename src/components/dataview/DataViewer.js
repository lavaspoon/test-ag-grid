import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ArrowLeft, Search, Download, Columns2, RefreshCcw,
  AlignJustify, AlignCenter, LayoutList, X, Pin, ChevronDown,
  Bot, Send, Settings2, Loader2, Sparkles, Zap,
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { getNodeIcon } from '../../lib/nodeIcons';
import { NODE_CATEGORIES } from '../../data/nodeDefinitions';
import { buildColDefs, getTableForNode, STATUS_BAR, NODE_DATA_LABELS } from '../../lib/tableData';

const DEFAULT_ENDPOINT = 'http://localhost:1234/v1/chat/completions';
const DEFAULT_MODEL = 'gemma-3-4b-it-qat';

/* ─── LM Studio AI grid assistant ─────────────────────── */
function buildSystemPrompt(columns, sampleRows) {
  const colList = columns.map((c) => `${c.field}(${c.headerName})`).join(', ');
  return `당신은 AG Grid 데이터 분석 도우미입니다. 사용자의 자연어 질문을 받아 그리드 조작 명령 또는 인사이트를 JSON으로만 반환합니다.

현재 컬럼: ${colList}

샘플 데이터:
${JSON.stringify(sampleRows.slice(0, 4), null, 2)}

반드시 아래 JSON 형식 하나만 반환하세요. 설명이나 마크다운 없이 JSON만:
{
  "action": "filter" | "sort" | "search" | "insight" | "reset" | "select",
  "params": {},
  "explanation": "한국어로 무엇을 했는지 한 문장 설명"
}

action별 params 형식:
- filter: { "filterModel": { "<colId>": { "filterType": "text", "type": "contains"|"equals"|"startsWith"|"endsWith", "filter": "<value>" } } }
  숫자 컬럼: { "filterType": "number", "type": "greaterThan"|"lessThan"|"equals"|"greaterThanOrEqual"|"lessThanOrEqual", "filter": <number> }
- sort: { "columnState": [ { "colId": "<colId>", "sort": "asc"|"desc" } ] }
- search: { "text": "<검색어>" }
- insight: { "text": "<인사이트 내용>" }
- reset: {}
- select: { "criteria": "<조건 설명>" }

예시:
사용자: "요금 유형만 보여줘" → {"action":"filter","params":{"filterModel":{"voc_type":{"filterType":"text","type":"equals","filter":"요금"}}},"explanation":"voc_type이 '요금'인 행만 표시합니다."}
사용자: "건수 내림차순 정렬" → {"action":"sort","params":{"columnState":[{"colId":"count","sort":"desc"}]},"explanation":"count 컬럼을 내림차순으로 정렬합니다."}`;
}

async function callLmStudio({ endpoint, model, userQuery, columns, rows }) {
  const res = await fetch(endpoint || DEFAULT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt(columns, rows) },
        { role: 'user', content: userQuery },
      ],
      temperature: 0.1,
      max_tokens: 512,
      stream: false,
    }),
  });

  if (!res.ok) throw new Error(`LM Studio 오류 ${res.status}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content?.trim() || '';

  // Strip markdown fences if any
  const clean = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1) throw new Error('JSON 응답을 파싱할 수 없습니다.');
  return JSON.parse(clean.slice(start, end + 1));
}

/* ─── Row height ───────────────────────────────────────── */
const ROW_HEIGHTS = [
  { key: 'compact',     label: '촘촘히',   height: 28, icon: <AlignJustify size={13} /> },
  { key: 'normal',      label: '보통',     height: 36, icon: <AlignCenter  size={13} /> },
  { key: 'comfortable', label: '여유있게', height: 48, icon: <LayoutList   size={13} /> },
];

/* ─── Node selector ────────────────────────────────────── */
function NodeSelector({ nodes, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = nodes.find((n) => n.data.type === value);
  const selectedCat = selected ? NODE_CATEGORIES[selected.data.category] : null;
  const SelIcon = selected ? getNodeIcon(selected.data.type) : null;

  const groups = useMemo(() => {
    const map = {};
    nodes.forEach((n) => { const c = n.data.category; if (!map[c]) map[c] = []; map[c].push(n); });
    return Object.entries(map).map(([cat, list]) => ({ cat, list, meta: NODE_CATEGORIES[cat] }));
  }, [nodes]);

  return (
    <div className="dv-node-selector" ref={ref}>
      <button className="dv-node-sel-btn" onClick={() => setOpen((o) => !o)}>
        {SelIcon
          ? <span style={{ color: selectedCat?.color }}><SelIcon size={14} strokeWidth={2} /></span>
          : <Pin size={13} color="#9CA3AF" />
        }
        <span>{selected ? selected.data.label : '노드 선택'}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="dv-node-dropdown">
          <div className="dv-node-dropdown-hint">어느 단계의 데이터를 볼까요?</div>
          {groups.map(({ cat, list, meta }) => (
            <div key={cat}>
              <div className="dv-node-group-label">{meta.label}</div>
              {list.map((n) => {
                const Icon = getNodeIcon(n.data.type);
                return (
                  <button key={n.id} className={`dv-node-option ${n.data.type === value ? 'active' : ''}`}
                    onClick={() => { onChange(n.data.type); setOpen(false); }}
                    style={{ '--cat-c': meta.color }}>
                    {Icon && <Icon size={13} strokeWidth={2} />}
                    {n.data.label}
                    <span className="dv-node-option-desc">{NODE_DATA_LABELS[n.data.type] || ''}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Column visibility panel ──────────────────────────── */
function ColumnPanel({ columns, gridRef, open, onClose }) {
  const [hidden, setHidden] = useState(new Set());
  const toggle = useCallback((field) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field); else next.add(field);
      gridRef.current?.api?.applyColumnState({ state: [{ colId: field, hide: next.has(field) }] });
      return next;
    });
  }, [gridRef]);

  const showAll = () => {
    setHidden(new Set());
    columns.forEach((c) => gridRef.current?.api?.applyColumnState({ state: [{ colId: c.field, hide: false }] }));
  };

  if (!open) return null;
  return (
    <div className="dv-col-panel">
      <div className="dv-col-panel-head">
        <span>컬럼 표시/숨기기</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="dv-col-all-btn" onClick={showAll}>모두 표시</button>
          <button className="dv-col-close" onClick={onClose}><X size={13} /></button>
        </div>
      </div>
      <div className="dv-col-list">
        {columns.map((c) => (
          <label key={c.field} className="dv-col-item">
            <input type="checkbox" checked={!hidden.has(c.field)} onChange={() => toggle(c.field)} />
            {c.headerName}
          </label>
        ))}
      </div>
    </div>
  );
}

/* ─── AI Chat panel ────────────────────────────────────── */
function AiChatPanel({ gridRef, table, open }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: '안녕하세요! 그리드 데이터에 대해 자연어로 물어보세요.\n예: "요금 유형만 보여줘" / "건수 내림차순 정렬" / "AHT가 300 이상인 행" / "전체 요약해줘"',
      action: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const applyAction = useCallback((result) => {
    const api = gridRef.current?.api;
    if (!api) return;
    switch (result.action) {
      case 'filter':
        api.setFilterModel(result.params.filterModel || null);
        break;
      case 'sort':
        api.applyColumnState({ state: result.params.columnState || [], defaultState: { sort: null } });
        break;
      case 'search':
        api.setGridOption('quickFilterText', result.params.text || '');
        break;
      case 'reset':
        api.setFilterModel(null);
        api.applyColumnState({ defaultState: { sort: null } });
        api.setGridOption('quickFilterText', '');
        break;
      default:
        break;
    }
  }, [gridRef]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const result = await callLmStudio({
        endpoint, model,
        userQuery: text,
        columns: table?.columns || [],
        rows: table?.rows || [],
      });
      applyAction(result);
      setMessages((prev) => [...prev, {
        role: 'ai',
        text: result.explanation || '작업을 완료했습니다.',
        action: result.action,
      }]);
    } catch (e) {
      setMessages((prev) => [...prev, {
        role: 'ai',
        text: `오류: ${e.message}\n\nLM Studio가 실행 중인지 확인하세요 (포트 1234).`,
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, endpoint, model, table, applyAction]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const QUICK_PROMPTS = [
    '필터 모두 초기화',
    '건수 내림차순 정렬',
    '전체 데이터 요약',
  ];

  if (!open) return null;

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <Sparkles size={14} color="#F59E0B" />
          AI 도우미
          <span className="ai-panel-badge">LM Studio</span>
        </div>
        <button className="ai-settings-btn" onClick={() => setShowSettings((v) => !v)} title="LM Studio 설정">
          <Settings2 size={13} />
        </button>
      </div>

      {showSettings && (
        <div className="ai-settings">
          <label className="ai-setting-field">
            <span>엔드포인트</span>
            <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
          </label>
          <label className="ai-setting-field">
            <span>모델명</span>
            <input value={model} onChange={(e) => setModel(e.target.value)} />
          </label>
        </div>
      )}

      <div className="ai-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`ai-msg ai-msg--${msg.role} ${msg.error ? 'ai-msg--error' : ''}`}>
            {msg.role === 'ai' && (
              <span className="ai-msg-icon">
                {msg.error ? '⚠' : <Bot size={13} />}
              </span>
            )}
            <div className="ai-msg-body">
              {msg.action && msg.action !== 'insight' && (
                <span className={`ai-action-badge ai-action--${msg.action}`}>
                  <Zap size={10} />
                  {msg.action}
                </span>
              )}
              <p className="ai-msg-text">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-msg ai-msg--ai">
            <span className="ai-msg-icon"><Bot size={13} /></span>
            <div className="ai-msg-body">
              <div className="ai-thinking">
                <Loader2 size={13} className="ai-spin" />
                <span>분석 중...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-quick-prompts">
        {QUICK_PROMPTS.map((q) => (
          <button key={q} className="ai-quick-btn" onClick={() => { setInput(q); }}>
            {q}
          </button>
        ))}
      </div>

      <div className="ai-input-row">
        <textarea
          className="ai-input"
          rows={2}
          placeholder="예: 요금 유형만 보여줘..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="ai-send-btn"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          title="전송 (Enter)"
        >
          {loading ? <Loader2 size={15} className="ai-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}

/* ─── Main DataViewer ──────────────────────────────────── */
export default function DataViewer({ onBack }) {
  const nodes = useWorkflowStore((s) => s.nodes);
  const gridRef = useRef(null);

  const initialType = useMemo(() => {
    const first = nodes.find((n) => n.data.category !== 'trigger' && n.data.category !== 'output');
    return first?.data?.type || null;
  }, [nodes]);

  const [nodeType, setNodeType] = useState(initialType);
  const [quickFilter, setQuickFilter] = useState('');
  const [rowHeightKey, setRowHeightKey] = useState('normal');
  const [showColPanel, setShowColPanel] = useState(false);
  const [pinnedFilterRow, setPinnedFilterRow] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);

  const table = useMemo(() => getTableForNode(nodeType), [nodeType]);
  const rowHeight = ROW_HEIGHTS.find((r) => r.key === rowHeightKey)?.height ?? 36;

  const columnDefs = useMemo(
    () => buildColDefs(table?.columns || [], { floatingFilter: pinnedFilterRow }),
    [table, pinnedFilterRow],
  );
  const defaultColDef = useMemo(() => ({
    sortable: true, filter: true, resizable: true, floatingFilter: pinnedFilterRow,
  }), [pinnedFilterRow]);

  const handleQuickFilter = useCallback((text) => {
    setQuickFilter(text);
    gridRef.current?.api?.setGridOption('quickFilterText', text);
  }, []);
  const handleExportCsv = useCallback(() => {
    gridRef.current?.api?.exportDataAsCsv({ fileName: `export-${nodeType || 'data'}.csv` });
  }, [nodeType]);
  const handleAutoSize = useCallback(() => gridRef.current?.api?.autoSizeAllColumns(false), []);
  const handleFitColumns = useCallback(() => gridRef.current?.api?.sizeColumnsToFit(), []);
  const handleReset = useCallback(() => {
    gridRef.current?.api?.setFilterModel(null);
    gridRef.current?.api?.applyColumnState({ defaultState: { sort: null } });
    gridRef.current?.api?.setGridOption('quickFilterText', '');
    setQuickFilter('');
  }, []);
  const onFirstDataRendered = useCallback((p) => p.api.sizeColumnsToFit(), []);

  const selectedNodeMeta = nodes.find((n) => n.data.type === nodeType);
  const selectedCat = selectedNodeMeta ? NODE_CATEGORIES[selectedNodeMeta.data.category] : null;
  const rowCount = table?.rows?.length ?? 0;
  const colCount = table?.columns?.length ?? 0;

  return (
    <div className="data-viewer">
      {/* Header */}
      <div className="dv-header">
        <div className="dv-header-left">
          <button className="dv-back-btn" onClick={onBack}>
            <ArrowLeft size={15} strokeWidth={2} />
            빌더로 돌아가기
          </button>
          <div className="dv-header-title">
            <span className="dv-title-text">데이터 뷰어</span>
            {selectedNodeMeta && (
              <span className="dv-title-badge"
                style={{ background: `${selectedCat?.color}18`, color: selectedCat?.color }}>
                {selectedNodeMeta.data.label}
              </span>
            )}
          </div>
        </div>
        <NodeSelector nodes={nodes} value={nodeType} onChange={setNodeType} />
      </div>

      {/* Toolbar */}
      <div className="dv-toolbar">
        <div className="dv-toolbar-left">
          <div className="dv-search-wrap">
            <Search size={13} color="#9CA3AF" className="dv-search-icon" />
            <input className="dv-search-input" placeholder="전체 검색..."
              value={quickFilter} onChange={(e) => handleQuickFilter(e.target.value)} />
            {quickFilter && (
              <button className="dv-search-clear" onClick={() => handleQuickFilter('')}><X size={12} /></button>
            )}
          </div>
          <button className={`dv-tool-btn ${pinnedFilterRow ? 'active' : ''}`}
            onClick={() => setPinnedFilterRow((v) => !v)}>컬럼 필터</button>
          <div style={{ position: 'relative' }}>
            <button className={`dv-tool-btn ${showColPanel ? 'active' : ''}`}
              onClick={() => setShowColPanel((v) => !v)}>
              <Columns2 size={13} /> 컬럼 설정
            </button>
            <ColumnPanel columns={table?.columns || []} gridRef={gridRef}
              open={showColPanel} onClose={() => setShowColPanel(false)} />
          </div>
        </div>
        <div className="dv-toolbar-right">
          <div className="dv-row-height-group">
            {ROW_HEIGHTS.map((r) => (
              <button key={r.key}
                className={`dv-rh-btn ${rowHeightKey === r.key ? 'active' : ''}`}
                onClick={() => setRowHeightKey(r.key)} title={r.label}>
                {r.icon}
              </button>
            ))}
          </div>
          <div className="dv-toolbar-sep" />
          <button className="dv-tool-btn" onClick={handleAutoSize}>자동 너비</button>
          <button className="dv-tool-btn" onClick={handleFitColumns}>화면 맞춤</button>
          <button className="dv-tool-btn" onClick={handleReset}>
            <RefreshCcw size={13} /> 초기화
          </button>
          <button className="dv-tool-btn dv-export-btn" onClick={handleExportCsv}>
            <Download size={13} /> CSV
          </button>
          <div className="dv-toolbar-sep" />
          <button
            className={`dv-tool-btn dv-ai-toggle ${aiOpen ? 'active' : ''}`}
            onClick={() => setAiOpen((v) => !v)}
          >
            <Sparkles size={13} />
            AI 도우미
          </button>
        </div>
      </div>

      {/* Body: grid + AI panel */}
      <div className="dv-body">
        <div className="dv-grid-wrap ag-theme-quartz">
          <AgGridReact
            ref={gridRef}
            rowData={table?.rows || []}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowHeight={rowHeight}
            headerHeight={38}
            floatingFiltersHeight={pinnedFilterRow ? 34 : 0}
            statusBar={STATUS_BAR}
            rowSelection="multiple"
            enableCellTextSelection
            pagination
            paginationPageSize={25}
            paginationPageSizeSelector={[10, 25, 50, 100, 500]}
            animateRows
            onFirstDataRendered={onFirstDataRendered}
            tooltipShowDelay={300}
          />
        </div>

        <AiChatPanel gridRef={gridRef} table={table} open={aiOpen} />
      </div>

      {/* Info bar */}
      <div className="dv-infobar">
        <span>
          <strong>{rowCount.toLocaleString('ko-KR')}</strong>행 ·
          <strong> {colCount}</strong>열
          {nodeType && ` · ${NODE_DATA_LABELS[nodeType] || nodeType}`}
        </span>
        <span className="dv-infobar-hint">
          Shift+클릭 다중 정렬 · 컬럼 헤더 드래그로 순서 변경 · Ctrl+C 복사
        </span>
      </div>
    </div>
  );
}
