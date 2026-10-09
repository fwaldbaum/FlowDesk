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

const emailField = z
  .string({ required_error: 'El email es obligatorio' })
  .trim()
  .toLowerCase()
  .email('Email inválido')
  .max(320);

const passwordField = z
  .string({ required_error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(200, 'La contraseña es demasiado larga');

const nameField = z
  .string({ required_error: 'El nombre es obligatorio' })
  .trim()
  .min(2, 'Escribe tu nombre completo')
  .max(100);

const phoneField = z
  .string({ required_error: 'El teléfono es obligatorio' })
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/, 'Teléfono inválido. Usa solo números, espacios y + (ej: +56 9 1234 5678)')
  .refine((v) => v.replace(/\D/g, '').length >= 7, 'El teléfono debe tener al menos 7 dígitos');

const jobTitleField = z
  .string({ required_error: 'Indica tu rol en la empresa' })
  .trim()
  .min(2, 'Indica tu rol en la empresa')
  .max(80);

export const registerSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  job_title: jobTitleField,
  password: passwordField,
});

/** Accounts an owner creates for teammates. */
export const memberSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

export const HEARD_FROM = ['google', 'social', 'referral', 'ads', 'blog', 'event', 'other'];
export const COMPANY_SIZES = ['solo', '2-10', '11-50', '51-200', '200+'];

export const surveySchema = z
  .object({
    heard_from: z.enum(HEARD_FROM, { errorMap: () => ({ message: 'Elige cómo conociste FlowDesk' }) }),
    heard_from_detail: z.string().trim().max(200).optional().nullable(),
    company_size: z.enum(COMPANY_SIZES, { errorMap: () => ({ message: 'Elige el tamaño de tu empresa' }) }),
    company_about: z
      .string({ required_error: 'Cuéntanos de qué trata tu empresa' })
      .trim()
      .min(3, 'Cuéntanos de qué trata tu empresa')
      .max(500, 'Máximo 500 caracteres'),
  })
  .refine((v) => v.heard_from !== 'other' || (v.heard_from_detail ?? '').length > 0, {
    message: 'Cuéntanos dónde nos conociste',
    path: ['heard_from_detail'],
  });

export const adminUserUpdateSchema = z
  .object({
    name: nameField,
    email: emailField,
    phone: phoneField.nullable().or(z.literal('')),
    job_title: z.string().trim().max(80).nullable(),
  })
  .partial();

export const banSchema = z.object({
  reason: z.string().trim().max(500).optional().nullable(),
});

export const adminPasswordSchema = z.object({ password: passwordField });
export const adminFlagSchema = z.object({ is_admin: z.boolean() });

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ required_error: 'La contraseña es obligatoria' }).min(1, 'La contraseña es obligatoria').max(200),
});

export const passwordChangeSchema = z.object({
  current: z.string().min(1, 'Ingresa tu contraseña actual').max(200),
  next: passwordField,
});

export const tokenSchema = z.object({ token: z.string().min(20).max(200) });
export const emailOnlySchema = z.object({ email: emailField });
export const passwordResetSchema = z.object({ token: z.string().min(20).max(200), password: passwordField });

export const contactSchema = z.object({ channel: z.enum(['whatsapp', 'call', 'email']) });

export const importSchema = z.object({
  rows: z.array(z.record(z.unknown())).min(1, 'El archivo no tiene filas').max(2000, 'Máximo 2.000 filas por importación'),
  skipDuplicates: z.boolean().default(true),
});

export const FORM_DEFAULTS = {
  title: 'Hablemos',
  description: 'Déjanos tus datos y te contactaremos a la brevedad.',
  button: 'Enviar',
  success: '¡Gracias! Te contactaremos pronto.',
  source: 'Formulario web',
  theme: 'light',
  accent: '#4F46E5',
  fields: { phone: true, company: false, message: true },
};

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido');

export const formSettingsSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240),
  button: z.string().trim().min(1).max(40),
  success: z.string().trim().min(1).max(240),
  source: z.string().trim().min(1).max(60),
  theme: z.enum(['light', 'dark']),
  accent: hexColor,
  fields: z.object({ phone: z.boolean(), company: z.boolean(), message: z.boolean() }),
});

export const workspaceUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  country_code: z.string().trim().regex(/^\d{1,4}$/, 'Código de país inválido (ej: 56)').optional(),
  whatsapp_template: z.string().trim().min(1).max(500).optional(),
  form_settings: formSettingsSchema.optional(),
});

export const formSubmitSchema = z.object({
  name: z.string({ required_error: 'Escribe tu nombre' }).trim().min(2, 'Escribe tu nombre').max(120),
  email: z.string({ required_error: 'Escribe tu correo' }).trim().email('Correo inválido').max(320),
  phone: z.string().trim().max(30).optional().nullable(),
  company: z.string().trim().max(120).optional().nullable(),
  message: z.string().trim().max(2000).optional().nullable(),
  website: z.string().optional().nullable(), // honeypot: real people never fill it
});
