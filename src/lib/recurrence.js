// Expand a (possibly recurring) event into concrete occurrence dates within a
// window. Recurrence is stored on the event as `recurrence`:
//   'none' | 'weekly' | 'monthly' | 'yearly'
// plus an optional `until` (YYYY-MM-DD) end date. Occurrences never precede the
// event's own `date` (the series anchor).

import { fromISO, toISO } from './date';

export const RECUR_OPTIONS = [
  { value: 'none', label: 'Não repete' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' },
];

export const RECUR_LABEL = { weekly: 'semanal', monthly: 'mensal', yearly: 'anual' };

export function expandOccurrences(event, start, end) {
  const base = event.date;
  if (!base) return [];
  const freq = event.recurrence || 'none';
  const hardEnd = event.until && event.until < end ? event.until : end;

  if (freq === 'none') {
    return base >= start && base <= end ? [base] : [];
  }

  const out = [];
  const startD = fromISO(start);
  const endD = fromISO(hardEnd);
  const baseD = fromISO(base);
  const push = (d) => {
    const iso = toISO(d);
    if (iso >= start && iso <= hardEnd && iso >= base) out.push(iso);
  };

  if (freq === 'weekly') {
    const d = new Date(baseD);
    if (d < startD) {
      const weeks = Math.floor((startD - d) / (7 * 86400000));
      d.setDate(d.getDate() + weeks * 7);
      while (d < startD) d.setDate(d.getDate() + 7);
    }
    while (d <= endD) { push(d); d.setDate(d.getDate() + 7); }
  } else if (freq === 'monthly') {
    const dom = baseD.getDate();
    const cur = new Date(baseD.getFullYear(), baseD.getMonth(), 1);
    while (cur < new Date(startD.getFullYear(), startD.getMonth(), 1)) cur.setMonth(cur.getMonth() + 1);
    while (cur <= endD) {
      const lastDay = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
      push(new Date(cur.getFullYear(), cur.getMonth(), Math.min(dom, lastDay)));
      cur.setMonth(cur.getMonth() + 1);
    }
  } else if (freq === 'yearly') {
    for (let yr = baseD.getFullYear(); yr <= endD.getFullYear(); yr++) {
      push(new Date(yr, baseD.getMonth(), baseD.getDate()));
    }
  }
  return out;
}
