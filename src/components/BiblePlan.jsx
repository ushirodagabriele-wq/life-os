import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Card, ProgressBar } from './ui';
import { BIBLE_PLAN, BIBLE_PLAN_COLUMNS, TOTAL_DAYS } from '../data/biblePlan';
import { Check, BookMarked, Flame, Target, CircleDot, ArrowDownToLine, RotateCcw, PartyPopper } from 'lucide-react';

export default function BiblePlan() {
  const biblePlan = useStore((s) => s.biblePlan) || { done: [] };
  const toggleBibleDay = useStore((s) => s.toggleBibleDay);
  const resetBiblePlan = useStore((s) => s.resetBiblePlan);
  const [filter, setFilter] = useState('todos');

  const doneSet = useMemo(() => new Set(biblePlan.done || []), [biblePlan.done]);
  const doneCount = doneSet.size;
  const remaining = TOTAL_DAYS - doneCount;
  const pct = Math.round((doneCount / TOTAL_DAYS) * 100);
  // "Leitura de hoje" = primeiro dia ainda não concluído (continue de onde parou).
  const currentDay = useMemo(() => {
    for (let d = 1; d <= TOTAL_DAYS; d++) if (!doneSet.has(d)) return d;
    return null;
  }, [doneSet]);
  const complete = currentDay === null;

  const rows = useMemo(() => {
    if (filter === 'pendentes') return BIBLE_PLAN.filter(([d]) => !doneSet.has(d));
    if (filter === 'concluidos') return BIBLE_PLAN.filter(([d]) => doneSet.has(d));
    return BIBLE_PLAN;
  }, [filter, doneSet]);

  const goToday = () => {
    if (!currentDay) return;
    setFilter('todos');
    setTimeout(() => {
      document.getElementById(`bp-dia-${currentDay}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const currentReadings = currentDay ? BIBLE_PLAN[currentDay - 1] : null;

  return (
    <>
      {/* Progresso */}
      <Card className="mb-4">
        <div className="flex items-end justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <BookMarked size={16} className="text-aizome" />
              <h2 className="font-heading font-bold text-lg">Plano de Leitura Bíblica</h2>
            </div>
            <p className="text-[0.72rem] text-ink-dim mt-0.5">Plano anual · 366 dias · Zion Church</p>
          </div>
          <div className="text-right">
            <div className="font-heading font-bold text-3xl leading-none">{pct}%</div>
            <span className="text-[0.66rem] text-ink-dim">concluído</span>
          </div>
        </div>
        <ProgressBar value={pct} color="aizome" className="h-2" />
        <div className="grid grid-cols-3 gap-2 mt-3">
          <Stat icon={Check} label="Dias lidos" value={doneCount} accent="text-success" />
          <Stat icon={Target} label="Restantes" value={remaining} accent="text-warn" />
          <Stat icon={CircleDot} label="Total" value={TOTAL_DAYS} accent="text-ink-dim" />
        </div>
      </Card>

      {/* Leitura de hoje */}
      {complete ? (
        <Card className="mb-4 border-success/40 bg-success/5">
          <div className="flex items-center gap-3">
            <PartyPopper size={22} className="text-success shrink-0" />
            <div>
              <h3 className="font-heading font-bold text-base">Plano concluído! 🎉</h3>
              <p className="text-sm text-ink-dim">Você leu os 366 dias. Que jornada — parabéns pela constância.</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mb-4 border-aizome/40 bg-aizome-soft/40">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span className="eyebrow">Sua leitura de hoje</span>
              <h3 className="font-heading font-bold text-lg mt-0.5">Dia {currentDay}</h3>
            </div>
            <button className="btn-primary shrink-0" onClick={() => toggleBibleDay(currentDay)}>
              <Check size={14} /> Marcar como lido
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-2">
            {currentReadings.slice(1).map((r, i) => (
              <div key={i} className="border border-line rounded-sharp px-3 py-2 bg-washi">
                <span className="block font-mono text-[0.56rem] uppercase tracking-[0.1em] text-ink-dim mb-0.5">
                  {BIBLE_PLAN_COLUMNS[i]}
                </span>
                <span className="text-sm font-medium">{r}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filtro + ações */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex gap-1.5">
          {[['todos', 'Todos'], ['pendentes', 'Pendentes'], ['concluidos', 'Concluídos']].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`chip ${filter === k ? 'bg-obsidiana text-washi border-obsidiana' : 'text-ink-dim border-line hover:border-obsidiana'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {!complete && (
            <button className="btn-soft py-1.5 px-3" onClick={goToday}>
              <ArrowDownToLine size={13} /> Ir para hoje
            </button>
          )}
          <button
            className="btn-soft py-1.5 px-3 hover:!text-danger hover:!border-danger"
            onClick={() => window.confirm('Zerar todo o progresso do plano de leitura?') && resetBiblePlan()}
            title="Zerar progresso"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Lista de dias */}
      <Card className="p-0 overflow-hidden">
        {/* Header (desktop) */}
        <div className="hidden md:grid grid-cols-[auto_3.5rem_1fr_1fr_1fr] gap-3 px-3 py-2 border-b border-line bg-washi-soft/60 font-mono text-[0.56rem] uppercase tracking-[0.1em] text-ink-dim">
          <span className="w-5" />
          <span>Dia</span>
          {BIBLE_PLAN_COLUMNS.map((c) => <span key={c}>{c}</span>)}
        </div>
        <div>
          {rows.map(([day, r1, r2, r3]) => {
            const isDone = doneSet.has(day);
            const isCurrent = day === currentDay;
            return (
              <div
                key={day}
                id={`bp-dia-${day}`}
                className={`grid grid-cols-[auto_3.5rem_1fr] md:grid-cols-[auto_3.5rem_1fr_1fr_1fr] gap-x-3 gap-y-1 items-center px-3 py-2 border-b border-line/60 last:border-0 transition-colors ${
                  isCurrent ? 'bg-aizome-soft ring-1 ring-inset ring-aizome/40' : isDone ? 'bg-success/5' : 'hover:bg-washi-soft/60'
                }`}
              >
                <button
                  onClick={() => toggleBibleDay(day)}
                  aria-label={isDone ? `Desmarcar dia ${day}` : `Marcar dia ${day} como lido`}
                  className={`w-5 h-5 rounded-sharp border shrink-0 flex items-center justify-center transition-colors ${
                    isDone ? 'bg-success border-success text-washi' : 'border-obsidiana/40 hover:border-success'
                  }`}
                >
                  {isDone && <Check size={12} strokeWidth={3} />}
                </button>
                <span className="flex items-center gap-1.5">
                  <span className={`font-mono text-xs ${isDone ? 'text-ink-dim' : 'text-obsidiana'}`}>{day}</span>
                  {isCurrent && <Flame size={11} className="text-aizome" title="Leitura de hoje" />}
                </span>
                {/* mobile: readings stacked in one cell; desktop: 3 cells */}
                <div className={`md:contents text-sm ${isDone ? 'line-through text-ink-dim' : ''}`}>
                  <span className="block md:inline">{r1}</span>
                  <span className="block md:inline text-ink-dim md:text-obsidiana/90">{r2}</span>
                  <span className="block md:inline text-ink-dim md:text-obsidiana/90">{r3}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="text-[0.68rem] text-ink-dim mt-4 flex items-start gap-1.5">
        <Check size={12} className="mt-0.5 shrink-0 text-success" />
        Seu progresso é salvo automaticamente neste navegador — você continua de onde parou. Sincronização entre dispositivos
        entra com a Fase 2 (backend).
      </p>
    </>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="border border-line rounded-sharp px-3 py-2">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={13} className={accent} />
        <span className="font-mono text-[0.54rem] uppercase tracking-[0.1em] text-ink-dim">{label}</span>
      </div>
      <span className="font-heading font-bold text-xl">{value}</span>
    </div>
  );
}
