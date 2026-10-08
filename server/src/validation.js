import { z } from 'zod';
import { STATUSES } from './constants.js';

const optionalText = (max) =>
  z.string().trim().max(max).optional().nullable().or(z.literal(''));

export const leadCreateSchema = z.object({
  name: z.string({ required_error: 'El nombre es obligatorio' }).trim().min(1, 'El nombre es obligatorio').max(200),
  email: z.string().trim().email('Email inválido').max(320).optional().nullable().or(z.literal('')),
  phone: optionalText(50),
  company: optionalText(200),
  source: optionalText(100),
  value: z.coerce.number().min(0).max(1e12).optional(),
  status: z.enum(STATUSES).optional(),
  notes: optionalText(5000),
});

export const leadUpdateSchema = leadCreateSchema
  .omit({ status: true, notes: true })
  .partial()
  .extend({ last_contact_at: z.coerce.date().nullable().optional() });

export const leadMoveSchema = z.object({
  status: z.enum(STATUSES),
  beforeId: z.number().int().positive().nullable().optional(),
});

export const noteCreateSchema = z
  .object({
    kind: z.enum(['note', 'reminder']).default('note'),
    body: z.string({ required_error: 'La nota no puede estar vacía' }).trim().min(1, 'La nota no puede estar vacía').max(5000),
    dueAt: z.coerce.date().nullable().optional(),
  })
  .refine((n) => n.kind !== 'reminder' || n.dueAt, {
    message: 'Los recordatorios requieren fecha',
    path: ['dueAt'],
  });

export const noteUpdateSchema = z.object({ done: z.boolean() });

/** Webhook payloads come from third parties: accept common aliases and coerce loosely. */
export const webhookLeadSchema = z.object({
  name: z.string({ required_error: 'name es obligatorio' }).trim().min(1, 'name es obligatorio').max(200),
  email: z.string().trim().email('email inválido').max(320).optional().nullable().or(z.literal('')),
  phone: z.coerce.string().trim().max(50).optional().nullable(),
  source: optionalText(100),
  notes: optionalText(5000),
  company: optionalText(200),
  value: z.coerce.number().min(0).max(1e12).optional(),
});

export function formatZodError(err) {
  return err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
}
