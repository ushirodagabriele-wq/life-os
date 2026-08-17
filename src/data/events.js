// DEMO DATA — Módulo Eventos (radar de oportunidades).
// In the real app this is an AI-curated snapshot: opportunities researched on the
// web and filtered against the user's profile. The module auto-hides events whose
// date or registration deadline has already passed. Everything below is fictional.

export const EVENTS_GENERATED_AT = '2026-08-03';

export const EVENT_CATEGORIES = [
  'Mercado Financeiro', 'Carreira', 'Recrutamento', 'Networking',
  'Tecnologia', 'Consultoria', 'Inovação',
];

export const EVENT_CATEGORY_COLOR = {
  'Mercado Financeiro': 'aizome',
  Carreira: 'horizonte',
  Recrutamento: 'horizonte',
  Networking: 'warn',
  Tecnologia: 'success',
  Consultoria: 'fatura',
  Inovação: 'success',
};

export const EVENTS = [
  {
    id: 'conferencia-carreira-demo',
    name: 'Conferência de Carreira — vários processos seletivos em 1 dia',
    org: 'Meridian Careers · empresas parceiras',
    date: '2026-08-10', time: '', endTime: '',
    format: 'presencial', city: 'São Paulo', venue: 'São Paulo (local no site)',
    url: 'https://example.com/conferencia-carreira',
    deadline: '2026-08-09',
    description:
      'Evento gratuito que conecta universitários e recém-formados a recrutadores de grandes empresas — centenas de vagas de estágio e trainee, com painéis por área.',
    reason:
      'Reúne várias empresas num só dia, gratuito, focado em universitários. É imediato — prioridade alta.',
    category: 'Recrutamento',
    priority: 'alta',
    tags: ['feira', 'recrutamento', 'estágio'],
    addedAt: '2026-08-03',
    source: 'https://example.com/conferencia-carreira',
  },
  {
    id: 'copa-trading-demo',
    name: 'Copa de Trading 2026 — competição em ambiente simulado',
    org: 'Nimbus Capital',
    date: '2026-10-29', time: '', endTime: '',
    format: 'hibrido', city: 'São Paulo', venue: 'Final presencial em São Paulo',
    url: 'https://example.com/copa-trading',
    deadline: '2026-09-06',
    description:
      'Competição de trading em ambiente simulado (sem dinheiro real), em fases classificatórias até a final ao vivo. Participação gratuita.',
    reason:
      'Mercado financeiro na prática, gratuito e com premiação — ótimo para aprender análise e ganhar visibilidade.',
    category: 'Mercado Financeiro',
    priority: 'alta',
    tags: ['trading', 'competição'],
    addedAt: '2026-08-03',
    source: 'https://example.com/copa-trading',
  },
  {
    id: 'mentoria-universitarias-demo',
    name: 'Programa de Mentoria para Universitárias',
    org: 'Nimbus Capital',
    date: '', time: '', endTime: '',
    format: 'hibrido', city: 'São Paulo', venue: '',
    url: 'https://example.com/mentoria',
    deadline: '2026-10-23',
    description:
      'Programa dedicado a atrair e formar universitárias para o mercado financeiro: mentoria, workshops de cultura e a chance de estagiar.',
    reason:
      'Mentoria de mercado financeiro voltada a universitárias, com prazo aberto — encaixe direto no perfil.',
    category: 'Mercado Financeiro',
    priority: 'alta',
    tags: ['mulheres', 'mentoria', 'universitárias'],
    addedAt: '2026-08-03',
    source: 'https://example.com/mentoria',
  },
  {
    id: 'impact-case-demo',
    name: 'Impact Experience — resolva um caso real',
    org: 'Meridian Consulting',
    date: '', time: '', endTime: '',
    format: 'hibrido', city: 'São Paulo', venue: '',
    url: 'https://example.com/impact',
    deadline: '',
    description:
      'Universitários resolvem um problema real de uma ONG e acompanham a solução sendo implementada, com apoio de consultores.',
    reason:
      'Porta de entrada em consultoria estratégica com caso real — ótimo para quem tem interesse em consultoria e negócios.',
    category: 'Consultoria',
    priority: 'alta',
    tags: ['consultoria', 'case', 'impacto'],
    addedAt: '2026-08-03',
    source: 'https://example.com/impact',
  },
  {
    id: 'hackathon-ia-demo',
    name: 'Hackathon de IA 2026',
    org: 'NextWave',
    date: '2026-08-28', time: '', endTime: '',
    format: 'presencial', city: 'São Paulo', venue: 'São Paulo',
    url: 'https://example.com/hackathon',
    deadline: '',
    description:
      'Hackathon de fim de semana com times de 4 pessoas resolvendo desafios de IA; vencedores disputam final regional com premiação em dinheiro e créditos de API.',
    reason:
      'Tecnologia e inovação com premiação relevante — bom para networking e portfólio.',
    category: 'Tecnologia',
    priority: 'alta',
    tags: ['hackathon', 'IA', 'competição'],
    addedAt: '2026-08-03',
    source: 'https://example.com/hackathon',
  },
  {
    id: 'feira-profissoes-demo',
    name: 'Feira de Profissões 2026',
    org: 'Universidade (campus aberto)',
    date: '2026-09-24', time: '', endTime: '',
    format: 'presencial', city: 'São Paulo', venue: 'Campus (São Paulo)',
    url: 'https://example.com/feira-profissoes',
    deadline: '',
    description:
      'Grande feira gratuita com atividades para estudantes explorarem áreas, carreiras e contatos. Credenciamento prévio no site.',
    reason:
      'Feira gratuita para explorar carreiras e mapear programas de estágio e trainee.',
    category: 'Carreira',
    priority: 'media',
    tags: ['feira', 'profissões', 'gratuito'],
    addedAt: '2026-08-03',
    source: 'https://example.com/feira-profissoes',
  },
];
