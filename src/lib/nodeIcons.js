import {
  Clock,
  Play,
  Database,
  Filter,
  BarChart3,
  Hash,
  Sparkles,
  Lightbulb,
  Table2,
  FileSpreadsheet,
  Mail,
} from 'lucide-react';

export const NODE_ICON_MAP = {
  schedule: Clock,
  manual: Play,
  db_query: Database,
  filter: Filter,
  aggregate: BarChart3,
  calc_column: Hash,
  ai_summary: Sparkles,
  ai_insight: Lightbulb,
  grid_view: Table2,
  excel: FileSpreadsheet,
  email: Mail,
};

export function getNodeIcon(type) {
  return NODE_ICON_MAP[type] || null;
}
