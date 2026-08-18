import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Card, ProgressBar } from '../components/ui';
import { useStore } from '../store/useStore';
import { THEMES, NEWSLETTERS_DETECTED, OPP_PROFILE, OPPORTUNITIES, OPPORTUNITIES_EXCLUDED, FIXED_INCOME_PANEL, RADAR_GENERATED_AT } from '../data/radar';
import { fmtLong, fmtShort, daysUntil } from '../lib/date';
import {
  Radar as RadarIcon, Globe, Cpu, TrendingUp, Flame, Sparkles, RefreshCw,
  ArrowUpRight, PlayCircle, Newspaper, FileText, Link2, Mail, Zap, ChevronDown,
  BookmarkPlus, Check, Filter, Gift, Coins, CalendarClock, ExternalLink, ListChecks, XCircle,
  Wallet, AlertTriangle, Star,
} from 'lucide-react';

// Turn a learning block into plain-text note content for Estudos Livres.
function composeNoteBody(b, theme) {
  const lines = [b.summary, ''];
  if (b.events?.length) { lines.push('O QUE ACONTECEU'); b.events.forEach((e) => lines.push('• ' + e)); lines.push(''); }
  if (b.impacts?.length) { lines.push('POR QUE IMPORTA'); b.impacts.forEach((e) => lines.push('• ' + e)); lines.push(''); }
  if (b.sources?.length) { lines.push('PARA SE APROFUNDAR'); b.sources.forEach((s) => lines.push('• ' + s.label + ' — ' + s.url)); lines.push(''); }
  lines.push(`— Radar de Notícias · ${theme}${b.from?.length ? ' · fonte: ' + b.from.join(', ') : ''}`);
  return lines.join('\n');
}

const THEME_ICON = { geopolitica: Globe, 'ia-tech': Cpu, mercado: TrendingUp };
const SOURCE_ICON = { video: PlayCircle, news: Newspaper, article: FileText, source: Link2 };
const SOURCE_LABEL = { video: 'Vídeo', news: 'Notícia', article: 'Artigo', source: 'Fonte' };

export default function Radar() {
  const [active, setActive] = useState('todos');
  const totalBlocks = THEMES.reduce((n, t) => n + t.blocks.length, 0);
  const shown = active === 'todos' ? THEMES : THEMES.filter((t) => t.id === active);

  return (
    <>
      <PageHeader eyebrow="Módulo 05 · Central de aprendizado" title="Radar de Notícias">
        <span className="hidden sm:flex items-center gap-1.5 font-mono text-[0.62rem] text-ink-dim">
          <RefreshCw size={12} /> {fmtShort(RADAR_GENERATED_AT.slice(0, 10))}
        </span>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Kpi icon={Mail} label="Newsletters" value={NEWSLETTERS_DETECTED.length} />
        <Kpi icon={RadarIcon} label="Temas" value={THEMES.length} accent="horizonte" />
        <Kpi icon={Sparkles} label="Blocos de aprendizado" value={totalBlocks} accent="aizome" />
      </div>

      {/* Newsletters detectadas */}
      <Card className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Mail size={14} className="text-aizome" />
          <h2 className="font-heading font-bold text-sm">Newsletters identificadas automaticamente</h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {NEWSLETTERS_DETECTED.map((n) => (
            <span key={n.name} className="chip text-ink-dim border-line" title={n.topic}>
              {n.name}
            </span>
          ))}
        </div>
        <p className="text-[0.68rem] text-ink-dim mt-2">
          Conteúdos repetidos foram consolidados; apenas o que vale conhecer ficou.
        </p>
      </Card>

      {/* Radar de Oportunidades — personalizado */}
      <OpportunitiesSection />

      {/* Theme filter */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <FilterChip active={active === 'todos'} onClick={() => setActive('todos')}>Todos</FilterChip>
        {THEMES.map((t) => (
          <FilterChip key={t.id} active={active === t.id} onClick={() => setActive(t.id)}>
            {t.name} {t.hot && '🔥'}
          </FilterChip>
        ))}
      </div>

      {/* Themes */}
      <div className="space-y-8">
        {shown.map((theme) => {
          const Icon = THEME_ICON[theme.id] || Globe;
          return (
            <section key={theme.id}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={18} className="text-aizome" />
                <h2 className="font-heading font-bold text-xl">{theme.name}</h2>
                {theme.hot && (
                  <span className="chip text-danger border-danger/40 bg-danger/5"><Flame size={10} /> Em alta</span>
                )}
                <span className="chip text-ink-dim border-line">{theme.blocks.length} blocos</span>
              </div>
              <div className="space-y-3">
                {theme.blocks.map((b, i) => <Block key={i} block={b} theme={theme.name} />)}
              </div>
              {theme.id === 'mercado' && <FixedIncomePanel />}
            </section>
          );
        })}
      </div>

      <p className="text-[0.68rem] text-ink-dim mt-8 pt-4 border-t border-line flex items-start gap-1.5">
        <RefreshCw size={12} className="mt-0.5 shrink-0" />
        Consolidado por IA a partir das suas newsletters em {fmtLong(RADAR_GENERATED_AT.slice(0, 10))}. Temas em alta foram
        enriquecidos com fontes e vídeos confiáveis buscados na web. Peça ao Claude "atualiza meu radar" para reprocessar
        com as newsletters mais recentes.
      </p>
    </>
  );
}

function Kpi({ icon: Icon, label, value, accent }) {
  const color = { horizonte: 'text-horizonte', aizome: 'text-aizome' }[accent] || 'text-aizome';
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

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`chip ${active ? 'bg-obsidiana text-washi border-obsidiana' : 'text-ink-dim border-line hover:border-obsidiana'}`}
    >
      {children}
    </button>
  );
}

