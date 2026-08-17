import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Card, EmptyState } from '../components/ui';
import { useStore } from '../store/useStore';
import LiveInbox from '../components/LiveInbox';
import { EMAILS, EMAILS_GENERATED_AT, EMAILS_ACCOUNT } from '../data/emails';
import { searchEmails } from '../lib/emailSearch';
import { fmtShort, fmtLong } from '../lib/date';
import {
  Search, Mail, Star, AlertCircle, Reply, Sparkles, ExternalLink, Clock,
  RefreshCw, CornerUpRight, Briefcase, ArrowRight, Inbox, CalendarPlus, Check,
} from 'lucide-react';

const CATEGORY_STYLE = {
  'Processos Seletivos': 'text-horizonte border-horizonte/40 bg-horizonte-soft',
  Brain: 'text-warn border-warn/40 bg-warn/5',
  Financeiro: 'text-success border-success/40 bg-success/5',
  'Estudos & Notícias': 'text-aizome border-aizome/40 bg-aizome-soft',
  Pessoal: 'text-obsidiana border-line',
  Promocional: 'text-ink-dim border-line',
};

const PRIORITY_DOT = { alta: 'bg-danger', media: 'bg-warn', baixa: 'bg-line' };

const CATEGORIES = ['Todos', 'Processos Seletivos', 'Precisam de resposta', 'Brain', 'Financeiro', 'Estudos & Notícias', 'Pessoal', 'Promocional'];

export default function Emails() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todos');

  const trimmed = query.trim();
  const searchResults = useMemo(() => (trimmed ? searchEmails(EMAILS, trimmed) : null), [trimmed]);

  const needReply = useMemo(
    () =>
      EMAILS.filter((e) => e.needsReply).sort(
        (a, b) => (a.replyRank || 99) - (b.replyRank || 99)
      ),
    []
  );
  const important = useMemo(
    () => EMAILS.filter((e) => (e.priority === 'alta' || e.important || e.starred) && e.category !== 'Promocional'),
    []
  );
  const processos = useMemo(() => EMAILS.filter((e) => e.category === 'Processos Seletivos'), []);

  const filteredAll = useMemo(() => {
    if (filter === 'Todos') return EMAILS;
    if (filter === 'Precisam de resposta') return needReply;
    return EMAILS.filter((e) => e.category === filter);
  }, [filter, needReply]);

  return (
    <>
      <PageHeader eyebrow="Módulo 04 · Caixa de entrada inteligente" title="Emails">
        <span className="hidden sm:flex items-center gap-1.5 font-mono text-[0.62rem] text-ink-dim">
          <RefreshCw size={12} /> snapshot {fmtShort(EMAILS_GENERATED_AT.slice(0, 10))}
        </span>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Kpi icon={Inbox} label="E-mails analisados" value={EMAILS.length} />
        <Kpi icon={AlertCircle} label="Importantes" value={important.length} accent="danger" />
        <Kpi icon={Reply} label="Precisam de resposta" value={needReply.length} accent="warn" />
        <Kpi icon={Briefcase} label="Processos seletivos" value={processos.length} accent="horizonte" />
      </div>

      {/* Caixa de entrada ao vivo (Gmail) */}
      <LiveInbox />

      <div className="flex items-center gap-2 mb-3 mt-6">
        <Sparkles size={16} className="text-horizonte" />
        <h2 className="font-heading font-bold text-lg">Análise inteligente (IA)</h2>
        <span className="chip text-ink-dim border-line">snapshot</span>
      </div>

      {/* Natural-language search */}
      <Card className="mb-5 border-aizome/30 bg-aizome-soft/30">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={15} className="text-horizonte" />
          <h2 className="font-heading font-bold text-base">Busca em linguagem natural</h2>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
          <input
            className="input pl-9"
            placeholder='Ex.: "Encontre o e-mail sobre o evento da XP" ou "Ache o e-mail que fala sobre a Brain"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </Card>

      {searchResults ? (
        <section>
          <SectionHead icon={Search} title={`Resultados para "${trimmed}"`} count={searchResults.length} />
          {searchResults.length === 0 ? (
            <Card><EmptyState icon={Mail} title="Nenhum e-mail encontrado" hint="Tente outros termos, como o nome da empresa ou do evento." /></Card>
          ) : (
            <div className="space-y-2">
              {searchResults.map((e) => <EmailCard key={e.id} email={e} />)}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Precisam de resposta — with suggested order */}
          <section className="mb-6">
            <SectionHead icon={Reply} title="Precisam de resposta ou ação" count={needReply.length}
              hint="Ordem sugerida do que responder primeiro" />
            <div className="space-y-2">
              {needReply.map((e, i) => <EmailCard key={e.id} email={e} rank={i + 1} />)}
            </div>
          </section>

          {/* Importantes & urgentes */}
          <section className="mb-6">
            <SectionHead icon={AlertCircle} title="Importantes & urgentes" count={important.length} />
            <div className="space-y-2">
              {important.map((e) => <EmailCard key={e.id} email={e} />)}
            </div>
          </section>

          {/* Processos Seletivos */}
          <section className="mb-6">
            <SectionHead icon={Briefcase} title="Processos Seletivos" count={processos.length}
              right={<Link to="/processos" className="text-[0.68rem] font-mono uppercase tracking-[0.06em] text-aizome hover:underline inline-flex items-center gap-1">Ver módulo <ArrowRight size={12} /></Link>} />
            <div className="space-y-2">
              {processos.map((e) => <EmailCard key={e.id} email={e} />)}
            </div>
          </section>

          {/* Todos com filtro */}
          <section>
            <SectionHead icon={Inbox} title="Toda a caixa" count={EMAILS.length} />
            <div className="flex flex-wrap gap-1.5 mb-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`chip ${filter === c ? 'bg-obsidiana text-washi border-obsidiana' : 'text-ink-dim border-line hover:border-obsidiana'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filteredAll.map((e) => <EmailCard key={e.id} email={e} />)}
            </div>
          </section>
        </>
      )}

      <p className="text-[0.68rem] text-ink-dim mt-6 pt-4 border-t border-line flex items-start gap-1.5">
        <RefreshCw size={12} className="mt-0.5 shrink-0" />
        Análise de IA da sua caixa ({EMAILS_ACCOUNT}) feita em {fmtLong(EMAILS_GENERATED_AT.slice(0, 10))}. Como o Life OS
        roda localmente, este é um retrato do momento — peça ao Claude "atualiza meus e-mails" para reprocessar. A sincronização
        automática ao vivo entra junto com o backend (Fase 2). Nenhuma resposta é enviada automaticamente.
      </p>
    </>
  );
}

