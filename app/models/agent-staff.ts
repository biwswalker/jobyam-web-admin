export interface AgentStaffOption {
  id: string;
  name: string;
  role: string;
  agentKey: string;
  phone: string;
}

export const roleColors: Record<string, string> = {
  staff: 'bg-rose-100 text-rose-800 font-semibold',
  agent: 'bg-emerald-100 text-emerald-800 font-semibold',
};

export interface AgentStaffSelectProps {
  value: string;
  onChange: (id: string) => void;
  options: AgentStaffOption[];
  assignedId: string; // id of map users jobs
  disabled?: boolean;
}
