import { useCallback, useState } from 'react';
import { Search } from 'lucide-react';
import { PALETTE_GROUPS, NODE_TYPES } from '../../data/nodeDefinitions';
import { getNodeIcon } from '../../lib/nodeIcons';

const CAT_KR = {
  trigger:       '시작',
  datasource:    '데이터 조회',
  transform:     '데이터 가공',
  ai:            'AI 분석',
  visualization: '미리보기',
  output:        '내보내기',
};

const NODE_TOOLTIP = {
  schedule:    '매일·매주 정해진 시각에 자동 실행',
  manual:      '버튼 클릭 시 즉시 실행',
  db_query:    '데이터베이스에서 원하는 데이터 조회',
  filter:      '조건에 맞는 행만 골라냅니다',
  aggregate:   '항목별 합계·평균 등을 계산합니다',
  calc_column: '기존 값을 이용해 새 열을 만듭니다',
  ai_summary:  '전체 데이터를 한 문장으로 요약',
  ai_insight:  '변화·이상 구간을 자동으로 탐지',
  grid_view:   '결과를 표 형태로 확인',
  excel:       'Excel 파일(.xlsx)로 저장',
  email:       '이메일에 파일을 첨부해 발송',
};

// Flat list of all nodes for search
const ALL_NODES = Object.entries(NODE_TYPES).map(([key, def]) => ({
  key,
  ...def,
  catLabel: CAT_KR[def.category],
}));

export default function NodePalette() {
  const [query, setQuery] = useState('');

  const onDragStart = useCallback((e, nodeType) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const q = query.toLowerCase();
  const filtered = q
    ? ALL_NODES.filter(n =>
        n.label.toLowerCase().includes(q) ||
        n.catLabel.toLowerCase().includes(q) ||
        NODE_TOOLTIP[n.key]?.toLowerCase().includes(q)
      )
    : null;

  return (
    <aside className="palette">
      {/* Search */}
      <div className="pl-search-wrap">
        <Search size={13} className="pl-search-icon" />
        <input
          className="pl-search-input"
          placeholder="블록 검색..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="palette-scroll">
        {/* Search results */}
        {filtered ? (
          filtered.length === 0 ? (
            <div className="pl-empty">결과 없음</div>
          ) : (
            <div className="pl-group">
              {          filtered.map(n => (
                <NodeItem key={n.key} typeKey={n.key} onDragStart={onDragStart} />
              ))}
            </div>
          )
        ) : (
          /* Normal grouped view */
          PALETTE_GROUPS.map((group, idx) => {
            return (
              <div key={group.key} className="pl-group">
                <div className="pl-group-head">
                  <span className="pl-step">{idx + 1}</span>
                  <span className="pl-group-name">{CAT_KR[group.key]}</span>
                </div>
                {group.nodes.map(typeKey => (
                  <NodeItem key={typeKey} typeKey={typeKey} onDragStart={onDragStart} />
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom hint */}
      <div className="pl-footer">
        드래그 → 캔버스에 배치
      </div>
    </aside>
  );
}

function NodeItem({ typeKey, onDragStart }) {
  const node = NODE_TYPES[typeKey];
  const Icon = getNodeIcon(typeKey);
  return (
    <div
      className="pl-node"
      draggable
      onDragStart={e => onDragStart(e, typeKey)}
      title={NODE_TOOLTIP[typeKey]}
    >
      <span className="pl-node-icon">
        {Icon && <Icon size={15} strokeWidth={2} />}
      </span>
      <span className="pl-node-name">{node.label}</span>
    </div>
  );
}
