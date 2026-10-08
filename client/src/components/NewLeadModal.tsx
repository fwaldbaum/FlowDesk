import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api';
import { SOURCE_SUGGESTIONS, STATUSES } from '../lib/constants';
import type { LeadInput, Status } from '../lib/types';
import { useStore } from '../store/AppStore';
import { Button, IconButton } from './ui';

const EMPTY = { name: '', company: '', email: '', phone: '', source: '', value: '', status: 'new' as Status, notes: '' };

export function NewLeadModal() {
  const { newLeadOpen, setNewLeadOpen, dispatch, toast, openLead } = useStore();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!newLeadOpen) return;
    setForm(EMPTY);
    setError(null);
    requestAnimationFrame(() => nameRef.current?.focus());
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNewLeadOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [newLeadOpen, setNewLeadOpen]);

  if (!newLeadOpen) return null;

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const input: LeadInput = {
        name: form.name,
        company: form.company,
        email: form.email,
        phone: form.phone,
        source: form.source || 'Manual',
        value: form.value ? Number(form.value) : 0,
        status: form.status,
        notes: form.notes,
      };
      const lead = await api.createLead(input);
      dispatch({ type: 'lead/upsert', lead });
      setNewLeadOpen(false);
      toast({
        tone: 'success',
        title: 'Lead creado',
        description: lead.name,
        action: { label: 'Abrir', onClick: () => openLead(lead.id) },
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-[10vh]">
      <div className="fixed inset-0" onClick={() => setNewLeadOpen(false)} />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-lead-title"
        onSubmit={submit}
        className="relative w-full max-w-lg rounded-xl border border-line bg-surface shadow-overlay"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 id="new-lead-title" className="text-sm font-semibold">Nuevo lead</h2>
          <IconButton type="button" label="Cerrar" onClick={() => setNewLeadOpen(false)}>
            <X size={16} />
          </IconButton>
        </div>

        <div className="grid grid-cols-2 gap-4 px-5 py-5">
          <div className="col-span-2">
            <label className="label" htmlFor="nl-name">Nombre *</label>
            <input id="nl-name" ref={nameRef} className="input" value={form.name} onChange={set('name')} placeholder="Nombre del contacto" required />
          </div>
          <div>
            <label className="label" htmlFor="nl-company">Empresa</label>
            <input id="nl-company" className="input" value={form.company} onChange={set('company')} placeholder="Empresa" />
          </div>
          <div>
            <label className="label" htmlFor="nl-value">Valor estimado ($)</label>
            <input id="nl-value" className="input tabular-nums" type="number" min="0" step="1" value={form.value} onChange={set('value')} placeholder="0" />
          </div>
          <div>
            <label className="label" htmlFor="nl-email">Email</label>
            <input id="nl-email" className="input" type="email" value={form.email} onChange={set('email')} placeholder="nombre@empresa.com" />
          </div>
          <div>
            <label className="label" htmlFor="nl-phone">Teléfono</label>
            <input id="nl-phone" className="input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+56 9 1234 5678" />
          </div>
          <div>
            <label className="label" htmlFor="nl-source">Origen</label>
            <input id="nl-source" className="input" list="nl-sources" value={form.source} onChange={set('source')} placeholder="Formulario web" />
            <datalist id="nl-sources">
              {SOURCE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="nl-status">Etapa</label>
            <select id="nl-status" className="input" value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label" htmlFor="nl-notes">Nota inicial</label>
            <textarea id="nl-notes" className="input min-h-[72px] resize-y" value={form.notes} onChange={set('notes')} placeholder="Contexto, necesidad, próximos pasos…" />
          </div>
          {error && <p className="col-span-2 text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
          <Button type="button" variant="ghost" onClick={() => setNewLeadOpen(false)}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={saving || !form.name.trim()}>
            {saving ? 'Guardando…' : 'Crear lead'}
          </Button>
        </div>
      </form>
    </div>
  );
}
