import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader, Card } from '../components/ui';
import { getCalendarItems, itemsByDate } from '../store/selectors';
import { todayISO, addDays, fmtLong } from '../lib/date';
import { ChevronLeft, ChevronRight, Clock, Video, MapPin, Sun } from 'lucide-react';

const COLOR_DOT = {
  aizome: 'bg-aizome', horizonte: 'bg-horizonte', danger: 'bg-danger',
  success: 'bg-success', ink: 'bg-obsidiana', obsidiana: 'bg-obsidiana',
  warn: 'bg-warn', fatura: 'bg-fatura',
};

const isLink = (s) => /^(https?:\/\/|www\.)/i.test((s || '').trim());

export default function Timeline() {
  const timeline = useStore((s) => s.timeline) || {};
  const setTimelineSlot = useStore((s) => s.setTimelineSlot);
  const state = useStore();

  const [date, setDate] = useState(todayISO());
  const [show24, setShow24] = useState(false);

  const today = todayISO();
  const isToday = date === today;
  const currentHour = new Date().getHours();

  // Compromissos do dia agrupados por hora (referência ao lado do cronograma).
  const { byHour, allDay } = useMemo(() => {
    const dayItems = itemsByDate(getCalendarItems(state))[date] || [];
    const map = {};
    const noTime = [];
    for (const it of dayItems) {
      if (it.time) (map[Number(it.time.slice(0, 2))] = map[Number(it.time.slice(0, 2))] || []).push(it);
      else noTime.push(it);
    }
    return { byHour: map, allDay: noTime };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, state.events, state.processes, state.academic, state.courses, state.goals]);

  const dayPlan = timeline[date] || {};
  const hours = show24 ? range(0, 23) : range(6, 23);
  const filled = Object.keys(dayPlan).length;

  return (
    <>
      <PageHeader eyebrow="Módulo 16 · Cronograma do dia" title="Cronograma">
        <button className="btn-soft py-1.5 px-3" onClick={() => setShow24((v) => !v)}>
          {show24 ? 'Horário comercial' : 'Mostrar 24h'}
        </button>
      </PageHeader>

      {/* Navegação de dia */}
      <Card className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-sharp hover:bg-washi-soft" onClick={() => setDate(addDays(date, -1))} aria-label="Dia anterior"><ChevronLeft size={18} /></button>
            <div>
              <h2 className="font-heading font-bold text-lg capitalize leading-none">
                {fmtLong(date)}{isToday && <span className="ml-2 chip text-aizome border-aizome/40 bg-aizome-soft align-middle">hoje</span>}
              </h2>
              <p className="text-[0.68rem] text-ink-dim mt-1">{filled} horário(s) preenchido(s)</p>
            </div>
            <button className="p-1.5 rounded-sharp hover:bg-washi-soft" onClick={() => setDate(addDays(date, 1))} aria-label="Próximo dia"><ChevronRight size={18} /></button>
          </div>
          {!isToday && <button className="btn-soft" onClick={() => setDate(today)}>Hoje</button>}
        </div>

        {allDay.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-line">
            <span className="font-mono text-[0.56rem] uppercase tracking-[0.1em] text-ink-dim">Dia todo</span>
            {allDay.map((it) => (
              <span key={it.id} className="chip text-ink-dim border-line">
                <span className={`w-1.5 h-1.5 rounded-full ${COLOR_DOT[it.color] || 'bg-aizome'}`} /> {it.title}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Grade de horários */}
      <div className="card overflow-hidden">
        <div className="hidden sm:grid grid-cols-[4.5rem_11rem_1fr] gap-3 px-3 py-2 border-b border-line bg-washi-soft/60 font-mono text-[0.56rem] uppercase tracking-[0.1em] text-ink-dim">
          <span>Hora</span><span>Compromissos</span><span>O que vou fazer</span>
        </div>
        <div>
          {hours.map((h) => {
            const label = `${String(h).padStart(2, '0')}:00`;
            const events = byHour[h] || [];
            const isCurrent = isToday && h === currentHour;
            return (
              <div
                key={h}
                className={`grid grid-cols-[3.2rem_1fr] sm:grid-cols-[4.5rem_11rem_1fr] gap-x-3 gap-y-1.5 items-start px-3 py-2 border-b border-line/60 last:border-0 ${
                  isCurrent ? 'bg-aizome-soft' : ''
                }`}
              >
                {/* Hora */}
                <div className="flex items-center gap-1.5 pt-1.5">
                  <span className={`font-mono text-xs ${isCurrent ? 'text-aizome font-bold' : 'text-ink-dim'}`}>{label}</span>
                  {isCurrent && <Clock size={11} className="text-aizome" />}
                </div>

                {/* Compromissos do calendário nesta hora */}
                <div className="hidden sm:flex flex-col gap-1 pt-1 min-w-0">
                  {events.length === 0 ? (
                    <span className="text-[0.68rem] text-ink-dim/50">—</span>
                  ) : (
                    events.map((it) => {
                      const link = it.meetingLink || (isLink(it.location) ? it.location : '');
                      return (
                        <div key={it.id} className="flex items-start gap-1 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${COLOR_DOT[it.color] || 'bg-aizome'}`} />
                          <div className="min-w-0">
                            <span className="text-[0.72rem] leading-tight block truncate" title={it.title}>
                              <b className="font-mono">{it.time}{it.endTime ? `–${it.endTime}` : ''}</b> {it.title}
                            </span>
                            {link && (
                              <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="text-[0.64rem] text-aizome hover:underline inline-flex items-center gap-0.5">
                                <Video size={9} /> entrar
                              </a>
                            )}
                            {!link && isLink(it.location) === false && it.location && (
                              <span className="text-[0.64rem] text-ink-dim inline-flex items-center gap-0.5"><MapPin size={9} /> {it.location}</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Espaço editável — o plano da hora */}
                <input
                  className="w-full bg-transparent border border-transparent hover:border-line focus:border-aizome rounded-sharp px-2 py-1.5 text-sm outline-none transition-colors"
                  placeholder="O que vou fazer neste horário..."
                  value={dayPlan[label] || ''}
                  onChange={(e) => setTimelineSlot(date, label, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[0.68rem] text-ink-dim mt-4 flex items-start gap-1.5">
        <Sun size={12} className="mt-0.5 shrink-0 text-warn" />
        Escreva ao lado de cada hora o que planeja fazer. Os compromissos do seu calendário (aulas, reuniões, etapas de
        processo…) aparecem automaticamente na hora certa, como referência. Tudo é salvo sozinho e sincroniza com a nuvem.
      </p>
    </>
  );
}

function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}
