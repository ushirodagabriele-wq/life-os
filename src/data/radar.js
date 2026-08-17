// DEMO DATA — Radar de Notícias + Oportunidades.
// In the real app an AI reads the user's newsletters, extracts themes, dedupes
// repeated content and writes short learning blocks by subject; it also filters
// opportunities against the user's profile. Everything below is fictional.

export const RADAR_GENERATED_AT = '2026-07-30T00:30:00Z';

// Newsletters the AI identified in the inbox (editorial senders, not transactional).
export const NEWSLETTERS_DETECTED = [
  { name: 'Global Affairs Weekly', topic: 'Geopolítica' },
  { name: 'Policy Digest', topic: 'Política & economia' },
  { name: 'Tech Weekly', topic: 'IA & tecnologia' },
  { name: 'Invest Academy', topic: 'Mercado financeiro' },
  { name: 'Personal Finance Letter', topic: 'Finanças pessoais' },
  { name: 'Innovation Lab', topic: 'Produto & IA' },
];

// Perfil usado para filtrar e pontuar oportunidades.
export const OPP_PROFILE = {
  summary:
    'Estudante de graduação · participação em organização estudantil (liderança) · interesse em relações internacionais, geopolítica, governança global e liderança · inglês fluente.',
  criteria: [
    'Aberta a estudantes internacionais',
    'Financiamento integral (prioridade) ou parcial',
    'Sem taxa ou taxa baixa',
    'Elegível: idade, nacionalidade, formação, idioma',
    'Alinhada aos interesses acadêmicos e profissionais',
  ],
};

export const OPPORTUNITIES = [
  {
    id: 'forum-democracia-demo',
    title: 'Fórum Mundial pela Democracia — Delegação Jovem',
    org: 'Organização internacional',
    location: 'Europa',
    category: 'Fórum / Democracia',
    compatibility: 95,
    summary:
      'Delegação jovem reunindo líderes, formuladores de políticas e ativistas para debater os desafios democráticos atuais.',
    deadline: '14/08/2026', deadlineISO: '2026-08-14',
    funded: 'Integral', fee: 'Sem taxa', feeOk: true,
    benefits: ['Passagens (reembolso)', 'Hospedagem', 'Refeições', 'Transporte local', 'Certificado'],
    requirements: ['Aberto mundialmente', '18–30 anos', 'Inglês', 'Atuação em organização juvenil / sociedade civil'],
    reason: 'A atuação em organização estudantil atende ao requisito, e o tema é central para a área de RI.',
    url: 'https://example.com/forum-democracia',
    emailUrl: 'https://example.com/thread',
  },
  {
    id: 'young-leaders-demo',
    title: 'Young Leaders Summit 2026 — Bolsa Integral',
    org: 'Young Leaders',
    location: 'África do Sul',
    category: 'Cúpula de liderança',
    compatibility: 90,
    summary:
      'Bolsa integral para uma cúpula com milhares de jovens líderes de dezenas de países. Uma das mais prestigiadas do mundo.',
    deadline: '31/10/2026', deadlineISO: '2026-10-31',
    funded: 'Integral', fee: 'Sem taxa', feeOk: true,
    benefits: ['Passagens ida e volta', 'Hospedagem', 'Refeições', 'Acesso total ao Summit'],
    requirements: ['Aberto mundialmente', '18–35 anos', 'Histórico de liderança e impacto social'],
    reason: 'Histórico de liderança e impacto social encaixam no critério central. Prazo confortável.',
    url: 'https://example.com/young-leaders',
    emailUrl: 'https://example.com/thread',
  },
  {
    id: 'youth-action-demo',
    title: 'Youth Action Summit 2027',
    org: 'Centre for Diplomatic Affairs',
    location: 'Alemanha',
    category: 'Cúpula juvenil',
    compatibility: 84,
    summary:
      'Conferência juvenil internacional com foco em desenvolvimento de liderança e networking. Sem exigência de experiência prévia.',
    deadline: '05/10/2026', deadlineISO: '2026-10-05',
    funded: 'Integral', fee: 'US$ 17 (taxa baixa)', feeOk: true,
    benefits: ['Passagens ida e volta', 'Hospedagem (compartilhada)', 'Refeições', 'Certificado'],
    requirements: ['Aberto mundialmente', '16–45 anos', 'Inglês básico', 'Sem experiência prévia exigida'],
    reason: 'Alinhada a liderança e diplomacia; requisitos amplos e prazo tranquilo.',
    url: 'https://example.com/youth-action',
    emailUrl: 'https://example.com/thread',
  },
  {
    id: 'leadership-italy-demo',
    title: 'International Leadership Program 2026',
    org: 'ILP',
    location: 'Itália · 19–22 dez',
    category: 'Conferência de liderança',
    compatibility: 80,
    summary:
      'Conferência de 4 dias reunindo jovens líderes de dezenas de países para workshops de diplomacia e cooperação global.',
    deadline: '31/07/2026', deadlineISO: '2026-07-31',
    funded: 'Integral (vagas limitadas) ou parcial', fee: 'US$ 23 (taxa baixa)', feeOk: true,
    benefits: ['Integral: passagens + hospedagem + refeições', 'Parcial: hospedagem + refeições', 'Certificado'],
    requirements: ['Todos os países', 'Estudantes/jovens líderes', 'Inglês', 'Interesse em diplomacia/RI'],
    reason: 'Muito alinhada, mas poucas vagas integrais e prazo imediato.',
    url: 'https://example.com/leadership-program',
    emailUrl: 'https://example.com/thread',
  },
];

