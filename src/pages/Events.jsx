import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader, Card, EmptyState } from '../components/ui';
import { EVENTS, EVENT_CATEGORIES, EVENT_CATEGORY_COLOR, EVENTS_GENERATED_AT } from '../data/events';
import { daysUntil, fmtShort, todayISO } from '../lib/date';
import {
  Radar, Search, Star, CalendarPlus, ExternalLink, MapPin, Globe, Video, Clock,
  Sparkles, Building2, AlertTriangle, Check, History, ThumbsUp, Flame, Eye,
} from 'lucide-react';

const DOT = {
  aizome: 'bg-aizome', horizonte: 'bg-horizonte', warn: 'bg-warn',
  success: 'bg-success', fatura: 'bg-fatura', ink: 'bg-obsidiana',
};
const CHIP = {
  aizome: 'text-aizome border-aizome/40 bg-aizome-soft',
  horizonte: 'text-horizonte border-horizonte/40 bg-horizonte-soft',
  warn: 'text-warn border-warn/40 bg-warn/5',
  success: 'text-success border-success/40 bg-success/5',
  fatura: 'text-fatura border-fatura/40 bg-fatura-soft',
};
const FORMAT_LABEL = { presencial: 'Presencial', online: 'Online', hibrido: 'Híbrido' };
const PRIO_WEIGHT = { alta: 2, media: 1, baixa: 0 };

// Deadline urgency → chip style + label. null when there's no deadline.
function deadlineMeta(ev) {
  if (!ev.deadline) return null;
  const d = daysUntil(ev.deadline);
  if (d == null) return null;
  if (d < 0) return { closed: true, cls: 'text-ink-dim border-line', label: `Inscrição encerrada · ${fmtShort(ev.deadline)}` };
  if (d === 0) return { urgent: true, cls: 'text-danger border-danger/40 bg-danger/5', label: 'Inscrição encerra hoje' };
  if (d <= 5) return { urgent: true, cls: 'text-danger border-danger/40 bg-danger/5', label: `Encerra em ${d}d · ${fmtShort(ev.deadline)}` };
  if (d <= 14) return { soon: true, cls: 'text-warn border-warn/40 bg-warn/5', label: `Inscrição até ${fmtShort(ev.deadline)} · ${d}d` };
  return { cls: 'text-ink-dim border-line', label: `Inscrição até ${fmtShort(ev.deadline)}` };
}

const refDate = (ev) => ev.date || ev.deadline || '';

// Rede de segurança: um evento está encerrado quando a data já passou OU o prazo
// de inscrição já venceu. Encerrados somem do radar (Todos/Recomendados) mesmo
// que continuem no snapshot — assim nada "velho" aparece entre atualizações.
function isClosed(ev, today) {
  if (ev.date && ev.date < today) return true;
  if (ev.deadline && ev.deadline < today) return true;
  return false;
}

