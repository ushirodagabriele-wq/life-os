// Initial state — clean by default. No demo data: the user starts with an
// empty Life OS and fills it with their own information (and live Google data).

export function buildSeed() {
  return {
    tasks: [],
    events: [],
    courses: [],
    processes: [],
    academic: [],
    notes: [],
    books: [],
    media: [],
    expenses: [],
    goals: [],

    // Módulo Eventos (radar de oportunidades) — estado do usuário sobre o
    // snapshot em data/events.js. savedEvents: favoritos; viewedEvents:
    // histórico (ids, mais recente primeiro); linkedEvents: já adicionados ao
    // calendário; eventsSeenAt: quando marcou os novos como vistos.
    savedEvents: [],
    viewedEvents: [],
    linkedEvents: [],
    eventsSeenAt: null,

    // Plano de Leitura Bíblica — dias concluídos (números 1..366).
    biblePlan: { done: [], startedAt: null },

    // Cronograma do dia — time-blocking livre: { 'YYYY-MM-DD': { 'HH:00': 'texto' } }.
    timeline: {},

    meta: {
      lastMaintenance: null,
      history: {}, // { 'YYYY-MM-DD': { completed: n, planned: n } }
      demoCleared: true,
    },
  };
}