function Kpi({ icon: Icon, label, value, accent }) {
  const color = { danger: 'text-danger', warn: 'text-warn', horizonte: 'text-horizonte' }[accent] || 'text-aizome';
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={14} className={color} />
        <span className="font-mono text-[0.56rem] uppercase tracking-[0.1em] text-ink-dim leading-tight">{label}</span>
      </div>
      <div className="font-heading font-bold text-2xl leading-none">{value}</div>
    </Card>
  );
}

function SectionHead({ icon: Icon, title, count, hint, right }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-aizome" />
          <h2 className="font-heading font-bold text-lg">{title}</h2>
          {count != null && <span className="chip text-ink-dim border-line">{count}</span>}
        </div>
        {hint && <p className="text-[0.72rem] text-ink-dim mt-0.5 ml-6">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

function EmailCard({ email: e, rank }) {
  const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${e.threadId}`;
  const addStagesToProcess = useStore((s) => s.addStagesToProcess);
  const [added, setAdded] = useState(false);

  const handlePlan = () => {
    addStagesToProcess(e.plan);
    setAdded(true);
  };

  return (
    <Card className={`p-3.5 ${e.needsReply ? 'border-l-2 border-l-warn' : ''}`}>
      <div className="flex items-start gap-3">
        {rank != null && (
          <span className="shrink-0 w-6 h-6 rounded-full bg-obsidiana text-washi font-mono text-[0.7rem] flex items-center justify-center mt-0.5">
            {rank}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            {e.unread && <span className="w-1.5 h-1.5 rounded-full bg-aizome shrink-0" title="Não lida" />}
            <span className="font-medium text-sm truncate">{e.from.name}</span>
            {e.starred && <Star size={12} className="fill-warn text-warn shrink-0" />}
            <span className="text-[0.66rem] text-ink-dim font-mono ml-auto flex items-center gap-1 shrink-0">
              <Clock size={10} /> {fmtShort(e.date.slice(0, 10))}
            </span>
          </div>
          <p className="text-sm font-heading font-bold leading-snug mb-1">{e.subject}</p>

          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span className={`chip ${CATEGORY_STYLE[e.category] || 'border-line text-ink-dim'}`}>{e.category}</span>
            {e.priority === 'alta' && <span className="chip text-danger border-danger/40 bg-danger/5"><AlertCircle size={10} /> Urgente</span>}
            {e.needsReply && <span className="chip text-warn border-warn/40 bg-warn/5"><Reply size={10} /> Responder</span>}
          </div>

          <p className="text-[0.8rem] text-ink-dim flex items-start gap-1.5">
            <Sparkles size={12} className="mt-0.5 shrink-0 text-horizonte" />
            <span>{e.summary}</span>
          </p>

          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            {e.action && (
              <a href={e.action.url} target="_blank" rel="noopener noreferrer"
                className="btn-primary py-1.5 px-3 text-[0.66rem]">
                <CornerUpRight size={12} /> {e.action.label}
              </a>
            )}
            {e.plan && !added && (
              <button onClick={handlePlan} className="btn-ghost py-1.5 px-3 text-[0.66rem]">
                <CalendarPlus size={12} /> Adicionar ao planejamento
              </button>
            )}
            {e.plan && added && (
              <span className="inline-flex items-center gap-2 text-[0.66rem] font-mono uppercase tracking-[0.06em] text-success">
                <Check size={13} /> Adicionado
                <Link to="/processos" className="text-aizome hover:underline normal-case">ver processo</Link>
                <Link to="/calendario" className="text-aizome hover:underline normal-case">ver calendário</Link>
              </span>
            )}
            <a href={gmailUrl} target="_blank" rel="noopener noreferrer"
              className="text-[0.68rem] font-mono uppercase tracking-[0.06em] text-aizome hover:underline inline-flex items-center gap-1">
              Abrir no Gmail <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