export default function Events() {
  const saved = useStore((s) => s.savedEvents);
  const viewed = useStore((s) => s.viewedEvents);
  const linked = useStore((s) => s.linkedEvents);
  const seenAt = useStore((s) => s.eventsSeenAt);
  const toggleSave = useStore((s) => s.toggleSaveEvent);
  const markViewed = useStore((s) => s.markEventViewed);
  const markSeen = useStore((s) => s.markEventsSeen);
  const addToCal = useStore((s) => s.addEventToCalendar);

  const [tab, setTab] = useState('todos');
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [format, setFormat] = useState('');
  const [when, setWhen] = useState('');

  const today = todayISO();
  const open = useMemo(() => EVENTS.filter((e) => !isClosed(e, today)), [today]);
  const seenDate = seenAt ? seenAt.slice(0, 10) : '';
  const isNew = (ev) => !seenDate || ev.addedAt > seenDate;
  const newCount = open.filter(isNew).length;

  const cities = useMemo(() => [...new Set(open.map((e) => e.city))].sort(), [open]);

  const applyFilters = (list) =>
    list.filter((ev) => {
      if (city && ev.city !== city) return false;
      if (category && ev.category !== category) return false;
      if (format && ev.format !== format) return false;
      if (q) {
        const hay = `${ev.name} ${ev.org} ${ev.description} ${ev.reason} ${ev.city} ${ev.category} ${(ev.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (when === 'semana' || when === 'mes') {
        const d = daysUntil(refDate(ev));
        if (d == null || d < 0) return false;
        if (when === 'semana' && d > 7) return false;
        if (when === 'mes' && d > 31) return false;
      }
      if (when === 'aberto') {
        const d = daysUntil(ev.deadline);
        if (d != null && d < 0) return false; // encerrado
      }
      return true;
    });

  // Base sort: highest priority first, then soonest reference date (empty last).
  const byRelevance = (a, b) => {
    if (PRIO_WEIGHT[b.priority] !== PRIO_WEIGHT[a.priority]) return PRIO_WEIGHT[b.priority] - PRIO_WEIGHT[a.priority];
    const ra = refDate(a) || '9999-99-99', rb = refDate(b) || '9999-99-99';
    return ra.localeCompare(rb);
  };

  // Recommendations from affinity: categories/orgs of saved (weight 3) and
  // viewed (weight 2 for the 10 most recent, else 1) events.
  const recommended = useMemo(() => {
    const catW = {}, orgW = {};
    const add = (id, w) => {
      const e = EVENTS.find((x) => x.id === id);
      if (!e) return;
      catW[e.category] = (catW[e.category] || 0) + w;
      (e.org || '').split(',').forEach((o) => { const k = o.trim(); if (k) orgW[k] = (orgW[k] || 0) + w; });
    };
    saved.forEach((id) => add(id, 3));
    viewed.forEach((id, i) => add(id, i < 10 ? 2 : 1));
    const hasHistory = saved.length > 0 || viewed.length > 0;
    const topCat = Object.entries(catW).sort((a, b) => b[1] - a[1])[0]?.[0];
    const scored = open
      .filter((e) => !saved.includes(e.id))
      .map((e) => {
        let sc = (catW[e.category] || 0) * 2;
        (e.org || '').split(',').forEach((o) => { sc += orgW[o.trim()] || 0; });
        sc += PRIO_WEIGHT[e.priority];
        return { e, sc };
      })
      .sort((a, b) => b.sc - a.sc || byRelevance(a.e, b.e));
    const list = (hasHistory ? scored.filter((x) => x.sc > PRIO_WEIGHT[x.e.priority]) : scored)
      .slice(0, 6)
      .map((x) => x.e);
    return { list, topCat, hasHistory };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved, viewed, open]);

  let list;
  if (tab === 'favoritos') list = applyFilters(EVENTS.filter((e) => saved.includes(e.id))).sort(byRelevance);
  else if (tab === 'historico') list = applyFilters(viewed.map((id) => EVENTS.find((e) => e.id === id)).filter(Boolean));
  else if (tab === 'recomendados') list = applyFilters(recommended.list);
  else list = applyFilters([...open].sort(byRelevance));

  const TABS = [
    { key: 'todos', label: 'Todos', icon: Radar, count: open.length },
    { key: 'recomendados', label: 'Recomendados', icon: ThumbsUp, count: recommended.list.length },
    { key: 'favoritos', label: 'Favoritos', icon: Star, count: saved.length },
    { key: 'historico', label: 'Histórico', icon: History, count: viewed.length },
  ];

  return (
    <>
      <PageHeader eyebrow="Módulo 15 · Radar de oportunidades" title="Eventos">
        <span className="hidden sm:flex items-center gap-1.5 font-mono text-[0.62rem] text-ink-dim">
          <Sparkles size={12} className="text-horizonte" /> snapshot {fmtShort(EVENTS_GENERATED_AT)}
        </span>
      </PageHeader>

      {/* New-since-last-visit banner */}
      {newCount > 0 && (
        <Card className="mb-4 border-horizonte/40 bg-horizonte-soft/40">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm flex items-center gap-2">
              <Flame size={15} className="text-horizonte shrink-0" />
              <span><b>{newCount}</b> {newCount === 1 ? 'evento novo' : 'eventos novos'} desde sua última visita.</span>
            </p>
            <button className="btn-soft" onClick={markSeen}><Check size={13} /> Marcar como vistos</button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 font-mono text-[0.65rem] uppercase tracking-[0.06em] border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.key ? 'border-aizome text-aizome' : 'border-transparent text-ink-dim hover:text-obsidiana'
            }`}
          >
            <t.icon size={13} /> {t.label} <span className="chip text-ink-dim border-line">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 border border-line rounded-sharp px-3 mb-3">
          <Search size={15} className="text-ink-dim shrink-0" />
          <input
            className="w-full bg-transparent py-2 text-sm outline-none"
            placeholder="Buscar por nome, empresa, tema, cidade..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && <button onClick={() => setQ('')} className="text-ink-dim hover:text-obsidiana text-xs">limpar</button>}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <FilterSelect label="Cidade" value={city} onChange={setCity} options={cities} />
          <FilterSelect label="Categoria" value={category} onChange={setCategory} options={EVENT_CATEGORIES} />
          <FilterSelect label="Formato" value={format} onChange={setFormat}
            options={[['presencial', 'Presencial'], ['online', 'Online'], ['hibrido', 'Híbrido']]} />
          <FilterSelect label="Data / prazo" value={when} onChange={setWhen}
            options={[['semana', 'Próx. 7 dias'], ['mes', 'Próx. 30 dias'], ['aberto', 'Inscrição aberta']]} allLabel="Qualquer data" />
        </div>
      </Card>

      {tab === 'recomendados' && recommended.hasHistory && recommended.topCat && (
        <p className="text-[0.72rem] text-ink-dim mb-3 flex items-center gap-1.5">
          <Sparkles size={12} className="text-horizonte" />
          Baseado no que você salva e acessa — com peso para <b className="text-obsidiana">{recommended.topCat}</b>.
        </p>
      )}
      {tab === 'recomendados' && !recommended.hasHistory && (
        <p className="text-[0.72rem] text-ink-dim mb-3 flex items-center gap-1.5">
          <Sparkles size={12} className="text-horizonte" />
          Comece a favoritar e abrir eventos — as recomendações se ajustam ao seu interesse. Por ora, os de maior prioridade.
        </p>
      )}

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon={tab === 'favoritos' ? Star : tab === 'historico' ? History : Radar}
            title={
              tab === 'favoritos' ? 'Nenhum favorito ainda'
              : tab === 'historico' ? 'Nenhum evento visto ainda'
              : 'Nenhum evento com esses filtros'
            }
            hint={
              tab === 'favoritos' ? 'Toque na estrela de um evento para salvá-lo aqui.'
              : tab === 'historico' ? 'Os eventos que você abrir aparecem aqui.'
              : 'Ajuste ou limpe os filtros para ver mais oportunidades.'
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((ev) => (
            <EventCard
              key={ev.id}
              ev={ev}
              saved={saved.includes(ev.id)}
              linked={linked.includes(ev.id)}
              fresh={isNew(ev)}
              onSave={() => toggleSave(ev.id)}
              onView={() => markViewed(ev.id)}
              onAdd={() => addToCal(ev)}
            />
          ))}
        </div>
      )}

      <p className="text-[0.66rem] text-ink-dim mt-4">
        Radar curado a partir de busca real na web (fontes em cada evento). Peça <b>“atualiza meus eventos”</b> para eu
        refazer a pesquisa e trazer novas oportunidades.
      </p>
    </>
  );
}