// Descartadas pelo filtro — mostradas com o motivo (transparência).
export const OPPORTUNITIES_EXCLUDED = [
  { title: 'Seminário regional (Ásia-Europa)', reason: 'Restrito a países parceiros do bloco — inelegível.' },
  { title: 'Programa de tecnologia/governança digital', reason: 'Prazo encerrado e menor aderência à área de RI.' },
  { title: 'Estágios em organismos de saúde', reason: 'Exigem matrícula em pós-graduação e foco em saúde.' },
  { title: 'Traineeships que exigem graduação concluída', reason: 'Graduação ainda em curso. Ficam elegíveis no futuro.' },
];

// Painel de renda fixa (demo) — no app real, uma IA lê um relatório diário de
// ofertas e organiza por tipo. Bancos e taxas abaixo são fictícios.
export const AUVP_PANEL = {
  date: '2026-07-31',
  emailUrl: 'https://example.com/thread',
  summary: 'Ofertas de renda fixa mais atrativas do dia, organizadas por tipo (dados fictícios).',
  profile: 'Renda fixa — perfil conservador a moderado (reserva e proteção de capital).',
  reminder: 'Confira os limites de garantia antes de investir. Rentabilidades mudam todo dia; isto não é recomendação personalizada.',
  groups: [
    {
      label: 'CDB Prefixado', tag: 'Taxa travada',
      offers: [
        { name: 'CDB Prefixado · 2029', rate: '14,55% a.a.', bank: 'Banco Alfa', best: true },
        { name: 'CDB Prefixado · 2029', rate: '14,45% a.a.', bank: 'Banco Alfa' },
        { name: 'CDB Prefixado · 2029', rate: '14,40% a.a.', bank: 'Banco Beta' },
      ],
    },
    {
      label: 'CDB Pós-Fixado', tag: '% do CDI',
      offers: [
        { name: 'CDB Pós-Fixado · 2028', rate: '103,50% CDI', bank: 'Banco Gama', best: true },
        { name: 'CDB Pós-Fixado · 2028', rate: '102,00% CDI', bank: 'Banco Delta' },
        { name: 'CDB Pós-Fixado · 2028', rate: '102,00% CDI', bank: 'Banco Gama' },
      ],
    },
    {
      label: 'CDB IPCA+', tag: 'Protege da inflação',
      offers: [
        { name: 'CDB IPCA+ · 2031', rate: 'IPCA + 8,45%', bank: 'Banco Alfa', best: true },
        { name: 'CDB IPCA+ · 2031', rate: 'IPCA + 8,41%', bank: 'Banco Delta' },
        { name: 'CDB IPCA+ · 2032', rate: 'IPCA + 8,40%', bank: 'Banco Alfa' },
      ],
    },
    {
      label: 'LCI / LCA', tag: 'Isento de IR',
      offers: [
        { name: 'LCI Prefixado · 2029', rate: '11,86% a.a.', bank: 'Banco Delta' },
        { name: 'LCA Pós-Fixado · 2028', rate: '89,00% CDI', bank: 'Banco Alfa' },
        { name: 'LCA IPCA+ · 2031', rate: 'IPCA + 6,34%', bank: 'Banco Épsilon' },
      ],
    },
  ],
  changes: null,
};

