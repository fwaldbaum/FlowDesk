import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { CircleAlert, CircleCheck, Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { api } from '../lib/api';
import { STATUSES } from '../lib/constants';
import { money } from '../lib/format';
import {
  downloadFile, guessMapping, IMPORT_FIELDS, mapRows, parseCsv, TEMPLATE_CSV, type ImportField,
} from '../lib/csv';
import type { ImportResult, Status } from '../lib/types';
import { useStore } from '../store/AppStore';
import { dialogMotion, ease, overlayMotion } from './motion';
import { Button, IconButton } from './ui';

const CHUNK = 2000;

type Parsed = { fileName: string; headers: string[]; rows: string[][] };

export function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { reload, toast } = useStore();
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mapping, setMapping] = useState<Record<ImportField, number> | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<Status>('new');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setParsed(null);
    setMapping(null);
    setResult(null);
    setError(null);
    setProgress(0);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const readFile = async (file: File) => {
    setError(null);
    if (!/\.(csv|txt|tsv)$/i.test(file.name)) {
      setError('Sube un archivo .csv. Desde Excel: Archivo → Guardar como → CSV.');
      return;
    }
    const { headers, rows } = parseCsv(await file.text());
    if (!headers.length || !rows.length) {
      setError('El archivo está vacío o no tiene filas debajo de los encabezados.');
      return;
    }
    setParsed({ fileName: file.name, headers, rows });
    setMapping(guessMapping(headers));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  };

  const mapped = useMemo(
    () => (parsed && mapping ? mapRows(parsed.rows, mapping, defaultStatus) : []),
    [parsed, mapping, defaultStatus],
  );

  const run = async () => {
    setBusy(true);
    setError(null);
    const total: ImportResult = { created: 0, skipped: 0, invalid: [] };
    try {
      for (let i = 0; i < mapped.length; i += CHUNK) {
        const r = await api.importLeads(mapped.slice(i, i + CHUNK), skipDuplicates);
        total.created += r.created;
        total.skipped += r.skipped;
        total.invalid.push(...r.invalid.map((x) => ({ ...x, row: x.row + i })));
        setProgress(Math.min(1, (i + CHUNK) / mapped.length));
      }
      setResult(total);
      await reload();
      if (total.created) toast({ tone: 'success', title: `${total.created} leads importados` });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const step = result ? 3 : parsed ? 2 : 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="import"
          {...overlayMotion}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-[6vh] backdrop-blur-[2px]"
        >
          <div className="fixed inset-0" onClick={() => !busy && onClose()} />
          <motion.div
            {...dialogMotion}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-title"
            className="relative w-full max-w-2xl rounded-xl border border-line bg-surface shadow-overlay"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div>
                <h2 id="import-title" className="text-sm font-semibold">Importar leads desde CSV</h2>
                <p className="text-2xs text-subtle">Paso {step} de 3</p>
              </div>
              <IconButton label="Cerrar" onClick={onClose} disabled={busy}>
                <X size={16} />
              </IconButton>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.25, ease } }}
                exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                className="px-5 py-5"
              >
                {step === 1 && (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={onDrop}
                      className={clsx(
                        'flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
                        dragging ? 'border-accent bg-accent/10' : 'border-line hover:border-line-strong hover:bg-raised/40',
                      )}
                    >
                      <motion.span
                        animate={dragging ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-raised text-accent-soft"
                      >
                        <Upload size={20} />
                      </motion.span>
                      <span className="text-sm font-medium text-fg">Arrastra tu archivo CSV aquí</span>
                      <span className="text-xs text-subtle">o haz clic para elegirlo · hasta miles de filas</span>
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,.txt,.tsv,text/csv"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
                    />
                    <div className="flex items-center justify-between rounded-lg border border-line bg-canvas px-3 py-2.5 text-xs text-muted">
                      <span className="flex items-center gap-2">
                        <FileSpreadsheet size={14} /> ¿Usas Excel o Google Sheets? Exporta la hoja como CSV.
                      </span>
                      <button
                        onClick={() => downloadFile('plantilla-flowdesk.csv', TEMPLATE_CSV)}
                        className="flex items-center gap-1 font-medium text-accent-soft hover:text-fg"
                      >
                        <Download size={12} /> Plantilla
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && parsed && mapping && (
                  <div className="space-y-5">
                    <p className="text-xs text-muted">
                      <span className="font-medium text-fg">{parsed.fileName}</span> · {parsed.rows.length} filas. Revisa
                      qué columna corresponde a cada dato.
                    </p>
                    <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                      {IMPORT_FIELDS.map((f) => (
                        <label key={f.id} className="flex items-center gap-3">
                          <span className="w-20 shrink-0 text-xs text-muted">
                            {f.label}
                            {f.required && <span className="text-red-400"> *</span>}
                          </span>
                          <select
                            className="input py-1.5"
                            value={mapping[f.id]}
                            onChange={(e) => setMapping({ ...mapping, [f.id]: Number(e.target.value) })}
                          >
                            <option value={-1}>— No importar —</option>
                            {parsed.headers.map((h, i) => (
                              <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>

                    <div className="overflow-hidden rounded-lg border border-line">
                      <p className="border-b border-line bg-canvas px-3 py-2 text-2xs font-medium uppercase tracking-wide text-subtle">
                        Vista previa
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-subtle">
                            <tr>
                              {['Nombre', 'Email', 'Teléfono', 'Empresa', 'Valor', 'Etapa'].map((h) => (
                                <th key={h} className="whitespace-nowrap px-3 py-1.5 font-medium">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {mapped.slice(0, 4).map((r, i) => (
                              <tr key={i} className="border-t border-line/60 text-fg/90">
                                <td className={clsx('whitespace-nowrap px-3 py-1.5', !r.name && 'text-red-400')}>{String(r.name || 'Falta nombre')}</td>
                                <td className="whitespace-nowrap px-3 py-1.5">{String(r.email ?? '—')}</td>
                                <td className="whitespace-nowrap px-3 py-1.5">{String(r.phone ?? '—')}</td>
                                <td className="whitespace-nowrap px-3 py-1.5">{String(r.company ?? '—')}</td>
                                <td className="whitespace-nowrap px-3 py-1.5 tabular-nums">{typeof r.value === 'number' ? money(r.value) : '—'}</td>
                                <td className="whitespace-nowrap px-3 py-1.5">{STATUSES.find((s) => s.id === r.status)?.label}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      <label className="flex items-center gap-2 text-xs text-muted">
                        Etapa si no viene en el archivo
                        <select className="input w-auto py-1" value={defaultStatus} onChange={(e) => setDefaultStatus(e.target.value as Status)}>
                          {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                        <input type="checkbox" checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)} className="accent-[#4F46E5]" />
                        Omitir duplicados (mismo email o teléfono)
                      </label>
                    </div>
                    {busy && (
                      <div className="h-1 overflow-hidden rounded-full bg-line">
                        <motion.div className="h-full bg-accent" animate={{ width: `${Math.max(8, progress * 100)}%` }} />
                      </div>
                    )}
                  </div>
                )}

                {step === 3 && result && (
                  <div className="py-4 text-center">
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    >
                      <CircleCheck size={24} />
                    </motion.span>
                    <p className="text-base font-semibold text-fg">{result.created} leads importados</p>
                    <p className="mt-1 text-xs text-muted">
                      {result.skipped} duplicados omitidos · {result.invalid.length} filas con errores
                    </p>
                    {result.invalid.length > 0 && (
                      <ul className="mx-auto mt-4 max-h-36 max-w-md space-y-1 overflow-y-auto rounded-lg border border-line bg-canvas p-3 text-left text-xs">
                        {result.invalid.slice(0, 50).map((x) => (
                          <li key={x.row} className="flex gap-2 text-muted">
                            <CircleAlert size={12} className="mt-0.5 shrink-0 text-amber-400" />
                            Fila {x.row + 1}: {x.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {error && <p role="alert" className="mt-4 text-xs text-red-400">{error}</p>}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between gap-2 border-t border-line px-5 py-3">
              {step === 2 ? (
                <Button variant="ghost" onClick={() => setParsed(null)} disabled={busy}>Elegir otro archivo</Button>
              ) : (
                <span />
              )}
              {step === 2 ? (
                <Button variant="primary" onClick={run} disabled={busy || !mapping || mapping.name < 0}>
                  {busy ? 'Importando…' : `Importar ${mapped.length} leads`}
                </Button>
              ) : (
                <Button variant={step === 3 ? 'primary' : 'secondary'} onClick={onClose}>
                  {step === 3 ? 'Listo' : 'Cancelar'}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
