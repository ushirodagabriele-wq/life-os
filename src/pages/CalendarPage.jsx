import { useState } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader, Card, Modal, Field, Input, Select, Textarea, IconBtn, currency } from '../components/ui';
import { getCalendarItems, itemsByDate } from '../store/selectors';
import {
  todayISO, monthGrid, isSameMonth, addDays, fmtMonthYear, WEEKDAYS,
  startOfWeek, fromISO, toISO, weekdayShort, fmtLong,
} from '../lib/date';
import { RECUR_OPTIONS, RECUR_LABEL } from '../lib/recurrence';
import { CATEGORIES as FINANCE_CATEGORIES } from '../lib/finance';
import GoogleCalendar from '../components/GoogleCalendar';
import { isRemembered, SCOPE_CALENDAR } from '../lib/google';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Check, CalendarDays,
  MapPin, Video, Receipt, Repeat,
} from 'lucide-react';

const COLOR_DOT = {
  aizome: 'bg-aizome', horizonte: 'bg-horizonte', danger: 'bg-danger',
  success: 'bg-success', ink: 'bg-obsidiana', obsidiana: 'bg-obsidiana',
  warn: 'bg-warn', fatura: 'bg-fatura',
  // subject colors (aulas) — must match data/schedule.js
  'sub-indigo': 'bg-sub-indigo', 'sub-sky': 'bg-sub-sky', 'sub-green': 'bg-sub-green',
  'sub-olive': 'bg-sub-olive', 'sub-amber': 'bg-sub-amber', 'sub-terra': 'bg-sub-terra',
  'sub-brick': 'bg-sub-brick', 'sub-rose': 'bg-sub-rose', 'sub-violet': 'bg-sub-violet',
  'sub-slate': 'bg-sub-slate',
};

// Detect whether a location string is a URL (meeting link) vs a physical address.
function isLink(str) {
  return /^(https?:\/\/|www\.)/i.test((str || '').trim());
}

// The small leading marker for an item in the grids: check when done, a receipt
// glyph for faturas, otherwise a colored dot.
function ItemMarker({ it }) {
  if (it.done) return <Check size={11} strokeWidth={3} className="shrink-0 text-success" />;
  if (it.category === 'fatura') return <Receipt size={11} className="shrink-0 text-fatura" />;
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${COLOR_DOT[it.color] || 'bg-aizome'}`} />;
}

export default function CalendarPage() {
  const state = useStore();
  const addEvent = useStore((s) => s.addEvent);
  const updateEvent = useStore((s) => s.updateEvent);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const toggleEventDate = useStore((s) => s.toggleEventDate);

  const [view, setView] = useState('month');
  const [cursor, setCursor] = useState(todayISO());
  const [selected, setSelected] = useState(todayISO());
  // null = closed · 'new' = creating · event object = editing
  const [eventModal, setEventModal] = useState(null);

  const openEdit = (refId) => {
    const ev = state.events.find((e) => e.id === refId);
    if (ev) setEventModal(ev);
  };

  // Click on an event pill in the grid: select its day and, if it's a personal
  // compromisso, open it for editing.
  const handleItemClick = (it) => {
    setSelected(it.date);
    if (it.module === 'calendar') openEdit(it.refId);
  };

  // Toggle attendance/payment for a single occurrence of a personal item.
  const toggleAttendance = (it) => toggleEventDate(it.refId, it.occDate || it.date);

  const items = getCalendarItems(state);
  const map = itemsByDate(items);

  const goPrev = () => setCursor(addDays(cursor, view === 'month' ? -28 : -7));
  const goNext = () => setCursor(addDays(cursor, view === 'month' ? 28 : 7));

  return (
    <>
      <PageHeader eyebrow="Módulo 03 · Calendário" title="Calendário Inteligente">
        <div className="flex items-center gap-1 border border-line rounded-sharp p-0.5">
          {['month', 'week'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.06em] rounded-sharp transition-colors ${
                view === v ? 'bg-obsidiana text-washi' : 'text-ink-dim hover:text-obsidiana'
              }`}
            >
              {v === 'month' ? 'Mês' : 'Semana'}
            </button>
          ))}
        </div>
        <button className="btn-ghost" onClick={() => setEventModal('new')}>
          <Plus size={14} /> Compromisso
        </button>
        <GoogleCalendar />
      </PageHeader>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IconBtn icon={ChevronLeft} label="Anterior" onClick={goPrev} />
            <h2 className="font-heading font-bold text-lg capitalize min-w-[10rem] text-center">
              {fmtMonthYear(cursor)}
            </h2>
            <IconBtn icon={ChevronRight} label="Próximo" onClick={goNext} />
          </div>
          <button className="btn-soft" onClick={() => { setCursor(todayISO()); setSelected(todayISO()); }}>
            Hoje
          </button>
        </div>

        {view === 'month' ? (
          <MonthView cursor={cursor} map={map} selected={selected} onSelect={setSelected} onItemClick={handleItemClick} />
        ) : (
          <WeekView cursor={cursor} map={map} selected={selected} onSelect={setSelected} onItemClick={handleItemClick} />
        )}
      </Card>

      <DayDetail
        date={selected}
        items={map[selected] || []}
        onDelete={deleteEvent}
        onEdit={openEdit}
        onToggle={toggleAttendance}
      />

      {eventModal && (
        <EventModal
          date={selected}
          event={eventModal === 'new' ? null : eventModal}
          onClose={() => setEventModal(null)}
          onSave={(data) => {
            if (eventModal === 'new') addEvent(data);
            else updateEvent(eventModal.id, data);
            setEventModal(null);
          }}
        />
      )}
    </>
  );
}

