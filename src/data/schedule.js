// DEMO DATA — Grade horária de um semestre de exemplo (curso de RI).
// É um dado ESTÁTICO: a grade não muda no meio do semestre. O calendário lê daqui
// e materializa as aulas semana a semana dentro da janela do semestre — nada é
// duplicado na store. Professores e salas abaixo são fictícios.
//
// A cor de cada disciplina (`color`) é a MESMA usada na grade (módulo Matérias)
// e no calendário, para bater o olho e identificar a aula na hora. Os tokens
// `sub-*` vivem em tailwind.config.js.

// Janela em que as aulas se repetem no calendário. Ajuste aqui se o calendário
// acadêmico do semestre começar/terminar em outra data.
export const SEMESTER = {
  start: '2026-08-03',
  end: '2026-12-19',
  label: '2º semestre de 2026',
};

// Faixas de horário da grade (a de 12:00–13:30 é o intervalo de almoço).
export const SLOTS = [
  { start: '08:00', end: '09:40' },
  { start: '10:00', end: '11:40' },
  { start: '12:00', end: '13:30', lunch: true },
  { start: '13:30', end: '15:10' },
  { start: '15:30', end: '17:10' },
];

export const DAYS = [
  { n: 1, label: 'Segunda', short: 'Seg' },
  { n: 2, label: 'Terça', short: 'Ter' },
  { n: 3, label: 'Quarta', short: 'Qua' },
  { n: 4, label: 'Quinta', short: 'Qui' },
  { n: 5, label: 'Sexta', short: 'Sex' },
];

// Disciplinas. `driveId` liga a matéria à sua pasta no Drive (na versão demo
// fica null); nem toda disciplina tem pasta. `color` é o token de cor
// compartilhado entre grade e calendário. Professores são fictícios.
export const SUBJECTS_META = {
  di_privado: {
    name: 'Direito Internacional Privado', short: 'DI Privado',
    professor: 'Prof. A. Demonstração', color: 'sub-slate',
    driveId: null,
  },
  cenarios: {
    name: 'Cenários Estratégicos', short: 'Cenários Estr.',
    professor: 'Profa. B. Demonstração', color: 'sub-indigo',
    driveId: null,
  },
  oficina: {
    name: 'Oficina de Desenvolvimento e Comp. Pessoais', short: 'Oficina Desenv.',
    professor: 'Profa. C. Demonstração', color: 'sub-rose', shared: true,
    driveId: null,
  },
  peb1: {
    name: 'Política Externa Brasileira I', short: 'PEB I',
    professor: 'Prof. D. Demonstração', color: 'sub-green',
    driveId: null,
  },
  eco_inter: {
    name: 'Economia Internacional III', short: 'Eco. Inter. III',
    professor: 'Prof. E. Demonstração', color: 'sub-amber', shared: true,
    driveId: null,
  },
  negocios: {
    name: 'Negócios Internacionais II', short: 'Negócios II',
    professor: 'Prof. F. Demonstração', color: 'sub-sky',
    driveId: null,
  },
  ecobra: {
    name: 'Economia Brasileira II', short: 'ECOBRA II',
    professor: 'Prof. G. Demonstração', color: 'sub-terra', shared: true,
    driveId: null,
  },
  tec_pesquisa: {
    name: 'Técnicas de Pesquisa em Relações Internacionais', short: 'Téc. Pesquisa',
    professor: 'Profa. H. Demonstração', color: 'sub-violet',
    driveId: null,
  },
  laboratorio: {
    name: 'Laboratório Int. Pública ou Privada II', short: 'Lab. Pública/Privada II',
    professor: 'Profa. I. Demonstração', color: 'sub-olive',
    driveId: null,
  },
  temas: {
    name: 'Temas Contemporâneos II', short: 'Temas II',
    professor: 'Profa. J. Demonstração', color: 'sub-brick',
    driveId: null,
  },
};

