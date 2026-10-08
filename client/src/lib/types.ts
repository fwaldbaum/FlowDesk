export type Status = 'new' | 'contacted' | 'proposal' | 'won' | 'lost';

export interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  value: number;
  status: Status;
  position: number;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
  pending_reminders: number;
}

export type NoteKind = 'note' | 'reminder' | 'event';

export interface Note {
  id: number;
  lead_id: number;
  kind: NoteKind;
  body: string;
  due_at: string | null;
  done: boolean;
  created_at: string;
}

export interface WebhookEvent {
  id: number;
  status: 'accepted' | 'rejected';
  lead_id: number | null;
  lead_name: string | null;
  payload: unknown;
  error: string | null;
  created_at: string;
}

export interface LeadInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  value?: number;
  status?: Status;
  notes?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'member';
  created_at: string;
}
