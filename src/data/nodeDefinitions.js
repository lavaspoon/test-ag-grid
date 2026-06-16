// MVP 8노드 + 6카테고리 정의 (agent-architecture.md §4, §10)

export const NODE_CATEGORIES = {
  trigger:     { label: 'Trigger',       color: '#10b981', hasInput: false, hasOutput: true  },
  datasource:  { label: 'Data Source',   color: '#3b82f6', hasInput: true,  hasOutput: true  },
  transform:   { label: 'Transform',     color: '#8b5cf6', hasInput: true,  hasOutput: true  },
  ai:          { label: 'AI Analytics',  color: '#f59e0b', hasInput: true,  hasOutput: true  },
  visualization:{ label: 'Visualization',color: '#06b6d4', hasInput: true,  hasOutput: true  },
  output:      { label: 'Output',        color: '#ef4444', hasInput: true,  hasOutput: false },
};

export const NODE_TYPES = {
  schedule:    { type: 'schedule',    category: 'trigger',       label: '스케줄',      defaultParams: { cron: '0 8 * * *', timezone: 'Asia/Seoul', label: '매일 08:00' } },
  manual:      { type: 'manual',      category: 'trigger',       label: '수동 실행',    defaultParams: {} },
  db_query:    { type: 'db_query',    category: 'datasource',    label: 'DB 조회',     defaultParams: { db: 'voc_db', table: 'voc_daily', period: 'yesterday' } },
  filter:      { type: 'filter',      category: 'transform',     label: '필터',        defaultParams: { field: 'voc_type', operator: 'in', values: ['요금', '해지', '로밍'] } },
  aggregate:   { type: 'aggregate',   category: 'transform',     label: '집계',        defaultParams: { groupBy: ['voc_type'], metrics: ['count', 'avg_aht'] } },
  calc_column: { type: 'calc_column', category: 'transform',     label: '계산 컬럼',    defaultParams: { name: '응대율', formula: 'answered / inbound' } },
  ai_summary:  { type: 'ai_summary',  category: 'ai',            label: 'AI 요약',     defaultParams: { mode: 'summary', compare: 'prev_week', dimension: 'voc_type' } },
  ai_insight:  { type: 'ai_insight',  category: 'ai',            label: 'AI 인사이트',  defaultParams: { mode: 'insight', compare: 'prev_week', dimension: 'voc_type' } },
  grid_view:   { type: 'grid_view',   category: 'visualization', label: 'AG Grid',    defaultParams: {} },
  excel:       { type: 'excel',       category: 'output',        label: 'Excel 생성',  defaultParams: { filename: 'report.xlsx', includeAiComment: true } },
  email:       { type: 'email',       category: 'output',        label: '이메일 발송',  defaultParams: { to: 'team@company.com', subject: 'VOC 일일 리포트' } },
};

export const PALETTE_GROUPS = [
  { key: 'trigger', nodes: ['schedule', 'manual'] },
  { key: 'datasource', nodes: ['db_query'] },
  { key: 'transform', nodes: ['filter', 'aggregate', 'calc_column'] },
  { key: 'ai', nodes: ['ai_summary', 'ai_insight'] },
  { key: 'visualization', nodes: ['grid_view'] },
  { key: 'output', nodes: ['excel', 'email'] },
];

export const SAMPLE_WORKFLOW = {
  id: 'voc-daily-report',
  name: 'VOC 일일 리포트',
  enabled: true,
  nodes: [
    { id: 'n1', type: 'schedule', category: 'trigger', position: { x: 40, y: 120 }, params: { cron: '0 8 * * *', label: '매일 08:00' } },
    { id: 'n2', type: 'db_query', category: 'datasource', position: { x: 240, y: 120 }, params: { db: 'voc_db', table: 'voc_daily', period: 'yesterday' } },
    { id: 'n3', type: 'filter', category: 'transform', position: { x: 440, y: 120 }, params: { field: 'voc_type', values: ['요금', '해지', '로밍'] } },
    { id: 'n4', type: 'aggregate', category: 'transform', position: { x: 640, y: 120 }, params: { groupBy: ['voc_type'], metrics: ['count', 'avg_aht'] } },
    { id: 'n5', type: 'ai_summary', category: 'ai', position: { x: 840, y: 80 }, params: { mode: 'summary', compare: 'prev_week' } },
    { id: 'n6', type: 'excel', category: 'output', position: { x: 1040, y: 40 }, params: { filename: 'voc_report.xlsx' } },
    { id: 'n7', type: 'email', category: 'output', position: { x: 1040, y: 180 }, params: { to: 'voc-team@company.com', subject: 'VOC 일일 리포트' } },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2' },
    { id: 'e2', source: 'n2', target: 'n3' },
    { id: 'e3', source: 'n3', target: 'n4' },
    { id: 'e4', source: 'n4', target: 'n5' },
    { id: 'e5', source: 'n5', target: 'n6' },
    { id: 'e6', source: 'n5', target: 'n7' },
  ],
};
