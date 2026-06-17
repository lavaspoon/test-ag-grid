import { useMemo, useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { buildColDefs, getTableForNode, STATUS_BAR, NODE_DATA_LABELS } from '../../lib/tableData';

export default function PreviewGrid({ nodeType }) {
  const gridRef = useRef(null);
  const table = useMemo(() => getTableForNode(nodeType), [nodeType]);
  const columnDefs = useMemo(() => buildColDefs(table?.columns || []), [table]);
  const defaultColDef = useMemo(() => ({
    sortable: true, filter: true, resizable: true,
  }), []);
  const onFirstDataRendered = useCallback((p) => p.api.sizeColumnsToFit(), []);

  const rowCount = table?.rows?.length ?? 0;
  const colCount = table?.columns?.length ?? 0;

  return (
    <div className="preview-grid-wrap">
      <div className="preview-grid-info">
        <span className="preview-grid-title">
          {nodeType ? (NODE_DATA_LABELS[nodeType] || nodeType) : '기본 데이터 미리보기'}
        </span>
        <span className="preview-grid-stats">{rowCount}행 · {colCount}열</span>
      </div>
      <div className="preview-grid-container ag-theme-quartz">
        <AgGridReact
          ref={gridRef}
          rowData={table?.rows || []}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={34}
          headerHeight={36}
          statusBar={STATUS_BAR}
          rowSelection="multiple"
          animateRows
          onFirstDataRendered={onFirstDataRendered}
        />
      </div>
    </div>
  );
}