function Block({ block: b, theme }) {
  const [open, setOpen] = useState(true);
  const addNote = useStore((s) => s.addNote);
  const notes = useStore((s) => s.notes);
  const [justSaved, setJustSaved] = useState(false);
  const saved = justSaved || notes.some((n) => n.title === b.title && n.subject === theme);

  const save = () => {
    addNote({ subject: theme, title: b.title, body: composeNoteBody(b, theme) });
    setJustSaved(true);
  };

  return (
    <Card className={b.hot ? 'border-l-2 border-l-danger' : ''}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-start justify-between gap-2 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-heading font-bold text-base">{b.title}</h3>
          {b.hot && <span className="chip text-danger border-danger/40 bg-danger/5"><Flame size={10} /> Em alta</span>}
        </div>
        <ChevronDown size={16} className={`text-ink-dim shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <p className="text-sm text-ink-dim mt-2">{b.summary}</p>

      {open && (
        <div className="mt-3 space-y-3">
          {b.events?.length > 0 && (
            <BulletGroup label="O que aconteceu" items={b.events} dot="bg-aizome" />
          )}
          {b.impacts?.length > 0 && (
            <BulletGroup label="Por que importa" items={b.impacts} dot="bg-horizonte" />
          )}
          {b.sources?.length > 0 && (
            <div>
              <h4 className="label mb-1.5">Para se aprofundar</h4>
              <div className="flex flex-wrap gap-1.5">
                {b.sources.map((s, i) => {
                  const SIcon = SOURCE_ICON[s.type] || Link2;
                  return (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 chip hover:border-obsidiana transition-colors ${s.type === 'video' ? 'text-danger border-danger/40' : 'text-aizome border-aizome/40'}`}>
                      <SIcon size={11} /> <span className="normal-case tracking-normal font-body">{s.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Always-visible footer: source + save-to-notes */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-line/60">
        {b.from?.length > 0 ? (
          <span className="text-[0.66rem] text-ink-dim flex items-center gap-1 min-w-0">
            <Sparkles size={10} className="text-horizonte shrink-0" />
            <span className="truncate">Consolidado de: {b.from.join(', ')}</span>
          </span>
        ) : <span />}
        {saved ? (
          <span className="inline-flex items-center gap-2 text-[0.64rem] font-mono uppercase tracking-[0.06em] text-success shrink-0">
            <Check size={13} /> Salvo
            <Link to="/estudos" className="text-aizome hover:underline normal-case tracking-normal">ver nota</Link>
          </span>
        ) : (
          <button onClick={save} className="btn-soft py-1 px-2.5 text-[0.62rem] shrink-0" title="Salvar como nota em Estudos Livres">
            <BookmarkPlus size={12} /> Salvar como nota
          </button>
        )}
      </div>
    </Card>
  );
}

function BulletGroup({ label, items, dot }) {
  return (
    <div>
      <h4 className="label mb-1.5">{label}</h4>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${dot}`} />
            <span className="text-obsidiana/90">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FixedIncomePanel() {
  return (
    <Card className="mt-3 border-l-2 border-l-warn">
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Wallet size={16} className="text-warn" />
          <h3 className="font-heading font-bold text-base">Renda Fixa do dia</h3>
          <span className="chip text-ink-dim border-line">{fmtShort(FIXED_INCOME_PANEL.date)}</span>
        </div>
        <a href={FIXED_INCOME_PANEL.emailUrl} target="_blank" rel="noopener noreferrer"
          className="text-[0.66rem] font-mono uppercase tracking-[0.06em] text-aizome hover:underline inline-flex items-center gap-1">
          Ver e-mail original <ArrowUpRight size={11} />
        </a>
      </div>
      <p className="text-[0.78rem] text-ink-dim mb-1">{FIXED_INCOME_PANEL.summary}</p>
      <p className="text-[0.72rem] mb-3 flex items-center gap-1.5">
        <span className="font-mono text-[0.56rem] uppercase tracking-[0.1em] text-ink-dim">Perfil</span>
        <span className="text-obsidiana/90">{FIXED_INCOME_PANEL.profile}</span>
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {FIXED_INCOME_PANEL.groups.map((g, i) => (
          <div key={i} className="border border-line rounded-sharp overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-washi-soft/60 border-b border-line">
              <span className="font-heading font-bold text-[0.82rem]">{g.label}</span>
              <span className="chip text-ink-dim border-line">{g.tag}</span>
            </div>
            <ul className="divide-y divide-line/60">
              {g.offers.map((o, j) => (
                <li key={j} className="flex items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[0.78rem] flex items-center gap-1">
                      {o.best && <Star size={11} className="fill-warn text-warn shrink-0" />}
                      <span className="font-medium">{o.rate}</span>
                    </p>
                    <p className="text-[0.66rem] text-ink-dim">{o.name}</p>
                  </div>
                  <span className="chip text-ink-dim border-line shrink-0">{o.bank}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-[0.7rem] text-warn mt-3 flex items-start gap-1.5">
        <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {FIXED_INCOME_PANEL.reminder}
      </p>
      <p className="text-[0.66rem] text-ink-dim mt-2 pt-2 border-t border-line">
        ⭐ = melhor taxa do grupo. Peça “atualiza a renda fixa” a cada novo relatório — a partir do próximo, mostro também as
        <b> mudanças</b> (novas ofertas, saídas e variação de taxa) em relação ao dia anterior.
      </p>
    </Card>
  );
}

function compatStyle(v) {
  if (v >= 85) return { bar: 'success', text: 'text-success', border: 'border-success/40', bg: 'bg-success/5' };
  if (v >= 75) return { bar: 'aizome', text: 'text-aizome', border: 'border-aizome/40', bg: 'bg-aizome-soft' };
  return { bar: 'warn', text: 'text-warn', border: 'border-warn/40', bg: 'bg-warn/5' };
}

function DeadlineChip({ iso, label }) {
  const d = daysUntil(iso);
  let cls = 'text-ink-dim border-line';
  let txt = label;
  if (d != null) {
    if (d < 0) { cls = 'text-danger border-danger/40 bg-danger/5'; txt = `${label} · encerrado`; }
    else if (d === 0) { cls = 'text-danger border-danger/40 bg-danger/5'; txt = `${label} · encerra hoje`; }
    else if (d <= 7) { cls = 'text-warn border-warn/40 bg-warn/5'; txt = `${label} · ${d}d`; }
  }
  return <span className={`chip ${cls}`}><CalendarClock size={10} /> {txt}</span>;
}

function OpportunitiesSection() {
  const [showExcluded, setShowExcluded] = useState(false);
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-1">
        <Zap size={18} className="text-horizonte" />
        <h2 className="font-heading font-bold text-xl">Radar de Oportunidades</h2>
        <span className="chip text-horizonte border-horizonte/40 bg-horizonte-soft">{OPPORTUNITIES.length} aprovadas</span>
      </div>
      <p className="text-[0.72rem] text-ink-dim mb-2 flex items-start gap-1.5">
        <Filter size={12} className="mt-0.5 shrink-0 text-aizome" />
        Filtradas e pontuadas pelo seu perfil — apenas as abertas a brasileiros, financiadas, sem taxa alta e nas quais você é elegível.
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {OPP_PROFILE.criteria.map((c) => (
          <span key={c} className="chip text-ink-dim border-line"><Check size={10} className="text-success" /> {c}</span>
        ))}
      </div>

      <div className="space-y-3">
        {OPPORTUNITIES.map((o) => <OpportunityCard key={o.id} o={o} />)}
      </div>

      {/* Descartadas */}
      <button
        onClick={() => setShowExcluded((v) => !v)}
        className="mt-4 inline-flex items-center gap-1.5 text-[0.68rem] font-mono uppercase tracking-[0.06em] text-ink-dim hover:text-obsidiana"
      >
        <XCircle size={13} /> {OPPORTUNITIES_EXCLUDED.length} descartadas pelo filtro
        <ChevronDown size={13} className={`transition-transform ${showExcluded ? 'rotate-180' : ''}`} />
      </button>
      {showExcluded && (
        <ul className="mt-2 space-y-1.5">
          {OPPORTUNITIES_EXCLUDED.map((e, i) => (
            <li key={i} className="flex items-start gap-2 text-[0.78rem]">
              <XCircle size={13} className="mt-0.5 shrink-0 text-danger/70" />
              <span><strong className="font-medium">{e.title}</strong> — <span className="text-ink-dim">{e.reason}</span></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function OpportunityCard({ o }) {
  const cs = compatStyle(o.compatibility);
  return (
    <Card className={`${cs.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading font-bold text-base leading-tight">{o.title}</h3>
          <p className="text-[0.72rem] text-ink-dim mt-0.5">{o.org} · {o.location}</p>
        </div>
        <div className={`shrink-0 text-right ${cs.text}`}>
          <div className="font-heading font-bold text-2xl leading-none">{o.compatibility}%</div>
          <span className="font-mono text-[0.52rem] uppercase tracking-[0.1em] text-ink-dim">compatível</span>
        </div>
      </div>

      <div className="my-2">
        <ProgressBar value={o.compatibility} color={cs.bar} />
      </div>

      <p className="text-sm text-ink-dim">{o.summary}</p>

      <div className="flex flex-wrap gap-1.5 my-3">
        <span className="chip text-ink-dim border-line">{o.category}</span>
        <DeadlineChip iso={o.deadlineISO} label={o.deadline} />
        <span className="chip text-success border-success/40 bg-success/5"><Gift size={10} /> {o.funded}</span>
        <span className={`chip ${o.feeOk ? 'text-ink-dim border-line' : 'text-danger border-danger/40'}`}><Coins size={10} /> {o.fee}</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-1">
        <div>
          <h4 className="label mb-1.5">Benefícios</h4>
          <ul className="space-y-1">
            {o.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[0.8rem]"><Gift size={11} className="mt-0.5 shrink-0 text-success" /> {b}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="label mb-1.5">Requisitos</h4>
          <ul className="space-y-1">
            {o.requirements.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[0.8rem]"><ListChecks size={11} className="mt-0.5 shrink-0 text-aizome" /> {r}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className={`text-[0.76rem] mt-3 p-2 rounded-sharp ${cs.bg} flex items-start gap-1.5`}>
        <Sparkles size={12} className={`mt-0.5 shrink-0 ${cs.text}`} />
        <span><strong className="font-medium">Por que combina:</strong> {o.reason}</span>
      </p>

      <div className="flex items-center gap-3 mt-3">
        <a href={o.url} target="_blank" rel="noopener noreferrer" className="btn-primary py-1.5 px-3 text-[0.66rem]">
          <ExternalLink size={12} /> Ver edital
        </a>
        <a href={o.emailUrl} target="_blank" rel="noopener noreferrer"
          className="text-[0.68rem] font-mono uppercase tracking-[0.06em] text-aizome hover:underline inline-flex items-center gap-1">
          Abrir e-mail <ArrowUpRight size={11} />
        </a>
      </div>
    </Card>
  );
}
