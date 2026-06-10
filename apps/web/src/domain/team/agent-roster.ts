import type { AgentRole, AgentActivityKind } from '@repo/contracts/team';

/**
 * The zedos AI engineering team roster — pure config, no I/O.
 * Names/taglines are product personas surfaced across the workspace.
 */
export interface AgentProfile {
  role: AgentRole;
  name: string;
  /** Short role label key suffix for i18n (`team.role.<role>`). */
  emoji: string;
  /** Tailwind-safe accent color class for the avatar. */
  colorClass: string;
}

export const AGENT_ROSTER: Record<AgentRole, AgentProfile> = {
  product_manager: {
    role: 'product_manager',
    name: 'Nova',
    emoji: '🧭',
    colorClass: 'bg-violet-500',
  },
  engineering_manager: {
    role: 'engineering_manager',
    name: 'Milo',
    emoji: '📋',
    colorClass: 'bg-sky-500',
  },
  architect: {
    role: 'architect',
    name: 'Atlas',
    emoji: '🏛️',
    colorClass: 'bg-amber-500',
  },
  frontend_dev: {
    role: 'frontend_dev',
    name: 'Pixel',
    emoji: '🎨',
    colorClass: 'bg-pink-500',
  },
  backend_dev: {
    role: 'backend_dev',
    name: 'Forge',
    emoji: '⚙️',
    colorClass: 'bg-emerald-500',
  },
  talent_scout: {
    role: 'talent_scout',
    name: 'Scout',
    emoji: '🔍',
    colorClass: 'bg-orange-500',
  },
};

/** Which agent owns each activity kind (single source of attribution). */
export const ACTIVITY_KIND_OWNER: Record<AgentActivityKind, AgentRole> = {
  clarification: 'product_manager',
  prd_generation: 'product_manager',
  prd_edit: 'product_manager',
  prd_refinement: 'product_manager',
  feature_split: 'engineering_manager',
  user_stories: 'product_manager',
  task_split: 'engineering_manager',
  red_team: 'architect',
  delivery_export: 'backend_dev',
  tickets_generation: 'engineering_manager',
  plan_generation: 'engineering_manager',
  team_plan: 'talent_scout',
};

export function agentForKind(kind: AgentActivityKind): AgentProfile {
  return AGENT_ROSTER[ACTIVITY_KIND_OWNER[kind]];
}