// Sessões da semana: { day 1..5, start, end, subject, room? }.
// `end` pode cobrir mais de uma faixa (o Laboratório de sexta ocupa 13:30–17:10).
export const SESSIONS = [
  // Segunda
  { day: 1, start: '08:00', end: '09:40', subject: 'di_privado' },
  { day: 1, start: '10:00', end: '11:40', subject: 'peb1' },
  { day: 1, start: '13:30', end: '15:10', subject: 'peb1' },
  // Terça
  { day: 2, start: '10:00', end: '11:40', subject: 'eco_inter' },
  { day: 2, start: '13:30', end: '15:10', subject: 'ecobra' },
  { day: 2, start: '15:30', end: '17:10', subject: 'temas' },
  // Quarta
  { day: 3, start: '08:00', end: '09:40', subject: 'cenarios' },
  { day: 3, start: '10:00', end: '11:40', subject: 'negocios' },
  { day: 3, start: '13:30', end: '15:10', subject: 'eco_inter' },
  { day: 3, start: '15:30', end: '17:10', subject: 'di_privado' },
  // Quinta
  { day: 4, start: '08:00', end: '09:40', subject: 'oficina' },
  { day: 4, start: '10:00', end: '11:40', subject: 'ecobra' },
  { day: 4, start: '13:30', end: '15:10', subject: 'negocios' },
  { day: 4, start: '15:30', end: '17:10', subject: 'temas' },
  // Sexta
  { day: 5, start: '08:00', end: '09:40', subject: 'cenarios' },
  { day: 5, start: '10:00', end: '11:40', subject: 'tec_pesquisa' },
  { day: 5, start: '13:30', end: '17:10', subject: 'laboratorio', room: 'Sala de exemplo' },
];

// Sessões resolvidas (com metadados da disciplina embutidos) e agrupadas por dia
// da semana — o calendário usa isto para materializar as ocorrências.
export const SESSIONS_RESOLVED = SESSIONS.map((s) => ({
  ...s,
  ...SUBJECTS_META[s.subject],
  key: s.subject,
}));

export const SESSIONS_BY_DAY = SESSIONS_RESOLVED.reduce((acc, s) => {
  (acc[s.day] = acc[s.day] || []).push(s);
  return acc;
}, {});

// Estilos estáticos por cor (Tailwind precisa de nomes de classe literais).
// Usados na grade do módulo Matérias. O calendário usa o mapa COLOR_DOT dele.
export const SUBJECT_STYLE = {
  'sub-indigo': { text: 'text-sub-indigo', dot: 'bg-sub-indigo', cell: 'bg-sub-indigo-soft border-sub-indigo' },
  'sub-sky': { text: 'text-sub-sky', dot: 'bg-sub-sky', cell: 'bg-sub-sky-soft border-sub-sky' },
  'sub-green': { text: 'text-sub-green', dot: 'bg-sub-green', cell: 'bg-sub-green-soft border-sub-green' },
  'sub-olive': { text: 'text-sub-olive', dot: 'bg-sub-olive', cell: 'bg-sub-olive-soft border-sub-olive' },
  'sub-amber': { text: 'text-sub-amber', dot: 'bg-sub-amber', cell: 'bg-sub-amber-soft border-sub-amber' },
  'sub-terra': { text: 'text-sub-terra', dot: 'bg-sub-terra', cell: 'bg-sub-terra-soft border-sub-terra' },
  'sub-brick': { text: 'text-sub-brick', dot: 'bg-sub-brick', cell: 'bg-sub-brick-soft border-sub-brick' },
  'sub-rose': { text: 'text-sub-rose', dot: 'bg-sub-rose', cell: 'bg-sub-rose-soft border-sub-rose' },
  'sub-violet': { text: 'text-sub-violet', dot: 'bg-sub-violet', cell: 'bg-sub-violet-soft border-sub-violet' },
  'sub-slate': { text: 'text-sub-slate', dot: 'bg-sub-slate', cell: 'bg-sub-slate-soft border-sub-slate' },
};

// Quantas faixas de horário uma sessão ocupa (para o rowSpan na grade).
export function slotSpan(session) {
  const startIdx = SLOTS.findIndex((sl) => sl.start === session.start);
  if (startIdx < 0) return 1;
  let span = 0;
  for (let i = startIdx; i < SLOTS.length; i++) {
    if (SLOTS[i].lunch) continue;
    if (SLOTS[i].start >= session.end) break;
    span++;
  }
  return Math.max(span, 1);
}
