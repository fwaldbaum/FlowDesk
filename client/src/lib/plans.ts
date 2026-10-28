import type { Plan } from './types';

export const PLAN_NAMES: Record<Plan, string> = { free: 'Gratis', pro: 'Pro', max: 'Max' };

/** Mirrors server/src/services/plans.js (the server enforces it); null = no limit. */
export const PLAN_LIMITS: Record<Plan, {
  users: number;
  leads: number | null;
  csv: boolean;
  webhook: boolean;
  whatsapp_template: boolean;
}> = {
  free: { users: 1, leads: 100, csv: false, webhook: false, whatsapp_template: false },
  pro: { users: 3, leads: null, csv: true, webhook: true, whatsapp_template: true },
  max: { users: 15, leads: null, csv: true, webhook: true, whatsapp_template: true },
};
