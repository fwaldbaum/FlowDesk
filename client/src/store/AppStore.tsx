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

  /** How live updates arrive: WebSocket push, or polling on serverless hosts. */
  realtimeMode: 'socket' | 'poll';

  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
}

const POLL_INTERVAL_MS = 3000;

const StoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [realtimeMode, setRealtimeMode] = useState<'socket' | 'poll'>('socket');
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
    let cancelled = false;
    let stop = () => {};

    /** Applies one realtime event. Every handler is idempotent, so redelivery is harmless. */
    const handle = (type: string, payload: any, { quiet = false } = {}) => {
      switch (type) {
        case 'lead:created': {
          const { lead, origin } = payload as { lead: Lead; origin: string };
          dispatch({ type: 'lead/upsert', lead });
          if (origin === 'webhook' && !quiet) {
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
          break;
        }
        case 'lead:updated':
          dispatch({ type: 'lead/upsert', lead: payload as Lead });
          break;
        case 'lead:deleted': {
          const { id } = payload as { id: number };
          dispatch({ type: 'lead/remove', id });
          setSelectedId((cur) => (cur === id ? null : cur));
          break;
        }
        case 'leads:reordered': {
          const { status, order } = payload as { status: Status; order: number[] };
          dispatch({ type: 'leads/reorder', status, order });
          break;
        }
        case 'note:created':
        case 'note:updated':
          dispatch({ type: 'note/upsert', note: payload as Note });
          break;
        case 'note:deleted': {
          const { id, lead_id } = payload as { id: number; lead_id: number };
          dispatch({ type: 'note/remove', id, leadId: lead_id });
          break;
        }
      }
    };

    const startSocket = () => {
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
      socket.onAny((type: string, payload: unknown) => handle(type, payload));
      return () => {
        socket.disconnect();
      };
    };

    /** Serverless fallback: poll the Postgres-backed event feed while the tab is visible. */
    const startPolling = (initialCursor: number) => {
      let cursor = initialCursor;
      const seen = new Set<number>();
      let timer: number | undefined;
      let inFlight = false;

      const poll = async () => {
        if (inFlight || document.visibilityState !== 'visible') return;
        inFlight = true;
        try {
          for (const event of await api.events(cursor)) {
            if (seen.has(event.id)) continue;
            seen.add(event.id);
            // Events at or before the cursor are already reflected in the initial load.
            handle(event.type, event.payload, { quiet: event.id <= initialCursor });
            cursor = Math.max(cursor, event.id);
          }
          if (seen.size > 2000) seen.clear();
          dispatch({ type: 'connection', value: 'online' });
        } catch {
          dispatch({ type: 'connection', value: 'offline' });
        } finally {
          inFlight = false;
        }
      };

      const onVisible = () => {
        if (document.visibilityState === 'visible') poll();
      };
      timer = window.setInterval(poll, POLL_INTERVAL_MS);
      document.addEventListener('visibilitychange', onVisible);
      poll();
      return () => {
        window.clearInterval(timer);
        document.removeEventListener('visibilitychange', onVisible);
      };
    };

    (async () => {
      try {
        // Read the cursor before the data so nothing that happens in between is missed.
        const { mode, cursor } = await api.eventsCursor();
        if (cancelled) return;
        setRealtimeMode(mode);
        await reload();
        if (cancelled) return;
        stop = mode === 'poll' ? startPolling(cursor) : startSocket();
      } catch {
        dispatch({ type: 'connection', value: 'offline' });
        reload();
      }
    })();

    return () => {
      cancelled = true;
      stop();
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
      realtimeMode,
      toasts,
      toast,
      dismissToast,
    }),
    [state, reload, loadNotes, moveLead, search, selectedId, newLeadOpen, realtimeMode, toasts, toast, dismissToast],
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
