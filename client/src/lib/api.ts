import type { Lead, LeadInput, Note, Status, WebhookEvent } from './types';

export class ApiError extends Error {
  constructor(message: string, public status: number, public details?: { field: string; message: string }[]) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.details?.[0]?.message;
    throw new ApiError(detail ?? data.error ?? 'Error de red', res.status, data.details);
  }
  return data as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const api = {
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

  webhookEvents: () => request<WebhookEvent[]>('/webhooks/events'),
  webhookConfig: () => request<{ secretRequired: boolean }>('/webhooks/config'),
  sendTestWebhook: () => request<{ ok: boolean; lead: Lead }>('/webhooks/test', { method: 'POST' }),
};