function Legend() {
  const entries = [
    ['ink', 'Pessoal'], ['warn', 'Brain'], ['horizonte', 'Processo'], ['aizome', 'Acadêmico'],
    ['success', 'Curso'], ['danger', 'Prazo'], ['obsidiana', 'Meta'], ['fatura', 'Fatura'],
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-3 border-t border-line">
      {entries.map(([c, label]) => (
        <span key={label} className="flex items-center gap-1.5 text-[0.68rem] text-ink-dim">
          <span className={`w-2 h-2 rounded-full ${COLOR_DOT[c]}`} /> {label}
        </span>
      ))}
    </div>
  );
}

function MonthView({ cursor, map, selected, onSelect, onItemClick }) {
  const grid = monthGrid(cursor);
  const today = todayISO();
  return (
    <>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center font-mono text-[0.6rem] uppercase tracking-wider text-ink-dim py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {grid.map((d) => {
          const dayItems = map[d] || [];
          const inMonth = isSameMonth(d, cursor);
          const isToday = d === today;
          const isSel = d === selected;
          return (
            <div
              key={d}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(d)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(d); } }}
              className={`min-h-[76px] md:min-h-[92px] text-left p-1.5 rounded-sharp border transition-colors cursor-pointer ${
                isSel ? 'border-aizome bg-aizome-soft' : 'border-line hover:border-obsidiana/30'
              } ${inMonth ? 'bg-washi' : 'bg-washi-soft/40'}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono ${
                    isToday
                      ? 'bg-obsidiana text-washi w-5 h-5 flex items-center justify-center rounded-full'
                      : inMonth ? 'text-obsidiana' : 'text-ink-dim/50'
                  }`}
                >
                  {fromISO(d).getDate()}
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                {dayItems.slice(0, 3).map((it) => (
                  <button
                    key={it.id}
                    onClick={(e) => { e.stopPropagation(); onItemClick(it); }}
                    title={it.module === 'calendar' ? `${it.title} — clique para editar` : it.title}
                    className={`flex items-center gap-1 w-full text-left rounded-sharp px-0.5 -mx-0.5 ${
                      it.category === 'fatura' ? 'hover:bg-fatura-soft' : 'hover:bg-obsidiana/5'
                    }`}
                  >
                    <ItemMarker it={it} />
                    <span
                      className={`text-[0.62rem] truncate ${
                        it.done ? 'line-through text-ink-dim'
                          : it.category === 'fatura' ? 'text-fatura font-medium' : 'text-obsidiana'
                      }`}
                    >
                      {it.title}
                    </span>
                  </button>
                ))}
                {dayItems.length > 3 && (
                  <span className="text-[0.6rem] text-ink-dim pl-0.5">+{dayItems.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Legend />
    </>
  );
}

function WeekView({ cursor, map, selected, onSelect, onItemClick }) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = todayISO();
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
        {days.map((d) => {
          const dayItems = map[d] || [];
          const isToday = d === today;
          return (
            <div
              key={d}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(d)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(d); } }}
              className={`text-left p-2 rounded-sharp border min-h-[120px] transition-colors cursor-pointer ${
                d === selected ? 'border-aizome bg-aizome-soft' : 'border-line hover:border-obsidiana/30'
              }`}
            >
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="font-mono text-[0.6rem] uppercase text-ink-dim">{weekdayShort(d)}</span>
                <span className={`text-sm font-heading font-bold ${isToday ? 'text-horizonte' : ''}`}>
                  {fromISO(d).getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {dayItems.map((it) => (
                  <button
                    key={it.id}
                    onClick={(e) => { e.stopPropagation(); onItemClick(it); }}
                    title={it.module === 'calendar' ? `${it.title} — clique para editar` : it.title}
                    className={`flex items-start gap-1 w-full text-left rounded-sharp px-0.5 -mx-0.5 ${
                      it.category === 'fatura' ? 'hover:bg-fatura-soft' : 'hover:bg-obsidiana/5'
                    }`}
                  >
                    <span className="mt-0.5"><ItemMarker it={it} /></span>
                    <span
                      className={`text-[0.66rem] leading-tight ${
                        it.done ? 'line-through text-ink-dim'
                          : it.category === 'fatura' ? 'text-fatura' : ''
                      }`}
                    >
                      {it.time && <b className="font-mono">{it.time} </b>}
                      {it.title}
                      {it.category === 'fatura' && it.amount != null && (
                        <b className="font-mono text-fatura"> · {currency(it.amount)}</b>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <Legend />
    </>
  );
}

function DayDetail({ date, items, onDelete, onEdit, onToggle }) {
  return (
    <Card className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={16} className="text-aizome" />
        <h3 className="font-heading font-bold text-base capitalize">{fmtLong(date)}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-ink-dim py-2">Nenhum item neste dia.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((it) => {
            const isFatura = it.category === 'fatura';
            // Meeting link is a dedicated field now; fall back to a link that
            // lives in `location` (processos stages, legacy events). Physical
            // address is whatever's in `location` that isn't a link.
            const meetLink = it.meetingLink || (isLink(it.location) ? it.location : '');
            const addr = it.location && !isLink(it.location) ? it.location : '';
            return (
              <li
                key={it.id}
                className={`flex items-start gap-3 py-2 px-2 -mx-2 rounded-sharp ${
                  isFatura ? 'bg-fatura-soft border-l-2 border-fatura' : ''
                }`}
              >
                {it.module === 'calendar' ? (
                  <button
                    onClick={() => onToggle(it)}
                    aria-label={it.done ? 'Desmarcar' : isFatura ? 'Marcar como paga' : 'Confirmar presença'}
                    title={it.done
                      ? (isFatura ? 'Paga — clique para desfazer' : 'Presença confirmada — clique para desfazer')
                      : (isFatura ? 'Marcar como paga' : 'Marcar que compareci')}
                    className={`mt-0.5 w-4 h-4 shrink-0 rounded-sharp border flex items-center justify-center transition-colors ${
                      it.done
                        ? (isFatura ? 'bg-fatura border-fatura text-washi' : 'bg-success border-success text-washi')
                        : `border-obsidiana/40 ${isFatura ? 'hover:border-fatura' : 'hover:border-success'}`
                    }`}
                  >
                    {it.done && <Check size={11} strokeWidth={3} />}
                  </button>
                ) : (
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${COLOR_DOT[it.color] || 'bg-aizome'}`} />
                )}
                <span className="font-mono text-[0.7rem] text-aizome w-24 shrink-0 mt-0.5">
                  {it.time ? `${it.time}${it.endTime ? `–${it.endTime}` : ''}` : (isFatura ? 'vencimento' : '—')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm ${it.done ? 'text-ink-dim' + (isFatura ? '' : ' line-through') : ''}`}>
                      {it.title}
                    </span>
                    {isFatura && it.amount != null && (
                      <span className="font-mono text-sm font-bold text-fatura">{currency(it.amount)}</span>
                    )}
                    {it.recurring && (
                      <span className="chip text-ink-dim border-line">
                        <Repeat size={10} /> {RECUR_LABEL[it.recurrence] || 'repete'}
                      </span>
                    )}
                    {it.module === 'calendar' && it.done && (
                      <span className={`chip align-middle ${isFatura ? 'text-fatura border-fatura/40 bg-fatura-soft' : 'text-success border-success/40 bg-success/5'}`}>
                        <Check size={10} strokeWidth={3} /> {isFatura ? 'Paga' : 'Compareci'}
                      </span>
                    )}
                  </div>
                  {meetLink && (
                    <p className="text-[0.72rem] mt-0.5 flex items-center gap-1 text-ink-dim">
                      <a
                        href={meetLink.startsWith('http') ? meetLink : `https://${meetLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-aizome hover:underline truncate"
                      >
                        <Video size={11} className="shrink-0" /> Entrar na reunião
                      </a>
                    </p>
                  )}
                  {addr && (
                    <p className="text-[0.72rem] mt-0.5 flex items-center gap-1 text-ink-dim">
                      <MapPin size={11} className="shrink-0" /> {addr}
                    </p>
                  )}
                </div>
                {!isFatura && <span className="chip text-ink-dim border-line shrink-0">{it.kind}</span>}
                {isFatura && <span className="chip text-fatura border-fatura/40 shrink-0"><Receipt size={10} /> Fatura</span>}
                {it.module === 'calendar' && (
                  <span className="flex items-center gap-0.5 shrink-0">
                    <IconBtn icon={Pencil} label="Editar" onClick={() => onEdit(it.refId)} />
                    <IconBtn icon={Trash2} label="Excluir" onClick={() => onDelete(it.refId)} className="hover:text-danger" />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[0.68rem] text-ink-dim mt-3 pt-3 border-t border-line">
        Compromissos e faturas podem ser editados (✎), excluídos e marcados como presença/pagos (✓) aqui. Itens recorrentes marcam cada ocorrência individualmente. Excluir remove a série inteira.
      </p>
    </Card>
  );
}

function EventModal({ date, event, onClose, onSave }) {
  const [form, setForm] = useState({
    title: event?.title || '',
    date: event?.date || date,
    time: event?.time || '',
    endTime: event?.endTime || '',
    location: event?.location || '',
    meetingLink: event?.meetingLink || '',
    type: event?.type || 'pessoal',
    note: event?.note || '',
    category: event?.category || 'compromisso',
    recurrence: event?.recurrence || 'none',
    amount: event?.amount ?? '',
    financeCategory: event?.financeCategory || 'Moradia',
    wantsMeet: event?.wantsMeet || false,
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const isFatura = form.category === 'fatura';
  // Offer Meet creation only when Google Calendar is (or was) connected, the
  // event has no link yet, and it isn't already a Google event.
  const canMakeMeet = isRemembered(SCOPE_CALENDAR) && !form.meetingLink && !event?.gcalId;

  // Switching category flips sensible defaults (faturas default to monthly).
  const setCategory = (cat) =>
    setForm((f) => ({
      ...f,
      category: cat,
      recurrence: cat === 'fatura' && f.recurrence === 'none' ? 'monthly' : f.recurrence,
    }));

  const canSave = form.title.trim() && (!isFatura || Number(form.amount) > 0);
  const submit = () => {
    if (!canSave) return;
    onSave({ ...form, amount: isFatura ? Number(form.amount) : undefined });
  };

  return (
    <Modal open onClose={onClose} title={event ? 'Editar item' : 'Novo item na agenda'}>
      {/* Item type toggle */}
      <div className="grid grid-cols-2 gap-1 p-0.5 border border-line rounded-sharp mb-4">
        <button
          onClick={() => setCategory('compromisso')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-sharp font-mono text-[0.65rem] uppercase tracking-[0.06em] transition-colors ${
            !isFatura ? 'bg-obsidiana text-washi' : 'text-ink-dim hover:text-obsidiana'
          }`}
        >
          <CalendarDays size={13} /> Compromisso
        </button>
        <button
          onClick={() => setCategory('fatura')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-sharp font-mono text-[0.65rem] uppercase tracking-[0.06em] transition-colors ${
            isFatura ? 'bg-fatura text-washi' : 'text-ink-dim hover:text-fatura'
          }`}
        >
          <Receipt size={13} /> Fatura
        </button>
      </div>

      <Field label={isFatura ? 'Descrição da fatura' : 'Título'}>
        <Input
          value={form.title}
          onChange={set('title')}
          autoFocus
          placeholder={isFatura ? 'Aluguel, cartão, assinatura...' : 'Reunião, consulta, evento...'}
        />
      </Field>

      {isFatura ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor (R$)">
              <Input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value === '' ? '' : e.target.value })}
                placeholder="0,00"
              />
            </Field>
            <Field label="Vencimento"><Input type="date" value={form.date} onChange={set('date')} /></Field>
          </div>
          <Field label="Categoria (Finanças)">
            <Select value={form.financeCategory} onChange={set('financeCategory')} options={FINANCE_CATEGORIES} />
          </Field>
          <p className="text-[0.68rem] text-aizome -mt-1 mb-3 flex items-start gap-1.5">
            <Receipt size={12} className="mt-0.5 shrink-0" />
            Ao marcar esta fatura como <b>paga</b>, o valor entra automaticamente nas Finanças nesta categoria. Desmarcar remove o lançamento.
          </p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Data"><Input type="date" value={form.date} onChange={set('date')} /></Field>
            <Field label="Início"><Input type="time" value={form.time} onChange={set('time')} /></Field>
            <Field label="Término"><Input type="time" value={form.endTime} onChange={set('endTime')} /></Field>
          </div>
          <Field label="Local (endereço físico)">
            <Input
              value={form.location}
              onChange={set('location')}
              placeholder="Rua, número, sala..."
            />
          </Field>
          {!form.wantsMeet && (
            <Field label="Link da reunião">
              <Input
                value={form.meetingLink}
                onChange={set('meetingLink')}
                placeholder="Meet, Zoom, Teams... (importado do Google automaticamente)"
              />
            </Field>
          )}
          {canMakeMeet && (
            <label className="flex items-start gap-2 mb-3 -mt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.wantsMeet}
                onChange={(e) => setForm({ ...form, wantsMeet: e.target.checked })}
                className="mt-0.5 accent-aizome"
              />
              <span className="text-[0.78rem] text-obsidiana flex items-center gap-1">
                <Video size={13} className="text-aizome shrink-0" />
                Criar uma sala do Google Meet
                <span className="text-ink-dim">— o link aparece aqui após a sincronização</span>
              </span>
            </label>
          )}
          <Field label="Tipo">
            <Select value={form.type} onChange={set('type')} options={[
              { value: 'pessoal', label: 'Pessoal' },
              { value: 'brain', label: 'Brain' },
              { value: 'academico', label: 'Acadêmico' },
            ]} />
          </Field>
        </>
      )}

      <Field label={isFatura ? 'Repetir cobrança' : 'Recorrência'}>
        <Select value={form.recurrence} onChange={set('recurrence')} options={RECUR_OPTIONS} />
      </Field>
      {form.recurrence !== 'none' && (
        <p className="text-[0.68rem] text-ink-dim -mt-1 mb-3 flex items-center gap-1">
          <Repeat size={11} className="text-aizome" />
          {isFatura
            ? 'A fatura aparecerá a cada período e você marca cada pagamento individualmente.'
            : 'O compromisso se repete e cada ocorrência pode ser confirmada separadamente.'}
        </p>
      )}

      <Field label="Observações"><Textarea value={form.note} onChange={set('note')} /></Field>
      <div className="flex justify-end gap-2 mt-2">
        <button className="btn-soft" onClick={onClose}>Cancelar</button>
        <button className={isFatura ? 'btn-primary !bg-fatura !border-fatura hover:!bg-fatura/85' : 'btn-primary'} onClick={submit} disabled={!canSave}>
          Salvar
        </button>
      </div>
    </Modal>
  );
}
