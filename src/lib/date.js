// Date helpers — all dates handled as 'YYYY-MM-DD' local strings to avoid TZ drift.

export function todayISO() {
  return toISO(new Date());
}

export function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISO(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso, n) {
  const d = fromISO(iso) || new Date();
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function daysBetween(a, b) {
  const da = fromISO(a);
  const db = fromISO(b);
  if (!da || !db) return null;
  return Math.round((db - da) / 86400000);
}

export function daysUntil(iso) {
  if (!iso) return null;
  return daysBetween(todayISO(), iso);
}

const MONTHS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];
const MONTHS_FULL = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const WEEKDAYS_FULL = [
  'domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado',
];

export function fmtShort(iso) {
  const d = fromISO(iso);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function fmtLong(iso) {
  const d = fromISO(iso);
  if (!d) return '';
  return `${WEEKDAYS_FULL[d.getDay()]}, ${d.getDate()} de ${MONTHS_FULL[d.getMonth()]}`;
}

export function fmtMonthYear(iso) {
  const d = fromISO(iso);
  if (!d) return '';
  return `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

export function weekdayShort(iso) {
  const d = fromISO(iso);
  return d ? WEEKDAYS[d.getDay()] : '';
}

// Sunday-based start of the week containing `iso` — matches the calendar
// header (DOM, SEG, …) and the Brazilian week convention.
export function startOfWeek(iso) {
  const d = fromISO(iso);
  d.setDate(d.getDate() - d.getDay()); // getDay(): 0 = Sunday
  return toISO(d);
}

// Grid of 42 days (6 weeks) for the month containing `iso`, Sunday-first.
export function monthGrid(iso) {
  const d = fromISO(iso);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const start = startOfWeek(toISO(first));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function isSameMonth(a, b) {
  const da = fromISO(a);
  const db = fromISO(b);
  return da && db && da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear();
}

export function monthKey(iso) {
  return iso ? iso.slice(0, 7) : '';
}

export { WEEKDAYS, MONTHS_FULL };
