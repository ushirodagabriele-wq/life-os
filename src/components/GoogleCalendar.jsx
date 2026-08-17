import { useState } from 'react';
import { connect, disconnect, SCOPE_CALENDAR } from '../lib/google';
import { syncNow, useGoogleStatus } from '../store/googleSync';
import { Calendar, RefreshCw, Check, X, AlertTriangle } from 'lucide-react';

// The heavy two-way sync lives in store/googleSync.js and runs automatically
// (on boot, on an interval, on focus, and after local edits). This component is
// just the status surface: connect once, then everything stays in sync on its
// own. The "Sincronizar agora" button is optional — a manual nudge, never
// required.
export default function GoogleCalendar() {
  const status = useGoogleStatus();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const connectAndSync = async () => {
    setError(''); setBusy(true);
    try {
      await connect(SCOPE_CALENDAR);
      await syncNow();
    } catch (e) {
      setError(traduz(e.message));
    } finally {
      setBusy(false);
    }
  };

  const sync = async () => {
    setError(''); setBusy(true);
    try { await syncNow(); } catch (e) { setError(traduz(e.message)); } finally { setBusy(false); }
  };

  const doDisconnect = () => { disconnect(SCOPE_CALENDAR); setError(''); };

  const syncing = busy || status.syncing;

  if (!status.connected) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button className="btn-ghost" onClick={connectAndSync} disabled={busy}>
          <Calendar size={14} /> {busy ? 'Conectando…' : 'Conectar Google Agenda'}
        </button>
        {error && <span className="text-[0.66rem] text-danger flex items-center gap-1"><AlertTriangle size={11} /> {error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <span className="chip text-success border-success/40 bg-success/5"><Check size={11} /> Google Agenda</span>
        <button className="btn-soft py-1.5 px-2.5" onClick={sync} disabled={syncing} title="Sincronizar agora">
          <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Sincronizando…' : 'Sincronizar'}
        </button>
        <button className="p-1.5 text-ink-dim hover:text-danger" onClick={doDisconnect} title="Desconectar">
          <X size={14} />
        </button>
      </div>
      <span className="text-[0.66rem] text-ink-dim">
        {status.error
          ? <span className="text-danger flex items-center gap-1"><AlertTriangle size={11} /> {traduz(status.error)}</span>
          : status.syncing
            ? 'Sincronizando automaticamente…'
            : status.lastSync
              ? `Sincronização automática ativa · ${new Date(status.lastSync).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : 'Sincronização automática ativa'}
      </span>
    </div>
  );
}

function traduz(m) {
  const s = (m || '').toLowerCase();
  if (s.includes('popup') || s.includes('interaction')) return 'A janela do Google foi bloqueada — permita popups e tente de novo.';
  if (s.includes('access_denied') || s.includes('denied')) return 'Acesso não autorizado. Tente conectar novamente.';
  if (s.includes('401') || s.includes('403')) return 'Sessão do Google expirou — clique em Conectar de novo.';
  return m;
}
