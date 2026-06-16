import { useWorkflowStore } from '../../store/workflowStore';
import { NODE_CATEGORIES } from '../../data/nodeDefinitions';
import { MOCK_AI_RESULT } from '../../data/mockAiResult';
import { getNodeIcon } from '../../lib/nodeIcons';
import { MousePointer2, Trash2, TrendingUp } from 'lucide-react';

function Field({ label, value, onChange, options }) {
  if (options) {
    return (
      <div className="config-field">
        <label>{label}</label>
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div className="config-field">
      <label>{label}</label>
      <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ParamForm({ type, params, update }) {
  switch (type) {
    case 'schedule':
      return <>
        <p className="config-section-title">스케줄 설정</p>
        <Field label="Cron 표현식" value={params.cron} onChange={(v) => update({ cron: v })} />
        <Field label="표시명" value={params.label} onChange={(v) => update({ label: v })} />
        <Field label="타임존" value={params.timezone} onChange={(v) => update({ timezone: v })} />
      </>;
    case 'manual':
      return <p className="config-hint">수동 실행 트리거입니다. 추가 설정이 없습니다.</p>;
    case 'db_query':
      return <>
        <p className="config-section-title">데이터 소스</p>
        <Field label="DB" value={params.db} onChange={(v) => update({ db: v })} />
        <Field label="테이블" value={params.table} onChange={(v) => update({ table: v })} />
        <Field label="조회 기간" value={params.period} onChange={(v) => update({ period: v })}
          options={[
            { value: 'yesterday', label: '어제 (1일치)' },
            { value: 'last_7d',   label: '최근 7일' },
            { value: 'last_30d',  label: '최근 30일' },
          ]}
        />
      </>;
    case 'filter':
      return <>
        <p className="config-section-title">필터 조건</p>
        <Field label="필드명" value={params.field} onChange={(v) => update({ field: v })} />
        <Field label="연산자" value={params.operator} onChange={(v) => update({ operator: v })}
          options={[
            { value: 'in', label: 'IN (포함)' },
            { value: 'eq', label: '= (동등)' },
            { value: 'gt', label: '> (초과)' },
            { value: 'lt', label: '< (미만)' },
          ]}
        />
        <Field
          label="값 (쉼표 구분)"
          value={Array.isArray(params.values) ? params.values.join(', ') : params.values}
          onChange={(v) => update({ values: v.split(',').map((s) => s.trim()).filter(Boolean) })}
        />
      </>;
    case 'aggregate':
      return <>
        <p className="config-section-title">집계 설정</p>
        <Field
          label="GROUP BY 컬럼"
          value={Array.isArray(params.groupBy) ? params.groupBy.join(', ') : params.groupBy}
          onChange={(v) => update({ groupBy: v.split(',').map((s) => s.trim()).filter(Boolean) })}
        />
        <Field
          label="집계 지표"
          value={Array.isArray(params.metrics) ? params.metrics.join(', ') : params.metrics}
          onChange={(v) => update({ metrics: v.split(',').map((s) => s.trim()).filter(Boolean) })}
        />
      </>;
    case 'calc_column':
      return <>
        <p className="config-section-title">계산 컬럼</p>
        <Field label="새 컬럼명" value={params.name} onChange={(v) => update({ name: v })} />
        <Field label="수식" value={params.formula} onChange={(v) => update({ formula: v })} />
      </>;
    case 'ai_summary':
    case 'ai_insight':
      return <>
        <p className="config-section-title">AI 분석 설정</p>
        <Field label="분석 모드" value={params.mode} onChange={(v) => update({ mode: v })}
          options={[
            { value: 'summary', label: '요약' },
            { value: 'insight', label: '인사이트' },
            { value: 'anomaly', label: '이상 탐지' },
            { value: 'trend',   label: '트렌드 분석' },
          ]}
        />
        <Field label="비교 기준" value={params.compare} onChange={(v) => update({ compare: v })}
          options={[
            { value: 'prev_day',   label: '전일 대비' },
            { value: 'prev_week',  label: '전주 대비' },
            { value: 'prev_month', label: '전월 대비' },
            { value: 'prev_year',  label: '전년 대비' },
          ]}
        />
        <Field label="분석 차원" value={params.dimension} onChange={(v) => update({ dimension: v })} />
      </>;
    case 'excel':
      return <>
        <p className="config-section-title">Excel 출력 설정</p>
        <Field label="파일명" value={params.filename} onChange={(v) => update({ filename: v })} />
        <Field label="AI 코멘트 포함" value={params.includeAiComment ? 'yes' : 'no'}
          onChange={(v) => update({ includeAiComment: v === 'yes' })}
          options={[
            { value: 'yes', label: '포함' },
            { value: 'no',  label: '미포함' },
          ]}
        />
      </>;
    case 'email':
      return <>
        <p className="config-section-title">이메일 설정</p>
        <Field label="수신자 (이메일)" value={params.to} onChange={(v) => update({ to: v })} />
        <Field label="제목" value={params.subject} onChange={(v) => update({ subject: v })} />
      </>;
    default:
      return <p className="config-hint">이 노드는 추가 설정이 없습니다.</p>;
  }
}

export default function NodeConfigPanel() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const updateNodeParams = useWorkflowStore((s) => s.updateNodeParams);
  const deleteSelectedNode = useWorkflowStore((s) => s.deleteSelectedNode);

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <aside className="config-panel">
        <div className="config-empty-state">
          <div className="config-empty-icon">
            <MousePointer2 size={22} strokeWidth={1.5} color="#9CA3AF" />
          </div>
          <p className="config-empty-title">노드를 선택하세요</p>
          <p className="config-empty-sub">
            팔레트에서 노드를 드래그해 캔버스에<br />
            배치하고 클릭하면 설정이 표시됩니다.
          </p>
        </div>
      </aside>
    );
  }

  const cat = NODE_CATEGORIES[node.data.category];
  const Icon = getNodeIcon(node.data.type);
  const isAi = node.data.category === 'ai';
  const update = (partial) => updateNodeParams(node.id, partial);

  return (
    <aside className="config-panel">
      <div className="config-header">
        <div
          className="config-node-icon"
          style={{ background: `color-mix(in srgb, ${cat.color} 12%, white)`, color: cat.color }}
        >
          {Icon && <Icon size={20} strokeWidth={1.8} />}
        </div>
        <div className="config-node-info">
          <div className="config-node-label">{node.data.label}</div>
          <span
            className="config-node-cat"
            style={{ background: `color-mix(in srgb, ${cat.color} 12%, white)`, color: cat.color }}
          >
            {cat.label}
          </span>
        </div>
      </div>

      <div className="config-body">
        <ParamForm type={node.data.type} params={node.data.params} update={update} />

        {isAi && (
          <>
            <p className="config-section-title">분석 결과 미리보기</p>
            <div className="ai-mock-result">
              <div className="ai-mock-result-head">
                <TrendingUp size={13} strokeWidth={2} />
                AI 분석 결과 (목업)
              </div>
              <p className="ai-mock-summary">{MOCK_AI_RESULT.summary}</p>
              <div className="ai-mock-metrics">
                <div className="ai-metric-card">
                  <div className="ai-metric-value">{MOCK_AI_RESULT.metrics.curr}</div>
                  <div className="ai-metric-label">이번 주</div>
                </div>
                <div className="ai-metric-card">
                  <div className="ai-metric-value">{MOCK_AI_RESULT.metrics.prev}</div>
                  <div className="ai-metric-label">전주</div>
                </div>
                <div className="ai-metric-card">
                  <div className="ai-metric-value" style={{ color: '#D97706' }}>
                    +{MOCK_AI_RESULT.metrics.changePct}%
                  </div>
                  <div className="ai-metric-label">증감</div>
                </div>
              </div>
              <p className="ai-insights-title">인사이트</p>
              <ul className="ai-insights-list">
                {MOCK_AI_RESULT.insights.map((ins, i) => (
                  <li key={i}>
                    <span className={`ai-impact-badge ${ins.impact}`}>{ins.impact}</span>
                    {ins.title}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      <div className="config-footer">
        <button
          type="button"
          className="btn btn-danger-outline"
          style={{ width: '100%' }}
          onClick={deleteSelectedNode}
        >
          <Trash2 size={13} strokeWidth={2} />
          노드 삭제
        </button>
      </div>
    </aside>
  );
}
