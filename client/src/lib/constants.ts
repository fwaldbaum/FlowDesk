import type { Status } from './types';

export const STATUSES: { id: Status; label: string; short: string; color: string }[] = [
  { id: 'new', label: 'Nuevo Lead', short: 'Nuevo', color: '#3B82F6' },
  { id: 'contacted', label: 'En Contacto', short: 'Contacto', color: '#8B5CF6' },
  { id: 'proposal', label: 'Propuesta Enviada', short: 'Propuesta', color: '#F59E0B' },
  { id: 'won', label: 'Ganado', short: 'Ganado', color: '#10B981' },
  { id: 'lost', label: 'Perdido', short: 'Perdido', color: '#6B7280' },
];

export const STATUS_BY_ID = Object.fromEntries(STATUSES.map((s) => [s.id, s])) as Record<
  Status,
  (typeof STATUSES)[number]
>;

export const SOURCE_SUGGESTIONS = [
  'Formulario web',
  'Referido',
  'LinkedIn',
  'Instagram',
  'Google Ads',
  'Email',
  'Llamada',
  'Evento',
];