function FilterSelect({ label, value, onChange, options, allLabel }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allLabel || `Todas`}</option>
        {options.map((o) => {
          const [v, l] = Array.isArray(o) ? o : [o, o];
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </label>
  );
}

function EventCard({ ev, saved, linked, fresh, onSave, onView, onAdd }) {
  const color = EVENT_CATEGORY_COLOR[ev.category] || 'aizome';
  const dl = deadlineMeta(ev);
  const online = ev.format === 'online';
  const FormatIcon = online ? Globe : ev.format === 'hibrido' ? Video : MapPin;
  const canAdd = !!(ev.date || ev.deadline);

  return (
    <Card className={`flex flex-col gap-2 ${dl?.urgent ? 'border-l-2 border-l-danger' : ''}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`chip ${CHIP[color] || CHIP.aizome}`}>{ev.category}</span>
            {ev.priority === 'alta' && (
              <span className="chip text-danger border-danger/40 bg-danger/5"><Flame size={10} /> Prioridade</span>
            )}
            {fresh && <span className="chip text-horizonte border-horizonte/40 bg-horizonte-soft">Novo</span>}
            {linked && <span className="chip text-success border-success/40 bg-success/5"><Check size={10} /> Na agenda</span>}
          </div>
          <h3 className="font-heading font-bold text-[0.95rem] leading-snug">{ev.name}</h3>
          <p className="text-[0.72rem] text-ink-dim flex items-center gap-1 mt-0.5">
            <Building2 size={11} className="shrink-0" /> {ev.org}
          </p>
        </div>
        <button
          onClick={onSave}
          aria-label={saved ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          title={saved ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          className={`shrink-0 p-1 rounded-sharp transition-colors ${saved ? 'text-warn' : 'text-ink-dim hover:text-warn'}`}
        >
          <Star size={18} className={saved ? 'fill-warn' : ''} />
        </button>
      </div>

      {/* Meta line: date, format, city */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] text-ink-dim">
        <span className="flex items-center gap-1">
          <Clock size={11} className="shrink-0" />
          {ev.date ? fmtShort(ev.date) : 'data a confirmar'}{ev.time ? ` · ${ev.time}` : ''}
        </span>
        <span className="flex items-center gap-1"><FormatIcon size={11} className="shrink-0" /> {FORMAT_LABEL[ev.format]}</span>
        <span className="flex items-center gap-1"><MapPin size={11} className="shrink-0" /> {ev.city}</span>
      </div>

      {dl && (
        <span className={`chip w-fit ${dl.cls}`}>
          {dl.urgent ? <AlertTriangle size={10} /> : <Clock size={10} />} {dl.label}
        </span>
      )}

      <p className="text-[0.8rem] text-obsidiana/90 leading-snug">{ev.description}</p>

      <div className="border-l-2 border-aizome/40 pl-2">
        <span className="label flex items-center gap-1 mb-0.5"><Sparkles size={10} /> Por que é relevante</span>
        <p className="text-[0.75rem] text-ink-dim">{ev.reason}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <a
          href={ev.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onView}
          className="btn-primary py-1.5"
        >
          <ExternalLink size={13} /> Inscrição oficial
        </a>
        <button
          className="btn-soft py-1.5"
          onClick={onAdd}
          disabled={!canAdd || linked}
          title={!canAdd ? 'Sem data definida para agendar' : linked ? 'Já está na sua agenda' : 'Adicionar ao calendário'}
        >
          {linked ? <><Check size={13} /> Na agenda</> : <><CalendarPlus size={13} /> Agendar</>}
        </button>
        {ev.venue && !online && (
          <span className="text-[0.68rem] text-ink-dim flex items-center gap-1"><MapPin size={10} /> {ev.venue}</span>
        )}
      </div>
    </Card>
  );
}
