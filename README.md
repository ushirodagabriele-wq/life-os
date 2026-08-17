# Life OS — Personal Command Center

Um "sistema operacional da vida": um painel pessoal que reúne, num só lugar,
tudo o que normalmente vive espalhado em dez abas — agenda, e-mails, finanças,
matérias da faculdade, metas, processos seletivos e um radar de notícias e
oportunidades. A proposta é transformar informação dispersa em **decisão e ação**,
com ajuda de IA para ler, classificar e resumir o que importa.

> **Nota:** este repositório é uma versão pública de portfólio. Todos os dados
> exibidos são **fictícios** (persona de demonstração "Ana Silva") e todas as
> credenciais foram removidas e externalizadas para variáveis de ambiente.

---

## A ideia

A maioria das ferramentas de produtividade te dá uma caixa vazia para preencher.
O Life OS parte do oposto: ele **puxa** os dados que já existem na sua vida
digital (agenda do Google, caixa de entrada, pastas de estudo no Drive) e usa IA
para responder à pergunta que realmente importa — *"o que eu preciso fazer agora?"*.

- **Caixa de entrada inteligente:** e-mails classificados por categoria e
  prioridade, com resumo, ação sugerida e o que precisa de resposta primeiro.
- **Radar de notícias e oportunidades:** a IA lê newsletters, deduplica o ruído,
  escreve blocos de aprendizado por tema e filtra oportunidades (bolsas, eventos,
  programas) pontuando a compatibilidade com o perfil.
- **Vida acadêmica:** grade horária, matérias ligadas às pastas do Drive e as
  aulas materializadas automaticamente no calendário, semana a semana.
- **Processos seletivos, metas, finanças, leituras:** módulos para acompanhar
  candidaturas por etapa, objetivos, gastos (com parser de linguagem natural em
  português) e hábitos.

---

## Stack

| Camada | Tecnologia |
|---|---|
| UI | **React 18** + **Vite** |
| Estilo | **Tailwind CSS** (design system próprio, tema "Swiss-editorial") |
| Estado | **Zustand** (store única, com seletores) |
| Rotas | **React Router** |
| Gráficos | **Recharts** |
| Nuvem / Auth | **Supabase** (autenticação + sincronização, protegida por Row Level Security) |
| Integrações | **Google APIs** — Calendar, Gmail (somente leitura) e Drive, via OAuth no navegador (Google Identity Services) |

---

## Arquitetura em uma olhada

- **App 100% no navegador, sem backend próprio.** A persistência é local
  (store do Zustand) e, opcionalmente, sincronizada na nuvem via Supabase.
- **OAuth sem servidor:** tokens de acesso do Google são de curta duração e
  vivem em memória; uma vez dado o consentimento, o app renova o token
  silenciosamente enquanto a sessão do Google estiver viva (ver `src/lib/google.js`).
- **Dados vs. estado:** `src/data/*` guarda *snapshots* (o que a IA gerou —
  e-mails, radar, eventos); `src/store/*` guarda o estado do usuário sobre esses
  snapshots (favoritos, histórico, itens concluídos). Nada é duplicado.
- **Drive como fonte da verdade:** o módulo de estudos apenas *reflete* pastas do
  Google Drive (visualização embutida), sem copiar arquivos.

```
src/
├── components/   # blocos de UI (AuthGate, CloudSync, LiveInbox, Layout…)
├── data/         # snapshots de demonstração (e-mails, radar, eventos, grade)
├── lib/          # integrações e utilitários (supabase, google, gcal, gmail, drive, finance…)
├── pages/        # uma página por módulo (Home, Emails, Radar, Finances, Goals…)
└── store/        # Zustand: estado, seletores, sincronização (cloud/google)
```

---

## Rodando localmente

Pré-requisitos: Node.js 18+.

```bash
npm install
npm run dev
```

O app abre em `http://localhost:5173` e funciona de imediato com os dados de
demonstração. Para ligar a sincronização na nuvem e as integrações do Google,
copie `.env.example` para `.env` e preencha com suas próprias credenciais:

```bash
cp .env.example .env
```

Build de produção:

```bash
npm run build && npm run preview
```

---

## Sobre este repositório

Projeto pessoal desenvolvido para explorar como IA + integrações do dia a dia
podem virar uma única superfície de decisão. A versão pública aqui foi
higienizada: sem dados reais, sem chaves, sem informação de terceiros.
