// Derived, cross-module views. These are the glue that makes every module
// "talk" to the others — especially the calendar, which aggregates every
// dated item in the system.

import { todayISO, monthKey, fromISO, toISO } from '../lib/date';
import { expandOccurrences } from '../lib/recurrence';

// A unified calendar item shape:
// { id, date, time, title, kind, color, module, refId }
export function getCalendarItems(state) {
  const items = [];

  const EVENT_TYPE = {
    academico: { kind: 'Acadêmico', color: 'aizome' },
    brain: { kind: 'Brain', color: 'warn' },
    pessoal: { kind: 'Pessoal', color: 'ink' },
  };
  // Window in which recurring events are materialized: a few months back to
  // well over a year ahead — covers realistic calendar navigation.
  const base = fromISO(todayISO());
  const winStart = toISO(new Date(base.getFullYear(), base.getMonth() - 3, 1));
  const winEnd = toISO(new Date(base.getFullYear(), base.getMonth() + 18, 1));

  for (const e of state.events) {
    const isFatura = e.category === 'fatura';
    const t = EVENT_TYPE[e.type] || EVENT_TYPE.pessoal;
    const doneDates = e.doneDates || [];
    const recurring = e.recurrence && e.recurrence !== 'none';
    for (const d of expandOccurrences(e, winStart, winEnd)) {
      items.push({
        id: `${e.id}#${d}`, date: d, occDate: d, time: e.time || '', endTime: e.endTime || '',
        location: e.location || '', meetingLink: e.meetingLink || '', title: e.title,
        kind: isFatura ? 'Fatura' : e.fromGoogle ? 'Google' : t.kind,
        color: isFatura ? 'fatura' : t.color,
        module: 'calendar', refId: e.id, done: doneDates.includes(d),
        category: e.category || 'compromisso', amount: e.amount,
        recurring, recurrence: e.recurrence || 'none',
      });
    }
  }

  for (const p of state.processes) {
    for (const s of p.stages || []) {
      if (s.status === 'Cancelada') continue; // canceladas não vão para a agenda
      items.push({
        id: `${p.id}-${s.id}`, date: s.date, time: s.time || '',
        endTime: s.endTime || '', location: s.meetingLink || s.address || s.location || '',
        title: `${s.title} · ${p.company}`, kind: 'Processo seletivo',
        color: 'horizonte', module: 'processes', refId: p.id,
        done: s.status === 'Concluída',
      });
    }
  }

  for (const a of state.academic) {
    for (const st of a.steps || []) {
      items.push({
        id: `${a.id}-${st.id}`, date: st.date, time: '',
        title: `${a.title}: ${st.title}`, kind: 'Acadêmico',
        color: 'aizome', module: 'academic', refId: a.id, done: st.done,
      });
    }
    if (a.deadline) {
      items.push({
        id: `${a.id}-deadline`, date: a.deadline, time: '',
        title: `Entrega: ${a.title}`, kind: 'Prazo', color: 'danger',
        module: 'academic', refId: a.id, done: a.status === 'Concluído',
      });
    }
  }

  for (const c of state.courses) {
    if (c.deadline && c.status !== 'Concluído') {
      items.push({
        id: `${c.id}-deadline`, date: c.deadline, time: '',
        title: `Concluir curso: ${c.name}`, kind: 'Curso', color: 'success',
        module: 'courses', refId: c.id,
      });
    }
  }

  // As aulas da faculdade NÃO entram na agenda — a grade horária vive só no
  // módulo Matérias (data/schedule.js). (Removido a pedido da usuária.)

  for (const g of state.goals) {
    if (g.deadline && g.status === 'Em andamento') {
      items.push({
        id: `${g.id}-deadline`, date: g.deadline, time: '',
        title: `Prazo da meta: ${g.name}`, kind: 'Meta', color: 'obsidiana',
        module: 'goals', refId: g.id,
      });
    }
  }

  return items;
}

export function itemsByDate(items) {
  const map = {};
  for (const it of items) {
    if (!it.date) continue;
    (map[it.date] = map[it.date] || []).push(it);
  }
  for (const d of Object.keys(map)) {
    map[d].sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  }
  return map;
}

export function getTodayAgenda(state) {
  const today = todayISO();
  return getCalendarItems(state)
    .filter((it) => it.date === today)
    .sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
}

export function getTasksFor(state, date) {
  return state.tasks.filter((t) => t.date === date);
}

// --- progress helpers ---
export function courseProgress(c) {
  if ((c.progressMode || 'horas') === 'modulos') {
    if (!c.totalModules) return 0;
    return Math.min(Math.round(((c.completedModules || 0) / c.totalModules) * 100), 100);
  }
  if (!c.totalHours) return 0;
  return Math.min(Math.round(((c.studiedHours || 0) / c.totalHours) * 100), 100);
}

export function bookProgress(b) {
  if (!b.pages) return 0;
  return Math.min(Math.round(((b.pagesRead || 0) / b.pages) * 100), 100);
}

export function goalProgress(g) {
  const projects = g.projects || [];
  if (!projects.length) return g.status === 'Concluída' ? 100 : 0;
  const done = projects.filter((p) => p.done).length;
  return Math.round((done / projects.length) * 100);
}

export function academicProgress(a) {
  const steps = a.steps || [];
  if (!steps.length) return a.status === 'Concluído' ? 100 : 0;
  return Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
}

export function processProgress(p) {
  const stages = (p.stages || []).filter((s) => s.status !== 'Cancelada');
  if (!stages.length) return 0;
  return Math.round((stages.filter((s) => s.status === 'Concluída').length / stages.length) * 100);
}

// --- finance aggregations ---
export function expensesThisMonth(state, mk = monthKey(todayISO())) {
  return state.expenses.filter((x) => monthKey(x.date) === mk);
}

export function totalOf(list) {
  return list.reduce((sum, x) => sum + (Number(x.amount) || 0), 0);
}

export function byCategory(list) {
  const map = {};
  for (const x of list) {
    map[x.category] = (map[x.category] || 0) + (Number(x.amount) || 0);
  }
  return Object.entries(map)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function monthlyTotals(state, months = 6) {
  const now = new Date();
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const list = state.expenses.filter((x) => monthKey(x.date) === mk);
    out.push({ month: mk, label: mk.slice(5) + '/' + mk.slice(2, 4), total: totalOf(list) });
  }
  return out;
}

// --- productivity / streak ---
export function computeStreak(state) {
  const history = state.meta.history || {};
  // count consecutive days (ending yesterday) with >=1 completed task
  let streak = 0;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 400; i++) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const h = history[iso];
    if (h && h.completed > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  // include today if something already completed
  const today = todayISO();
  const doneToday = state.tasks.some((t) => t.date === today && t.done);
  if (doneToday) streak++;
  return streak;
}

export function completionRate(state, days = 7) {
  const history = state.meta.history || {};
  let planned = 0;
  let completed = 0;
  const d = new Date();
  for (let i = 1; i <= days; i++) {
    const dd = new Date(d);
    dd.setDate(d.getDate() - i);
    const iso = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
    const h = history[iso];
    if (h) {
      planned += h.planned;
      completed += h.completed;
    }
  }
  if (!planned) return null;
  return Math.round((completed / planned) * 100);
}
