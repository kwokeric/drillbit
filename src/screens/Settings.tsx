import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { BackHeader } from '../app/Shell';
import { CARDS } from '../content/index';
import { exportProgress, getSettings, importProgress, resetProgress, setMeta } from '../db/progress';

export function Settings() {
  const settings = useLiveQuery(getSettings);
  const [msg, setMsg] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(null));
  }, []);

  if (!settings) return null;

  const setNew = (n: number) => setMeta('settings', { ...settings, newPerDay: Math.max(0, Math.min(20, n)) });

  const doExport = async () => {
    const blob = new Blob([await exportProgress()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `drillbit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg('Backup downloaded.');
  };

  const doImport = async (f: File) => {
    if (!confirm('Replace all your current progress with this backup?')) return;
    try {
      const n = await importProgress(await f.text());
      setMsg(`Restored progress for ${n} cards.`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const doReset = async () => {
    if (!confirm('Delete all progress? Export a backup first if you might want it back.')) return;
    await resetProgress();
    setMsg('Progress reset.');
  };

  return (
    <div className="page">
      <BackHeader title="Settings" />

      <section className="panel">
        <h2>Daily session</h2>
        <div className="setting-row">
          <span>New cards per day</span>
          <div className="stepper">
            <button type="button" className="iconbtn" aria-label="Fewer" onClick={() => setNew(settings.newPerDay - 1)}>
              −
            </button>
            <b aria-live="polite">{settings.newPerDay}</b>
            <button type="button" className="iconbtn" aria-label="More" onClick={() => setNew(settings.newPerDay + 1)}>
              +
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Backup</h2>
        <p className="muted small">Progress is stored only on this device. Export a backup now and then, especially on iPhone.</p>
        <div className="btn-row">
          <button type="button" className="btn ghost" onClick={doExport}>
            Export
          </button>
          <button type="button" className="btn ghost" onClick={() => file.current?.click()}>
            Import
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) doImport(f);
              e.target.value = '';
            }}
          />
        </div>
        {persisted === false && (
          <p className="muted small">The browser may clear this site's data if storage runs low. Installing the app (Add to Home Screen) protects it.</p>
        )}
        {msg && (
          <p className="note" role="status">
            {msg}
          </p>
        )}
      </section>

      <section className="panel">
        <h2>Danger zone</h2>
        <button type="button" className="btn danger" onClick={doReset}>
          Reset all progress
        </button>
      </section>

      <p className="muted small center">
        Drillbit · {CARDS.length} cards · works offline
      </p>
    </div>
  );
}
