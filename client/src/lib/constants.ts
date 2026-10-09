import type { CompanySize, HeardFrom, Status } from './types';

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


export const HEARD_FROM_LABELS: Record<HeardFrom, string> = {
  google: 'Google u otro buscador',
  social: 'Redes sociales',
  referral: 'Recomendación de alguien',
  ads: 'Publicidad',
  blog: 'Blog, artículo o video',
  event: 'Evento o feria',
  other: 'Otro',
};

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  solo: 'Solo yo',
  '2-10': '2 – 10 personas',
  '11-50': '11 – 50 personas',
  '51-200': '51 – 200 personas',
  '200+': 'Más de 200',
};
