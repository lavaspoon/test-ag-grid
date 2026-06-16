import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NODE_CATEGORIES } from '../../data/nodeDefinitions';
import { getNodeIcon } from '../../lib/nodeIcons';

function AgentNode({ data, selected }) {
  const cat = NODE_CATEGORIES[data.category] || NODE_CATEGORIES.transform;
  const Icon = getNodeIcon(data.type);

  return (
    <div
      className={`agent-node ${selected ? 'selected' : ''}`}
      style={{ '--node-color': cat.color }}
    >
      {cat.hasInput && (
        <Handle type="target" position={Position.Left} className="agent-handle" style={{ left: -7 }} />
      )}

      <div className="agent-node-icon-wrap">
        {Icon && <Icon size={16} strokeWidth={1.8} />}
      </div>

      <div className="agent-node-body">
        <span className="agent-node-label">{data.label}</span>
        <span className="agent-node-type">{data.type.replace(/_/g, ' ')}</span>
      </div>

      {cat.hasOutput && (
        <Handle type="source" position={Position.Right} className="agent-handle" style={{ right: -7 }} />
      )}
    </div>
  );
}

export default memo(AgentNode);
