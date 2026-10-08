import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState,
  type ReactNode,
} from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/api';
import type { Lead, Note, Status } from '../lib/types';

// ---- Data state --------------------------------------------------------------

type Connection = 'connecting' | 'online' | 'offline';

interface DataState {
  leads: Record<number, Lead>;
  loaded: boolean;
  notes: Record<number, Note[] | undefined>;
  highlighted: Record<number, true>;
  connection: Connection;
  /** Bumped on every webhook-origin lead so views can refresh derived data. */
  webhookTick: number;
}

type Action =
  | { type: 'leads/set'; leads: Lead[] }
  | { type: 'lead/upsert'; lead: Lead }
  | { type: 'lead/remove'; id: number }
  | { type: 'leads/reorder'; status: Status; order: number[] }
  | { type: 'lead/move'; id: number; status: Status; beforeId: number | null }
  | { type: 'notes/set'; leadId: number; notes: Note[] }
  | { type: 'note/upsert'; note: Note }
  | { type: 'note/remove'; id: number; leadId: number }
  | { type: 'highlight'; id: number; on: boolean }
  | { type: 'connection'; value: Connection }
  | { type: 'webhook/tick' };

const initial: DataState = {
  leads: {},
  loaded: false,
  notes: {},
  highlighted: {},
  connection: 'connecting',
  webhookTick: 0,
};

function applyOrder(leads: Record<number, Lead>, status: Status, order: number[]) {
  const next = { ...leads };
  order.forEach((id, position) => {
    const lead = next[id];
    if (lead && (lead.position !== position || lead.status !== status)) {
      next[id] = { ...lead, status, position };
    }
  });
  return next;
}

export function columnOrder(leads: Record<number, Lead>, status: Status, exclude?: number) {
  return Object.values(leads)
    .filter((l) => l.status === status && l.id !== exclude)
    .sort((a, b) => a.position - b.position || a.id - b.id)
    .map((l) => l.id);
}

function reducer(state: DataState, action: Action): DataState {
  switch (action.type) {
    case 'leads/set':
      return { ...state, loaded: true, leads: Object.fromEntries(action.leads.map((l) => [l.id, l])) };
    case 'lead/upsert':
      return { ...state, leads: { ...state.leads, [action.lead.id]: action.lead } };
    case 'lead/remove': {
      const { [action.id]: _, ...leads } = state.leads;
      return { ...state, leads };
    }
    case 'leads/reorder':
      return { ...state, leads: applyOrder(state.leads, action.status, action.order) };
    case 'lead/move': {
      // Mirror of the server's moveLead so the board updates before the response arrives.
      const order = columnOrder(state.leads, action.status, action.id);
      const at = action.beforeId == null ? -1 : order.indexOf(action.beforeId);
      order.splice(at === -1 ? order.length : at, 0, action.id);
      return { ...state, leads: applyOrder(state.leads, action.status, order) };
    }
    case 'notes/set':
      return { ...state, notes: { ...state.notes, [action.leadId]: action.notes } };
    case 'note/upsert': {
      const list = state.notes[action.note.lead_id];
      if (!list) return state; // Not loaded yet; will be fetched on open.
      const exists = list.some((n) => n.id === action.note.id);
      const next = exists
        ? list.map((n) => (n.id === action.note.id ? action.note : n))
        : [action.note, ...list];
      return { ...state, notes: { ...state.notes, [action.note.lead_id]: next } };
    }
    case 'note/remove': {
      const list = state.notes[action.leadId];
      if (!list) return state;
      return {
        ...state,
        notes: { ...state.notes, [action.leadId]: list.filter((n) => n.id !== action.id) },
      };
    }
    case 'highlight': {
      const { [action.id]: _, ...rest } = state.highlighted;
      return { ...state, highlighted: action.on ? { ...rest, [action.id]: true } : rest };
    }
    case 'connection':
      return { ...state, connection: action.value };
    case 'webhook/tick':
      return { ...state, webhookTick: state.webhookTick + 1 };
  }
}

// ---- Toasts -----------------------------------------------------------------

export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone?: 'default' | 'success' | 'error' | 'webhook';
  action?: { label: string; onClick: () => void };
}

// ---- Context ----------------------------------------------------------------

interface Store extends DataState {
  dispatch: React.Dispatch<Action>;
  reload: () => Promise<void>;
  loadNotes: (leadId: number) => Promise<void>;
  moveLead: (id: number, status: Status, beforeId: number | null) => Promise<void>;

  search: string;
  setSearch: (q: string) => void;
  selectedId: number | null;
  openLead: (id: number | null) => void;
  newLeadOpen: boolean;
  setNewLeadOpen: (open: boolean) => void;

  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
}

const StoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++toastSeq.current;
      setToasts((ts) => [...ts.slice(-3), { ...t, id }]);
      window.setTimeout(() => dismissToast(id), t.tone === 'error' ? 6000 : 4500);
    },
    [dismissToast],
  );

  const reload = useCallback(async () => {
    try {
      dispatch({ type: 'leads/set', leads: await api.leads() });
    } catch (err) {
      toast({ tone: 'error', title: 'No se pudieron cargar los leads', description: (err as Error).message });
    }
  }, [toast]);

  const loadNotes = useCallback(async (leadId: number) => {
    dispatch({ type: 'notes/set', leadId, notes: await api.notes(leadId) });
  }, []);

  const moveLead = useCallback(
    async (id: number, status: Status, beforeId: number | null) => {
      dispatch({ type: 'lead/move', id, status, beforeId });
      try {
        dispatch({ type: 'lead/upsert', lead: await api.moveLead(id, status, beforeId) });
      } catch (err) {
        toast({ tone: 'error', title: 'No se pudo mover el lead', description: (err as Error).message });
        await reload();
      }
    },
    [reload, toast],
  );

  // Keep the latest callbacks reachable from long-lived socket handlers.
  const openLeadRef = useRef(setSelectedId);
  openLeadRef.current = setSelectedId;
  const { expire } = useAuth();
  const expireRef = useRef(expire);
  expireRef.current = expire;

  useEffect(() => {
    reload();
    const socket = io({ transports: ['websocket', 'polling'] });
    let everConnected = false;

    socket.on('connect', () => {
      dispatch({ type: 'connection', value: 'online' });
      // After a reconnect we may have missed events: resync.
      if (everConnected) reload();
      everConnected = true;
    });
    socket.on('disconnect', (reason) => {
      dispatch({ type: 'connection', value: 'offline' });
      // The server kicks sockets whose session was revoked (logout elsewhere, removed member).
      if (reason === 'io server disconnect') expireRef.current();
    });
    socket.on('connect_error', (err) => {
      if (err.message === 'unauthorized') expireRef.current();
      else dispatch({ type: 'connection', value: 'offline' });
    });
    socket.io.on('reconnect_attempt', () => dispatch({ type: 'connection', value: 'connecting' }));

    socket.on('lead:created', ({ lead, origin }: { lead: Lead; origin: string }) => {
      dispatch({ type: 'lead/upsert', lead });
      if (origin === 'webhook') {
        dispatch({ type: 'webhook/tick' });
        dispatch({ type: 'highlight', id: lead.id, on: true });
        window.setTimeout(() => dispatch({ type: 'highlight', id: lead.id, on: false }), 4000);
        toast({
          tone: 'webhook',
          title: 'Nuevo lead vía webhook',
          description: [lead.name, lead.source].filter(Boolean).join(' · '),
          action: { label: 'Ver', onClick: () => openLeadRef.current(lead.id) },
        });
      }
    });
    socket.on('lead:updated', (lead: Lead) => dispatch({ type: 'lead/upsert', lead }));
    socket.on('lead:deleted', ({ id }: { id: number }) => {
      dispatch({ type: 'lead/remove', id });
      setSelectedId((cur) => (cur === id ? null : cur));
    });
    socket.on('leads:reordered', ({ status, order }: { status: Status; order: number[] }) =>
      dispatch({ type: 'leads/reorder', status, order }),
    );
    socket.on('note:created', (note: Note) => dispatch({ type: 'note/upsert', note }));
    socket.on('note:updated', (note: Note) => dispatch({ type: 'note/upsert', note }));
    socket.on('note:deleted', ({ id, lead_id }: { id: number; lead_id: number }) =>
      dispatch({ type: 'note/remove', id, leadId: lead_id }),
    );

    return () => {
      socket.disconnect();
    };
  }, [reload, toast]);

  const value = useMemo<Store>(
    () => ({
      ...state,
      dispatch,
      reload,
      loadNotes,
      moveLead,
      search,
      setSearch,
      selectedId,
      openLead: setSelectedId,
      newLeadOpen,
      setNewLeadOpen,
      toasts,
      toast,
      dismissToast,
    }),
    [state, reload, loadNotes, moveLead, search, selectedId, newLeadOpen, toasts, toast, dismissToast],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <AppStoreProvider>');
  return store;
}

/** Leads matching the global search box. */
export function useFilteredLeads() {
  const { leads, search } = useStore();
  return useMemo(() => {
    const all = Object.values(leads);
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((l) =>
      [l.name, l.company, l.email, l.phone, l.source].some((f) => f?.toLowerCase().includes(q)),
    );
  }, [leads, search]);
}
