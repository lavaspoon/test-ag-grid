import { vocColumns, vocData, vocAggregated } from '../data/vocSample';
import { employeeColumns, employeeData } from '../data/employees';

/* ─── value formatters ─────────────────────────────────── */
export function numFmt(val) {
  if (val == null) return '';
  return typeof val === 'number' ? val.toLocaleString('ko-KR') : val;
}

export function pctFmt(val) {
  if (val == null) return '';
  const n = Number(val);
  return isNaN(n) ? val : (n > 0 ? '+' : '') + n.toFixed(1) + '%';
}

export function pctCellStyle(params) {
  const v = Number(params.value);
  if (isNaN(v)) return {};
  return { color: v > 0 ? '#059669' : v < 0 ? '#DC2626' : '#4B5563', fontWeight: 600 };
}

/* ─── column definition builder ───────────────────────── */
export function buildColDefs(columns, opts = {}) {
  const { floatingFilter = false } = opts;
  return columns.map((c) => {
    const f = c.field.toLowerCase();
    const base = {
      field: c.field,
      headerName: c.headerName || c.field,
      minWidth: 100,
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter,
      headerTooltip: c.headerName || c.field,
    };

    if (f.includes('pct') || f.includes('rate') || f.includes('percent')) {
      return {
        ...base,
        filter: 'agNumberColumnFilter',
        type: 'numericColumn',
        valueFormatter: (p) => pctFmt(p.value),
        cellStyle: pctCellStyle,
        minWidth: 110,
      };
    }
    if (
      f.includes('count') || f.includes('inbound') || f.includes('answered') ||
      f.includes('salary') || f.includes('aht') || f.includes('prev') || f.includes('curr')
    ) {
      return {
        ...base,
        filter: 'agNumberColumnFilter',
        type: 'numericColumn',
        valueFormatter: (p) => numFmt(p.value),
        minWidth: 100,
      };
    }
    if (f === 'date' || f.includes('date') || f.includes('hire')) {
      return { ...base, minWidth: 120 };
    }
    return { ...base, flex: 1, minWidth: 110 };
  });
}

/* ─── data per node type ───────────────────────────────── */
function tableFromRaw(columns, rows) {
  return {
    columns: columns.map((c) => ({ field: c.field, headerName: c.headerName || c.field })),
    rows,
  };
}

export const NODE_DATA_LABELS = {
  schedule:    '스케줄 트리거',
  manual:      '수동 실행',
  db_query:    'DB 조회 결과 — VOC 일별 원본',
  filter:      '필터 결과 — 요금·해지·로밍 유형',
  calc_column: '계산 컬럼 추가 — 응대율 산출',
  aggregate:   '집계 결과 — VOC 유형별 요약',
  ai_summary:  'AI 분석 — 요약 및 인사이트',
  ai_insight:  'AI 분석 — 인사이트 결과',
  grid_view:   '데이터 미리보기',
  excel:       'Excel 출력 — 최종 데이터',
  email:       '이메일 발송 — 최종 데이터',
};

export function getTableForNode(nodeType) {
  switch (nodeType) {
    case 'db_query':
      return tableFromRaw(vocColumns, vocData);
    case 'filter': {
      const rows = vocData.filter((r) => ['요금', '해지', '로밍'].includes(r.voc_type));
      return tableFromRaw(vocColumns, rows);
    }
    case 'calc_column': {
      const rows = vocData.map((r) => ({
        ...r,
        response_rate: r.inbound
          ? Math.round((r.answered / r.inbound) * 1000) / 10
          : 0,
      }));
      return tableFromRaw(
        [...vocColumns, { field: 'response_rate', headerName: '응대율(%)' }],
        rows,
      );
    }
    case 'aggregate':
    case 'ai_summary':
    case 'ai_insight':
      return vocAggregated;
    default:
      return tableFromRaw(employeeColumns, employeeData);
  }
}

/* ─── status bar ───────────────────────────────────────── */
export const STATUS_BAR = {
  statusPanels: [
    { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
    { statusPanel: 'agSelectedRowCountComponent', align: 'left' },
    { statusPanel: 'agAggregationComponent', align: 'right' },
  ],
};
