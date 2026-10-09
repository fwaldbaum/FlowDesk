import { STATUSES } from './constants';
import type { Lead, Status } from './types';

/** RFC 4180-ish parser: quoted fields, escaped quotes, CRLF, BOM; delimiter auto-detected. */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.slice(0, src.indexOf('\n') === -1 ? undefined : src.indexOf('\n'));
  const delimiter = [';', '\t', ','].sort(
    (a, b) => firstLine.split(b).length - firstLine.split(a).length,
  )[0]!;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const nonEmpty = rows.filter((r) => r.some((v) => v.trim()));
  const [headers = [], ...body] = nonEmpty;
  return { headers: headers.map((h) => h.trim()), rows: body };
}

export type ImportField = 'name' | 'email' | 'phone' | 'company' | 'source' | 'value' | 'status' | 'notes';

export const IMPORT_FIELDS: { id: ImportField; label: string; required?: boolean }[] = [
  { id: 'name', label: 'Nombre', required: true },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Teléfono' },
  { id: 'company', label: 'Empresa' },
  { id: 'source', label: 'Origen' },
  { id: 'value', label: 'Valor' },
  { id: 'status', label: 'Etapa' },
  { id: 'notes', label: 'Notas' },
];

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const ALIASES: Record<ImportField, string[]> = {
  name: ['nombre', 'name', 'nombre completo', 'full name', 'contacto', 'cliente', 'lead'],
  email: ['email', 'correo', 'e mail', 'mail', 'correo electronico'],
  phone: ['telefono', 'phone', 'celular', 'movil', 'whatsapp', 'fono', 'tel', 'numero'],
  company: ['empresa', 'company', 'compania', 'organizacion', 'negocio', 'razon social'],
  source: ['origen', 'source', 'fuente', 'canal'],
  value: ['valor', 'value', 'monto', 'presupuesto', 'precio', 'amount', 'valor estimado'],
  status: ['etapa', 'estado', 'status', 'stage'],
  notes: ['notas', 'nota', 'notes', 'comentarios', 'comentario', 'mensaje', 'observaciones'],
};

/** Best guess of which CSV column feeds each field (-1 = not imported). */
export function guessMapping(headers: string[]): Record<ImportField, number> {
  const norm = headers.map(normalize);
  const used = new Set<number>();
  const mapping = {} as Record<ImportField, number>;
  for (const field of IMPORT_FIELDS.map((f) => f.id)) {
    let idx = norm.findIndex((h, i) => !used.has(i) && ALIASES[field].includes(h));
    if (idx === -1) idx = norm.findIndex((h, i) => !used.has(i) && ALIASES[field].some((a) => h.includes(a)));
    mapping[field] = idx;
    if (idx !== -1) used.add(idx);
  }
  return mapping;
}

const STATUS_WORDS: Record<string, Status> = {
  nuevo: 'new', 'nuevo lead': 'new', new: 'new', lead: 'new',
  contacto: 'contacted', 'en contacto': 'contacted', contactado: 'contacted', contacted: 'contacted',
  propuesta: 'proposal', 'propuesta enviada': 'proposal', proposal: 'proposal', cotizado: 'proposal',
  ganado: 'won', won: 'won', cerrado: 'won', cliente: 'won',
  perdido: 'lost', lost: 'lost', descartado: 'lost',
};

export const parseStatus = (v: string): Status | undefined => STATUS_WORDS[normalize(v)];

/** "$1.200.000", "1,200.50", "1.200,50" → number. */
export function parseValue(v: string): number | undefined {
  let s = v.replace(/[^\d.,-]/g, '');
  if (!s) return undefined;
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot !== -1 && lastComma !== -1) {
    const decimal = lastDot > lastComma ? '.' : ',';
    s = s.split(decimal === '.' ? ',' : '.').join('').replace(decimal, '.');
  } else if (lastComma !== -1 || lastDot !== -1) {
    const sep = lastComma !== -1 ? ',' : '.';
    const parts = s.split(sep);
    // A single separator followed by exactly 3 digits is a thousands separator.
    s = parts.length > 2 || parts[parts.length - 1]!.length === 3 ? parts.join('') : parts.join('.');
  }
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function mapRows(rows: string[][], mapping: Record<ImportField, number>, defaultStatus: Status) {
  return rows.map((r) => {
    const get = (f: ImportField) => (mapping[f] >= 0 ? (r[mapping[f]] ?? '').trim() : '');
    const out: Record<string, unknown> = { name: get('name'), status: parseStatus(get('status')) ?? defaultStatus };
    for (const f of ['email', 'phone', 'company', 'source', 'notes'] as const) if (get(f)) out[f] = get(f);
    const value = parseValue(get('value'));
    if (value !== undefined) out.value = value;
    return out;
  });
}

const escapeCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV that opens correctly in Excel (BOM + semicolons for Spanish locales). */
export function leadsToCsv(leads: Lead[]) {
  const label = Object.fromEntries(STATUSES.map((s) => [s.id, s.label]));
  const header = ['Nombre', 'Email', 'Teléfono', 'Empresa', 'Origen', 'Valor', 'Etapa', 'Último contacto', 'Creado'];
  const lines = leads.map((l) =>
    [l.name, l.email, l.phone, l.company, l.source, l.value, label[l.status], l.last_contact_at?.slice(0, 10), l.created_at.slice(0, 10)]
      .map(escapeCell)
      .join(';'),
  );
  return `﻿${[header.join(';'), ...lines].join('\r\n')}`;
}

export const TEMPLATE_CSV = `﻿Nombre;Email;Teléfono;Empresa;Origen;Valor;Etapa;Notas\r\nMaría González;maria@empresa.cl;+56 9 1234 5678;Empresa SpA;Referido;1500000;Nuevo;Quiere una demo\r\n`;

export function downloadFile(name: string, content: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
