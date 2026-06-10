import type { AgentRole } from '@repo/contracts/team';

const FRONTEND_HINTS = [
  'ui',
  'ux',
  'page',
  'screen',
  'component',
  'form',
  'button',
  'modal',
  'layout',
  'style',
  'css',
  'design',
  'display',
  'view',
  'render',
  'mobile',
  'responsive',
  'frontend',
  'front-end',
];

const BACKEND_HINTS = [
  'api',
  'endpoint',
  'route',
  'database',
  'db',
  'schema',
  'migration',
  'auth',
  'server',
  'webhook',
  'job',
  'queue',
  'integration',
  'service',
  'backend',
  'back-end',
  'persistence',
  'repository',
];

/**
 * Pure heuristic: assign a ticket to Pixel (frontend) or Forge (backend)
 * based on its title/description keywords; null when ambiguous.
 */
export function inferAssigneeRole(title: string, description = ''): AgentRole | null {
  const text = `${title} ${description}`.toLowerCase();
  const frontendScore = FRONTEND_HINTS.filter((hint) =>
    new RegExp(`\\b${hint}\\b`).test(text),
  ).length;
  const backendScore = BACKEND_HINTS.filter((hint) =>
    new RegExp(`\\b${hint}\\b`).test(text),
  ).length;

  if (frontendScore === 0 && backendScore === 0) return null;
  if (frontendScore === backendScore) return null;
  return frontendScore > backendScore ? 'frontend_dev' : 'backend_dev';
}
