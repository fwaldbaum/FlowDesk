import type { Lead, LeadInput, Note, Status, User, WebhookEvent } from './types';

export class ApiError extends Error {
  constructor(message: string, public status: number, public details?: { field: string; message: string }[]) {
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
    throw new ApiError(detail ?? data.error ?? 'Error de red', res.status, data.details);
  }
  return data as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const api = {
  authStatus: () => request<{ setupRequired: boolean }>('/auth/status'),
  me: () => request<{ user: User | null }>('/auth/me'),
  login: (email: string, password: string) =>
    request<{ user: User }>('/auth/login', json('POST', { email, password })),
  register: (name: string, email: string, password: string) =>
    request<{ user: User }>('/auth/register', json('POST', { name, email, password })),
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
  webhookConfig: () => request<{ secretRequired: boolean }>('/webhooks/config'),
  sendTestWebhook: () => request<{ ok: boolean; lead: Lead }>('/webhooks/test', { method: 'POST' }),
};
