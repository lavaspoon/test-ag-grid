import { useMemo, useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { vocColumns, vocData, vocAggregated } from '../../data/vocSample';
import { employeeColumns, employeeData } from '../../data/employees';

/* ─── column builder helpers ───────────────────────────── */
function numFmt(val) {
  if (val == null) return '';
  return typeof val === 'number' ? val.toLocaleString('ko-KR') : val;
}

function pctFmt(val) {
  if (val == null) return '';
  const n = Number(val);
  return isNaN(n) ? val : (n > 0 ? '+' : '') + n.toFixed(1) + '%';
}

function pctCellStyle(params) {
  const v = Number(params.value);
  if (isNaN(v)) return {};
  return { color: v > 0 ? '#059669' : v < 0 ? '#DC2626' : '#4B5563', fontWeight: 600 };
}

function buildColDefs(columns) {
  return columns.map((c) => {
    const base = {
      field: c.field,
      headerName: c.headerName || c.field,
      minWidth: 90,
      sortable: true,
      resizable: true,
      filter: true,
    };

    const f = c.field.toLowerCase();
    if (f.includes('pct') || f.includes('rate') || f.includes('percent')) {
      return { ...base, valueFormatter: (p) => pctFmt(p.value), cellStyle: pctCellStyle, minWidth: 100 };
    }
    if (f.includes('count') || f.includes('inbound') || f.includes('answered') || f.includes('salary') || f.includes('aht') || f.includes('prev') || f.includes('curr')) {
      return { ...base, valueFormatter: (p) => numFmt(p.value), type: 'numericColumn', minWidth: 90 };
    }
    if (f === 'date' || f.includes('date') || f.includes('hire')) {
      return { ...base, minWidth: 110 };
    }
    return { ...base, flex: 1, minWidth: 100 };
  });
}

/* ─── data per node type ───────────────────────────────── */
function tableFromRaw(columns, rows) {
  return {
    label: null,
    columns: columns.map((c) => ({ field: c.field, headerName: c.headerName || c.field })),
    rows,
  };
}

function getTableForNode(nodeType) {
  switch (nodeType) {
    case 'db_query':
      return { label: 'DB 조회 결과 (VOC 일별)', ...tableFromRaw(vocColumns, vocData) };
    case 'filter': {
      const rows = vocData.filter((r) => ['요금', '해지', '로밍'].includes(r.voc_type));
      return { label: '필터 결과 (VOC 유형: 요금·해지·로밍)', ...tableFromRaw(vocColumns, rows) };
    }
    case 'calc_column': {
      const rows = vocData.map((r) => ({
        ...r,
        response_rate: r.inbound ? Math.round((r.answered / r.inbound) * 1000) / 10 : 0,
      }));
      return {
        label: '계산 컬럼 추가 (응대율 = 응대/인입)',
        ...tableFromRaw([...vocColumns, { field: 'response_rate', headerName: '응대율(%)' }], rows),
      };
    }
    case 'aggregate':
    case 'ai_summary':
    case 'ai_insight':
      return { label: '집계 결과 (VOC 유형별)', ...vocAggregated };
    default:
      return { label: '기본 데이터 미리보기', ...tableFromRaw(employeeColumns, employeeData) };
  }
}

/* ─── status bar config ────────────────────────────────── */
const statusBar = {
  statusPanels: [
    { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
    { statusPanel: 'agSelectedRowCountComponent', align: 'left' },
    { statusPanel: 'agAggregationComponent', align: 'right' },
  ],
};

/* ─── component ─────────────────────────────────────────── */
export default function PreviewGrid({ nodeType }) {
  const gridRef = useRef(null);

  const table = useMemo(() => getTableForNode(nodeType), [nodeType]);

  const columnDefs = useMemo(() => buildColDefs(table?.columns || []), [table]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    suppressMovable: false,
  }), []);

  const onFirstDataRendered = useCallback((params) => {
    params.api.sizeColumnsToFit();
  }, []);

  const rowCount = table?.rows?.length ?? 0;
  const colCount = table?.columns?.length ?? 0;

  return (
    <div className="preview-grid-wrap">
      <div className="preview-grid-info">
        <span className="preview-grid-title">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="1" width="11" height="11" rx="2" stroke="#4B5563" strokeWidth="1.3"/>
            <line x1="1" y1="4.5" x2="12" y2="4.5" stroke="#4B5563" strokeWidth="1.1"/>
            <line x1="4.5" y1="4.5" x2="4.5" y2="12" stroke="#4B5563" strokeWidth="1.1"/>
          </svg>
          {table?.label || '데이터 미리보기'}
        </span>
        <span className="preview-grid-stats">
          {rowCount.toLocaleString('ko-KR')}행 · {colCount}열
          {!nodeType && ' — 캔버스에서 노드를 클릭하면 해당 단계 데이터가 표시됩니다'}
        </span>
      </div>

      <div className="preview-grid-container ag-theme-quartz">
        <AgGridReact
          ref={gridRef}
          rowData={table?.rows || []}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={36}
          headerHeight={38}
          statusBar={statusBar}
          rowSelection="multiple"
          suppressRowClickSelection={false}
          enableRangeSelection={false}
          animateRows
          onFirstDataRendered={onFirstDataRendered}
        />
      </div>
    </div>
  );
}
