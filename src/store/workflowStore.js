import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { SAMPLE_WORKFLOW, NODE_TYPES } from '../data/nodeDefinitions';

let nodeCounter = 100;

function toFlowNode(node) {
  const def = NODE_TYPES[node.type];
  return {
    id: node.id,
    type: 'agentNode',
    position: node.position,
    data: {
      type: node.type,
      category: node.category || def?.category,
      label: def?.label || node.type,
      params: node.params || {},
    },
  };
}

function toFlowEdge(edge) {
  return { id: edge.id, source: edge.source, target: edge.target };
}

function buildWorkflowJson(name, nodes, edges) {
  return {
    id: 'workflow-' + Date.now(),
    name,
    enabled: true,
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.data.type,
      category: n.data.category,
      position: n.position,
      params: n.data.params,
    })),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  };
}

function hasCycle(nodes, edges) {
  const adj = new Map(nodes.map((n) => [n.id, []]));
  edges.forEach((e) => adj.get(e.source)?.push(e.target));

  const visited = new Set();
  const stack = new Set();

  function dfs(id) {
    if (stack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    stack.add(id);
    for (const next of adj.get(id) || []) {
      if (dfs(next)) return true;
    }
    stack.delete(id);
    return false;
  }

  return nodes.some((n) => dfs(n.id));
}

export function validateWorkflow(nodes, edges) {
  const errors = [];
  const triggers = nodes.filter((n) => n.data.category === 'trigger');
  const outputs = nodes.filter((n) => n.data.category === 'output');

  if (triggers.length !== 1) {
    errors.push('Trigger 노드는 정확히 1개여야 합니다.');
  }
  if (outputs.length < 1) {
    errors.push('Output 노드는 1개 이상 필요합니다.');
  }
  if (hasCycle(nodes, edges)) {
    errors.push('순환 연결은 허용되지 않습니다 (DAG만 가능).');
  }

  return { valid: errors.length === 0, errors };
}

export const useWorkflowStore = create((set, get) => ({
  workflowName: SAMPLE_WORKFLOW.name,
  nodes: SAMPLE_WORKFLOW.nodes.map(toFlowNode),
  edges: SAMPLE_WORKFLOW.edges.map(toFlowEdge),
  selectedNodeId: null,
  bottomTab: 'preview',

  setWorkflowName: (name) => set({ workflowName: name }),

  setNodes: (nodes) => set({ nodes }),

  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),

  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),

  onConnect: (connection) => {
    const { nodes, edges } = get();
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);
    if (!sourceNode || !targetNode) return;

    const sourceCat = sourceNode.data.category;
    const targetCat = targetNode.data.category;
    if (sourceCat === 'output' || targetCat === 'trigger') return;

    const newEdge = {
      id: `e-${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
    };
    const nextEdges = [...edges, newEdge];
    if (hasCycle(nodes, nextEdges)) return;

    set({ edges: nextEdges });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  updateNodeParams: (nodeId, params) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, params: { ...n.data.params, ...params } } } : n
      ),
    })),

  addNode: (type, position) => {
    const def = NODE_TYPES[type];
    if (!def) return;
    nodeCounter += 1;
    const id = `n${nodeCounter}`;
    const node = toFlowNode({
      id,
      type,
      category: def.category,
      position,
      params: { ...def.defaultParams },
    });
    set((state) => ({ nodes: [...state.nodes, node], selectedNodeId: id }));
  },

  deleteSelectedNode: () => {
    const { selectedNodeId, nodes, edges } = get();
    if (!selectedNodeId) return;
    set({
      nodes: nodes.filter((n) => n.id !== selectedNodeId),
      edges: edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId),
      selectedNodeId: null,
    });
  },

  loadSample: () =>
    set({
      workflowName: SAMPLE_WORKFLOW.name,
      nodes: SAMPLE_WORKFLOW.nodes.map(toFlowNode),
      edges: SAMPLE_WORKFLOW.edges.map(toFlowEdge),
      selectedNodeId: null,
    }),

  getWorkflowJson: () => {
    const { workflowName, nodes, edges } = get();
    return buildWorkflowJson(workflowName, nodes, edges);
  },

  getValidation: () => {
    const { nodes, edges } = get();
    return validateWorkflow(nodes, edges);
  },

  setBottomTab: (tab) => set({ bottomTab: tab }),
}));
