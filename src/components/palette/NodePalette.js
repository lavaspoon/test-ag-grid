import { useCallback } from 'react';
import { PALETTE_GROUPS, NODE_TYPES, NODE_CATEGORIES } from '../../data/nodeDefinitions';
import { getNodeIcon } from '../../lib/nodeIcons';

export default function NodePalette() {
  const onDragStart = useCallback((e, nodeType) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <aside className="palette">
      <div className="palette-header">
        <h2>노드 팔레트</h2>
        <p className="palette-drag-hint">드래그해서 캔버스에 배치</p>
      </div>

      <div className="palette-scroll">
        {PALETTE_GROUPS.map((group) => {
          const cat = NODE_CATEGORIES[group.key];
          return (
            <div key={group.key} className="palette-group">
              <div className="palette-group-label">
                <span className="palette-group-dot" style={{ background: cat.color }} />
                {cat.label}
              </div>
              {group.nodes.map((typeKey) => {
                const node = NODE_TYPES[typeKey];
                const Icon = getNodeIcon(typeKey);
                return (
                  <div
                    key={typeKey}
                    className="palette-item"
                    draggable
                    onDragStart={(e) => onDragStart(e, typeKey)}
                    title={`${node.label} — 드래그해서 배치`}
                  >
                    <span className="palette-item-icon" style={{ color: cat.color }}>
                      {Icon && <Icon size={14} strokeWidth={2} />}
                    </span>
                    <span className="palette-item-name">{node.label}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
