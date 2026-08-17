import { useState, useEffect, useRef } from 'react';
import { Card } from './ui';
import { connect, getToken, isConnected, isRemembered, disconnect, SCOPE_GMAIL } from '../lib/google';
import { fetchInbox } from '../lib/gmail';
import { fmtShort } from '../lib/date';
import {
  Mail, RefreshCw, X, AlertTriangle, Reply, Star, ExternalLink, Radio, Clock,
} from 'lucide-react';

const CAT_STYLE = {
  'Processos Seletivos': 'text-horizonte border-horizonte/40 bg-horizonte-soft',
  Oportunidade: 'text-success border-success/40 bg-success/5',
  Financeiro: 'text-warn border-warn/40 bg-warn/5',
  Brain: 'text-warn border-warn/40 bg-warn/5',
  Newsletter: 'text-ink-dim border-line',
  Pessoal: 'text-obsidiana border-line',
};

const CATS = ['Todos', 'Processos Seletivos', 'Oportunidade', 'Precisam de resposta', 'Financeiro', 'Pessoal', 'Newsletter'];

export default function LiveInbox() {
  const [connected, setConnected] = useState(isConnected(SCOPE_GMAIL));
  const [emails, setEmails] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Todos');

  const load = async (interactive) => {
    setError(''); setBusy(true);
    try {
      const token = interactive ? await connect(SCOPE_GMAIL) : await getToken(SCOPE_GMAIL);
      const list = await fetchInbox(token, 25);
      setEmails(list);
      setConnected(true);
    } catch (e) {
      setError(traduz(e.message));
    } finally {
      setBusy(false);
    }
  };

  // If the Gmail scope was granted before, reconnect and load silently on mount
  // — no "Conectar" click needed on return visits.
  const autoTried = useRef(false);
  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    if (!connected && isRemembered(SCOPE_GMAIL)) load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disc = () => { disconnect(SCOPE_GMAIL); setConnected(false); setEmails([]); };

  if (!connected) {
    return (
      <Card className="mb-5 border-aizome/30 bg-aizome-soft/30">
        <div className="flex items-start gap-3">
          <Radio size={18} className="text-horizonte shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="font-heading font-bold text-base">Caixa de entrada ao vivo</h2>
            <p className="text-[0.78rem] text-ink-dim mt-0.5 mb-2">
              Conecte o Gmail para ver seus e-mails reais atualizando em tempo real aqui dentro.
            </p>
            <button className="btn-primary" onClick={() => load(true)} disabled={busy}>
              <Mail size={14} /> {busy ? 'Conectando…' : 'Conectar Gmail'}
            </button>
            {error && <p className="text-[0.7rem] text-danger mt-2 flex items-center gap-1"><AlertTriangle size={11} /> {error}</p>}
            <p className="text-[0.66rem] text-ink-dim mt-2">
              ⚠️ O Gmail é uma permissão “restrita” do Google — o aviso de “app não verificado” é mais forte. É seguro (é o seu app): em “Configurações avançadas” → “Acessar life-os”.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const shown = emails.filter((e) => {
    if (filter === 'Todos') return true;
    if (filter === 'Precisam de resposta') return e.needsReply;
    return e.category === filter;
  });

  return (
    <Card className="mb-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Radio size={15} className="text-success" />
          <h2 className="font-heading font-bold text-base">Caixa de entrada ao vivo</h2>
          <span className="chip text-success border-success/40 bg-success/5">Gmail conectado</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-soft py-1.5 px-2.5" onClick={() => load(false)} disabled={busy} title="Atualizar">
            <RefreshCw size={13} className={busy ? 'animate-spin' : ''} /> {busy ? 'Atualizando…' : 'Atualizar'}
          </button>
          <button className="p-1.5 text-ink-dim hover:text-danger" onClick={disc} title="Desconectar"><X size={14} /></button>
        </div>
      </div>

      {error && <p className="text-[0.72rem] text-danger mb-2 flex items-center gap-1"><AlertTriangle size={11} /> {error}</p>}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {CATS.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`chip ${filter === c ? 'bg-obsidiana text-washi border-obsidiana' : 'text-ink-dim border-line hover:border-obsidiana'}`}>
            {c}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-ink-dim py-3 text-center">{emails.length === 0 ? 'Carregando…' : 'Nenhum e-mail nesta categoria.'}</p>
      ) : (
        <ul className="divide-y divide-line/60">
          {shown.map((e) => (
            <li key={e.id} className="flex items-start gap-2.5 py-2">
              {e.unread ? <span className="w-1.5 h-1.5 rounded-full bg-aizome shrink-0 mt-2" title="Não lida" /> : <span className="w-1.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-sm truncate ${e.unread ? 'font-semibold' : 'font-medium'}`}>{e.from.name}</span>
                  {e.starred && <Star size={11} className="fill-warn text-warn shrink-0" />}
                  <span className="text-[0.64rem] text-ink-dim font-mono ml-auto flex items-center gap-1 shrink-0"><Clock size={9} /> {fmtShort(e.date)}</span>
                </div>
                <p className={`text-sm leading-snug ${e.unread ? 'text-obsidiana' : 'text-ink-dim'}`}>{e.subject}</p>
                <p className="text-[0.72rem] text-ink-dim truncate">{e.snippet}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className={`chip ${CAT_STYLE[e.category] || 'border-line text-ink-dim'}`}>{e.category}</span>
                  {e.needsReply && <span className="chip text-warn border-warn/40 bg-warn/5"><Reply size={10} /> Responder</span>}
                  <a href={`https://mail.google.com/mail/u/0/#inbox/${e.threadId}`} target="_blank" rel="noopener noreferrer"
                    className="text-[0.64rem] font-mono uppercase tracking-[0.06em] text-aizome hover:underline inline-flex items-center gap-1">
                    Abrir <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[0.66rem] text-ink-dim mt-3 pt-2 border-t border-line">
        Ao vivo do Gmail ({emails.length} e-mails recentes). Categorização por regras. A análise profunda de IA (resumos, prioridades) está na seção abaixo — peça “atualiza meus e-mails” para reprocessá-la.
      </p>
    </Card>
  );
}

function traduz(m) {
  const s = (m || '').toLowerCase();
  if (s.includes('popup') || s.includes('interaction')) return 'A janela do Google foi bloqueada — permita popups e tente de novo.';
  if (s.includes('access_denied') || s.includes('denied')) return 'Acesso não autorizado. Tente conectar novamente.';
  if (s.includes('401') || s.includes('403')) return 'Sessão do Gmail expirou — clique em Conectar de novo.';
  return m;
}
