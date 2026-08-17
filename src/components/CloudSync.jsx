import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { pullOrSeed, startSync, stopSync } from '../store/cloudSync';
import { Modal, Field, Input } from './ui';
import { Cloud, CloudOff, CheckCircle2, LogOut, RefreshCw } from 'lucide-react';

export default function CloudSync() {
  const [session, setSession] = useState(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | syncing | ok | error
  const started = useRef(false);

  // Track the auth session.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // When logged in, pull/seed then keep syncing.
  useEffect(() => {
    if (session?.user) {
      if (started.current) return;
      started.current = true;
      setStatus('syncing');
      pullOrSeed(session.user.id)
        .then(() => { startSync(session.user.id); setStatus('ok'); })
        .catch(() => setStatus('error'));
    } else {
      started.current = false;
      stopSync();
      setStatus('idle');
    }
  }, [session]);

  const signOut = async () => {
    stopSync();
    await supabase.auth.signOut();
  };

  return (
    <div className="px-4 py-3 border-t border-line">
      {session?.user ? (
        <div className="flex items-center gap-2">
          {status === 'ok' && <CheckCircle2 size={14} className="text-success shrink-0" />}
          {status === 'syncing' && <RefreshCw size={14} className="text-aizome shrink-0 animate-spin" />}
          {status === 'error' && <CloudOff size={14} className="text-danger shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="text-[0.62rem] font-mono uppercase tracking-[0.1em] text-ink-dim leading-none">
              {status === 'error' ? 'Erro ao sincronizar' : 'Sincronizado'}
            </p>
            <p className="text-[0.7rem] text-obsidiana truncate">{session.user.email}</p>
          </div>
          <button onClick={signOut} title="Sair" className="p-1 text-ink-dim hover:text-danger shrink-0">
            <LogOut size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 w-full text-[0.66rem] font-mono uppercase tracking-[0.08em] text-aizome hover:text-obsidiana"
        >
          <Cloud size={14} /> Sincronizar dispositivos
        </button>
      )}

      {open && <AuthModal onClose={() => setOpen(false)} />}
    </div>
  );
}

function AuthModal({ onClose }) {
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const submit = async () => {
    setError(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setInfo('Conta criada! Se pedirem confirmação por e-mail, confirme e volte aqui para entrar. (Você pode desativar a confirmação no Supabase para entrar direto.)');
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      onClose();
    } catch (e) {
      setError(traduz(e.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Sincronizar entre dispositivos">
      <p className="text-sm text-ink-dim mb-4">
        Crie uma conta (ou entre) para salvar tudo na nuvem e continuar de onde parou em qualquer aparelho.
        Seus dados atuais serão enviados na primeira vez.
      </p>
      <Field label="E-mail">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus placeholder="voce@email.com" />
      </Field>
      <Field label="Senha">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" />
      </Field>

      {error && <p className="text-[0.75rem] text-danger mb-2">{error}</p>}
      {info && <p className="text-[0.75rem] text-aizome mb-2">{info}</p>}

      <div className="flex items-center justify-between mt-2">
        <button
          className="text-[0.7rem] font-mono uppercase tracking-[0.06em] text-ink-dim hover:text-obsidiana"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo(''); }}
        >
          {mode === 'signin' ? 'Criar conta' : 'Já tenho conta'}
        </button>
        <button
          className="btn-primary"
          disabled={busy || !email || password.length < 6}
          onClick={submit}
        >
          {busy ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
        </button>
      </div>
    </Modal>
  );
}

function traduz(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Este e-mail já tem conta — use "Já tenho conta".';
  if (m.includes('password')) return 'Senha inválida (mínimo 6 caracteres).';
  if (m.includes('email')) return 'E-mail inválido.';
  return msg;
}