export const THEMES = [
  {
    id: 'geopolitica',
    name: 'Geopolítica',
    hot: true,
    blocks: [
      {
        title: 'Minerais críticos: a nova disputa estratégica',
        hot: true,
        summary:
          'Uma análise sobre o papel estratégico dos minerais críticos. A disputa global se intensificou — e o gargalo não é o que está no solo, mas quem processa.',
        events: [
          'O processamento (não a mineração) é o verdadeiro ponto de estrangulamento da cadeia.',
          'Grandes economias anunciaram reservas estratégicas domésticas.',
          'Acordos bilaterais e frameworks multilaterais surgiram ao longo do ano.',
        ],
        impacts: [
          'Minerais críticos são centrais para transição energética, infraestrutura digital e defesa — controlar a cadeia é controlar poder.',
          'Tema ligado a governança global e ao papel do Sul Global na nova ordem.',
        ],
        sources: [
          { label: 'Fonte de exemplo — panorama do tema', url: 'https://example.com/minerais-criticos', type: 'article' },
          { label: 'Vídeo explicativo (exemplo)', url: 'https://example.com/video', type: 'video' },
        ],
        from: ['Global Affairs Weekly'],
      },
      {
        title: 'Guerra de informação e opinião pública',
        summary:
          'Uma análise sobre como a cobertura midiática e o ativismo jovem disputam a narrativa em conflitos internacionais — uma batalha que desafia a lógica oficial dos Estados.',
        events: [
          'Virada na opinião pública após eventos de grande repercussão.',
          'Mobilização estudantil e ativismo jovem como contraponto à narrativa estatal.',
        ],
        impacts: [
          'Mostra a opinião pública e a "guerra de informação" como frente de batalha — tema-chave de Análise de Política Externa.',
        ],
        sources: [
          { label: 'Fonte de exemplo — texto completo', url: 'https://example.com/guerra-informacao', type: 'article' },
        ],
        from: ['Global Affairs Weekly'],
      },
    ],
  },
  {
    id: 'ia-tech',
    name: 'IA & Tecnologia',
    hot: true,
    blocks: [
      {
        title: 'A corrida das empresas para transformar IA em receita',
        summary:
          'Newsletters de tecnologia sinalizam a pressa das empresas em converter IA em resultado — com muito ruído comercial no meio.',
        events: [
          'Séries de conteúdo sobre "IA aplicada ao crescimento: do experimento à receita".',
        ],
        impacts: [
          'Tendência de IA como vantagem competitiva — mas com forte viés comercial.',
          'Dedup: várias mensagens sobre o mesmo evento foram consolidadas em um único ponto aqui.',
        ],
        sources: [],
        from: ['Tech Weekly', 'Innovation Lab'],
      },
    ],
  },
  {
    id: 'mercado',
    name: 'Mercado Financeiro & Negócios',
    hot: false,
    blocks: [
      {
        title: 'Carreiras no mercado financeiro em foco',
        summary:
          'Webinars sobre profissões e o "mapa de carreiras" no mercado financeiro — conteúdo alinhado a quem busca estágio na área.',
        events: [
          'Webinar "Profissões no Mercado Financeiro" com convidadas do setor.',
        ],
        impacts: [
          'Bom material para orientar a preparação e entender caminhos na área.',
        ],
        sources: [],
        from: ['Invest Academy'],
      },
    ],
  },
];
