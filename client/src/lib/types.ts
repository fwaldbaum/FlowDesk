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
  phone: string | null;
  job_title: string | null;
  role: 'owner' | 'member';
  is_admin: boolean;
  workspace_id: number;
  workspace_name: string | null;
  needs_onboarding: boolean;
  email_verified: boolean;
  needs_verification: boolean;
  created_at: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  job_title: string;
  password: string;
}

export type HeardFrom = 'google' | 'social' | 'referral' | 'ads' | 'blog' | 'event' | 'other';
export type CompanySize = 'solo' | '2-10' | '11-50' | '51-200' | '200+';

export interface SurveyInput {
  heard_from: HeardFrom;
  heard_from_detail?: string;
  company_size: CompanySize;
  company_about: string;
}

/** A row in the platform admin panel. */
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  role: 'owner' | 'member';
  is_admin: boolean;
  banned_at: string | null;
  ban_reason: string | null;
  created_at: string;
  last_login_at: string | null;
  email_verified_at: string | null;
  workspace_id: number;
  workspace_name: string;
  heard_from: HeardFrom | null;
  heard_from_detail: string | null;
  company_size: CompanySize | null;
  company_about: string | null;
  survey_at: string | null;
  leads_count: number;
  members_count: number;
  active_sessions: number;
}

export interface AdminAction {
  id: number;
  admin_email: string | null;
  action:
    | 'update' | 'ban' | 'unban' | 'password_reset' | 'logout' | 'grant_admin' | 'revoke_admin' | 'delete'
    | 'verify_email';
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminStats {
  email_enabled: boolean;
  users: number;
  new_7d: number;
  banned: number;
  workspaces: number;
  leads: number;
  surveys: number;
  heard_from: { key: HeardFrom; count: number }[];
  company_size: { key: CompanySize; count: number }[];
}

export interface FormSettings {
  title: string;
  description: string;
  button: string;
  success: string;
  source: string;
  theme: 'light' | 'dark';
  accent: string;
  fields: { phone: boolean; company: boolean; message: boolean };
}

export interface Workspace {
  id: number;
  name: string;
  country_code: string;
  whatsapp_template: string;
  form_key: string;
  form_settings: FormSettings;
}

export interface TodayReminder {
  id: number;
  lead_id: number;
  body: string;
  due_at: string;
  lead_name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  status: Status;
}

export interface TodayData {
  reminders: TodayReminder[];
  fresh: Lead[];
  stale: Lead[];
  stats: { new_7d: number; open_value: number; won_month: number; overdue: number };
}

export type ContactChannel = 'whatsapp' | 'call' | 'email';

export interface ImportResult {
  created: number;
  skipped: number;
  invalid: { row: number; message: string }[];
}
