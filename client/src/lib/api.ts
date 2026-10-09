import type {
  AdminAction, AdminStats, AdminUser, ContactChannel, FormSettings, ImportResult, Lead, LeadInput, Note,
  RegisterInput, Status, SurveyInput, TodayData, User, WebhookEvent, Workspace,
} from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: { field: string; message: string }[],
    public code?: string,
  ) {
    super(message);
  }
}

let unauthorizedHandler: (() => void) | null = null;

/** Called when an authenticated request comes back 401 (expired or revoked session). */
export function onUnauthorized(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.startsWith('/auth/')) unauthorizedHandler?.();
  if (!res.ok) {
    const detail = data.details?.[0]?.message;
    throw new ApiError(detail ?? data.error ?? 'Error de red', res.status, data.details, data.code);
  }
  return data as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const api = {
  me: () => request<{ user: User | null }>('/auth/me'),
  login: (email: string, password: string) =>
    request<{ user: User }>('/auth/login', json('POST', { email, password })),
  register: (input: RegisterInput) => request<{ user: User }>('/auth/register', json('POST', input)),
  verifyEmail: (token: string) => request<{ ok: true }>('/auth/verify', json('POST', { token })),
  resendVerification: () => request<{ ok: true }>('/auth/verify/resend', { method: 'POST' }),
  forgotPassword: (email: string) => request<{ ok: true }>('/auth/forgot', json('POST', { email })),
  resetPassword: (token: string, password: string) =>
    request<void>('/auth/reset', json('POST', { token, password })),
  submitSurvey: (input: SurveyInput) => request<{ user: User }>('/auth/onboarding', json('POST', input)),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  changePassword: (current: string, next: string) =>
    request<void>('/auth/password', json('POST', { current, next })),

  users: () => request<User[]>('/users'),
  addUser: (name: string, email: string, password: string) =>
    request<User>('/users', json('POST', { name, email, password })),
  removeUser: (id: number) => request<void>(`/users/${id}`, { method: 'DELETE' }),

  leads: () => request<Lead[]>('/leads'),
  createLead: (input: LeadInput) => request<Lead>('/leads', json('POST', input)),
  updateLead: (id: number, patch: Partial<Lead>) => request<Lead>(`/leads/${id}`, json('PATCH', patch)),
  moveLead: (id: number, status: Status, beforeId: number | null) =>
    request<Lead>(`/leads/${id}/move`, json('POST', { status, beforeId })),
  logContact: (id: number, channel: ContactChannel) =>
    request<Lead>(`/leads/${id}/contact`, json('POST', { channel })),
  importLeads: (rows: Record<string, unknown>[], skipDuplicates: boolean) =>
    request<ImportResult>('/leads/import', json('POST', { rows, skipDuplicates })),
  today: () => request<TodayData>('/today'),
  workspace: () => request<Workspace>('/workspace'),
  updateWorkspace: (patch: Partial<Pick<Workspace, 'name' | 'country_code' | 'whatsapp_template' | 'form_settings'>>) =>
    request<Workspace>('/workspace', json('PATCH', patch)),
  rotateFormKey: () => request<Workspace>('/workspace/form-key/rotate', { method: 'POST' }),
  publicForm: (key: string) => request<{ workspace: string; settings: Omit<FormSettings, 'source'> }>(`/forms/${key}`),
  submitForm: (key: string, data: Record<string, string>) =>
    request<{ ok: true }>(`/forms/${key}`, json('POST', data)),
  deleteLead: (id: number) => request<void>(`/leads/${id}`, { method: 'DELETE' }),

  notes: (leadId: number) => request<Note[]>(`/leads/${leadId}/notes`),
  addNote: (leadId: number, note: { kind: 'note' | 'reminder'; body: string; dueAt?: string | null }) =>
    request<Note>(`/leads/${leadId}/notes`, json('POST', note)),
  updateNote: (id: number, done: boolean) => request<Note>(`/notes/${id}`, json('PATCH', { done })),
  deleteNote: (id: number) => request<void>(`/notes/${id}`, { method: 'DELETE' }),

  eventsCursor: () => request<{ mode: 'socket' | 'poll'; cursor: number }>('/events/cursor'),
  events: (after: number) =>
    request<{ id: number; type: string; payload: unknown }[]>(`/events?after=${after}`),

  webhookEvents: () => request<WebhookEvent[]>('/webhooks/events'),
  webhookConfig: () => request<{ key: string }>('/webhooks/config'),
  rotateWebhookKey: () => request<{ key: string }>('/webhooks/rotate', { method: 'POST' }),
  sendTestWebhook: () => request<{ ok: boolean; lead: Lead }>('/webhooks/test', { method: 'POST' }),

  admin: {
    stats: () => request<AdminStats>('/admin/stats'),
    users: (q: string, filter: string) =>
      request<AdminUser[]>(`/admin/users?${new URLSearchParams({ q, filter })}`),
    user: (id: number) => request<AdminUser & { actions: AdminAction[] }>(`/admin/users/${id}`),
    update: (id: number, patch: Partial<Pick<AdminUser, 'name' | 'email' | 'phone' | 'job_title'>>) =>
      request<AdminUser>(`/admin/users/${id}`, json('PATCH', patch)),
    ban: (id: number, reason: string) => request<AdminUser>(`/admin/users/${id}/ban`, json('POST', { reason })),
    unban: (id: number) => request<AdminUser>(`/admin/users/${id}/unban`, { method: 'POST' }),
    resetPassword: (id: number, password: string) =>
      request<AdminUser>(`/admin/users/${id}/password`, json('POST', { password })),
    logout: (id: number) => request<AdminUser>(`/admin/users/${id}/logout`, { method: 'POST' }),
    verify: (id: number) => request<AdminUser>(`/admin/users/${id}/verify`, { method: 'POST' }),
    setAdmin: (id: number, isAdmin: boolean) =>
      request<AdminUser>(`/admin/users/${id}/admin`, json('POST', { is_admin: isAdmin })),
    remove: (id: number) =>
      request<{ deleted: boolean; deleted_workspace: boolean }>(`/admin/users/${id}`, { method: 'DELETE' }),
  },
};
