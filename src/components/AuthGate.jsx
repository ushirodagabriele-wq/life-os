import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Whole-app login wall — but ONLY on the deployed build. Locally (npm run dev)
// the app stays open with no friction, preserving the local-first workflow.
// On a public deploy this gate ensures nothing renders before authentication.
//
// IMPORTANT (segurança): num app client-side, este muro protege a INTERFACE,
// não os dados embutidos no bundle. Por isso o deploy só é seguro DEPOIS de
// mover os snapshots sensíveis (emails/radar) para a nuvem (ver ROADMAP/D9).
const GATED = import.meta.env.PROD;

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = carregando

  useEffect(() => {
    if (!GATED) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!GATED) return children;
  if (session === undefined) {
    return (
      <div className="min-h-screen grid place-items-center bg-washi">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-dim animate-pulse">
          Carregando…
        </span>
      </div>
    );
  }
  if (!session) return <LoginScreen />;
  return children;
}

function LoginScreen() {
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const submit = async (e) => {
    e?.preventDefault();
    setError(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setInfo('Conta criada! Confirme pelo link enviado ao seu e-mail e volte para entrar.');
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      // onAuthStateChange no AuthGate cuida de renderizar o app.
    } catch (err) {
      setError(traduz(err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-washi-soft px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-8 h-8 bg-obsidiana rounded-sharp flex items-center justify-center">
            <span className="font-heading font-extrabold text-horizonte">L</span>
          </div>
          <span className="font-heading font-extrabold text-2xl">Life<span className="text-horizonte">OS</span></span>
        </div>

        <div className="bg-washi border border-line rounded-sharp p-6">
          <h1 className="font-heading font-bold text-lg mb-1">
            {mode === 'signin' ? 'Entrar' : 'Criar conta'}
          </h1>
          <p className="text-[0.78rem] text-ink-dim mb-4">
            Sua plataforma pessoal — protegida por login.
          </p>

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="label">E-mail</span>
              <input
                className="input" type="email" value={email} autoFocus
                onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com"
              />
            </label>
            <label className="block">
              <span className="label">Senha</span>
              <input
                className="input" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres"
              />
            </label>

            {error && <p className="text-[0.75rem] text-danger">{error}</p>}
            {info && <p className="text-[0.75rem] text-aizome">{info}</p>}

            <button className="btn-primary w-full justify-center" disabled={busy || !email || password.length < 6}>
              {busy ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <button
            className="mt-4 text-[0.7rem] font-mono uppercase tracking-[0.06em] text-ink-dim hover:text-obsidiana"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo(''); }}
          >
            {mode === 'signin' ? 'Não tem conta? Criar' : 'Já tenho conta'}
          </button>
        </div>
      </div>
    </div>
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
