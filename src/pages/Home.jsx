import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, ProgressBar, StatusBadge, OriginTag, currency } from '../components/ui';
import {
  getTodayAgenda, courseProgress, computeStreak, completionRate,
  expensesThisMonth, totalOf, bookProgress,
} from '../store/selectors';
import { generateNotifications } from '../lib/intelligence';
import { EMAILS } from '../data/emails';
import { todayISO, fmtLong, fmtShort, daysUntil } from '../lib/date';
import {
  Calendar, CheckSquare, Sparkles, Briefcase, BookOpen, GraduationCap,
  Wallet, Library, Flame, Target, ArrowRight, Clock, AlertTriangle, Bell,
  Check, Receipt, Repeat, Mail, Reply, Video,
} from 'lucide-react';
import { RECUR_LABEL } from '../lib/recurrence';

// A meeting link either lives in its own field or (for stages/legacy events) in location.
const isLink = (s) => /^(https?:\/\/|www\.)/i.test((s || '').trim());
const meetingLinkOf = (it) => it.meetingLink || (isLink(it.location) ? it.location : '');

export default function Home() {
  const state = useStore();
  const toggleEventDate = useStore((s) => s.toggleEventDate);
  const today = todayISO();

  const agenda = getTodayAgenda(state);
  const todaysTasks = state.tasks.filter((t) => t.date === today);
  const userTasks = todaysTasks.filter((t) => t.source === 'user');
  const suggestions = todaysTasks.filter((t) => t.source === 'system' && !t.done);
  const doneCount = todaysTasks.filter((t) => t.done).length;
  const notifications = generateNotifications(state);

  const upcomingStages = state.processes
    .flatMap((p) => (p.stages || []).map((s) => ({ ...s, company: p.company, pid: p.id })))
    .filter((s) => s.status !== 'Concluída' && daysUntil(s.date) != null && daysUntil(s.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const academicDeadlines = state.academic
    .filter((a) => a.status !== 'Concluído' && a.deadline)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 2);

  const activeCourses = state.courses.filter((c) => c.status === 'Em andamento').slice(0, 3);
  const readingBooks = state.books.filter((b) => b.status === 'Lendo');
  const monthSpend = totalOf(expensesThisMonth(state));
  const streak = computeStreak(state);
  const rate = completionRate(state);
  const goalsActive = state.goals.filter((g) => g.status === 'Em andamento');
  const emailsNeedReply = EMAILS.filter((e) => e.needsReply).sort((a, b) => (a.replyRank || 99) - (b.replyRank || 99));

  return (
    <>
      <div className="mb-6">
        <span className="eyebrow">Módulo 01 · Painel principal</span>
        <h1 className="font-heading font-bold text-2xl md:text-3xl tracking-tight mt-1">
          Bom dia!
        </h1>
        <p className="text-ink-dim text-sm mt-1 capitalize">{fmtLong(today)}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi icon={CheckSquare} label="Tarefas hoje" value={`${doneCount}/${todaysTasks.length}`} hint="concluídas" />
        <Kpi icon={Flame} label="Sequência" value={streak} hint={streak === 1 ? 'dia' : 'dias'} accent="horizonte" />
        <Kpi icon={Target} label="Metas ativas" value={goalsActive.length} hint="em andamento" />
        <Kpi icon={Wallet} label="Gasto no mês" value={currency(monthSpend)} hint="" small />
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={15} className="text-aizome" />
            <h2 className="font-heading font-bold text-base">Notificações do Life OS</h2>
          </div>
          <ul className="space-y-1.5">
            {notifications.slice(0, 5).map((n) => (
              <li key={n.id} className="flex items-start gap-2 text-sm">
                <AlertTriangle
                  size={14}
                  className={`mt-0.5 shrink-0 ${
                    n.level === 'danger' ? 'text-danger' : n.level === 'warn' ? 'text-warn' : 'text-aizome'
                  }`}
                />
                <span className="text-ink-dim">{n.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Agenda de hoje */}
        <Panel title="Agenda de hoje" icon={Calendar} to="/calendario" className="lg:col-span-1">
          {agenda.length === 0 ? (
            <Empty>Nenhum compromisso hoje.</Empty>
          ) : (
            <ul className="space-y-1.5">
              {agenda.map((it) => {
                const isFatura = it.category === 'fatura';
                const canCheck = it.module === 'calendar';
                const meetLink = meetingLinkOf(it);
                return (
                  <li
                    key={it.id}
                    className={`flex items-start gap-2 text-sm py-1 px-1.5 -mx-1.5 rounded-sharp ${
                      isFatura ? 'bg-fatura-soft border-l-2 border-fatura' : ''
                    }`}
                  >
                    {canCheck ? (
                      <button
                        onClick={() => toggleEventDate(it.refId, it.occDate || it.date)}
                        aria-label={it.done ? 'Desmarcar' : isFatura ? 'Marcar como paga' : 'Confirmar presença'}
                        title={it.done ? 'Feito — clique para desfazer' : isFatura ? 'Marcar como paga' : 'Marcar que compareci'}
                        className={`mt-0.5 w-4 h-4 shrink-0 rounded-sharp border flex items-center justify-center transition-colors ${
                          it.done
                            ? (isFatura ? 'bg-fatura border-fatura text-washi' : 'bg-success border-success text-washi')
                            : `border-obsidiana/40 ${isFatura ? 'hover:border-fatura' : 'hover:border-success'}`
                        }`}
                      >
                        {it.done && <Check size={11} strokeWidth={3} />}
                      </button>
                    ) : (
                      <span className="font-mono text-[0.7rem] text-aizome w-10 shrink-0 mt-0.5">{it.time || '—'}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className={it.done ? 'line-through text-ink-dim' : isFatura ? 'text-fatura' : ''}>
                        {it.title}
                      </span>
                      {isFatura && it.amount != null && (
                        <span className="font-mono text-[0.72rem] font-bold text-fatura ml-1.5">{currency(it.amount)}</span>
                      )}
                      {it.recurring && (
                        <span className="chip ml-1 text-ink-dim border-line align-middle">
                          <Repeat size={9} /> {RECUR_LABEL[it.recurrence] || 'repete'}
                        </span>
                      )}
                      {!isFatura && (
                        <span className="chip ml-1 text-ink-dim border-line align-middle">{it.kind}</span>
                      )}
                      {isFatura && (
                        <span className="chip ml-1 text-fatura border-fatura/40 align-middle"><Receipt size={9} /> Fatura</span>
                      )}
                      {meetLink && (
                        <a
                          href={meetLink.startsWith('http') ? meetLink : `https://${meetLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 flex items-center gap-1 text-[0.7rem] text-aizome hover:underline w-fit"
                        >
                          <Video size={10} className="shrink-0" /> Entrar na reunião
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* Sugestões do Life OS */}
        <Panel title="Sugestões do Life OS" icon={Sparkles} to="/checklist" accent>
          {suggestions.length === 0 ? (
            <Empty>Sem sugestões pendentes. 🎉</Empty>
          ) : (
            <ul className="space-y-2">
              {suggestions.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-start gap-2 text-sm">
                  <Sparkles size={13} className="mt-0.5 shrink-0 text-horizonte" />
                  <div className="min-w-0">
                    <span>{t.title}</span> <OriginTag origin={t.origin} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Minhas tarefas */}
        <Panel title="Minhas tarefas" icon={CheckSquare} to="/checklist">
          {userTasks.length === 0 ? (
            <Empty>Nenhuma tarefa própria hoje.</Empty>
          ) : (
            <ul className="space-y-1.5">
              {userTasks.slice(0, 6).map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={`w-3.5 h-3.5 rounded-sharp border shrink-0 ${
                      t.done ? 'bg-success border-success' : 'border-obsidiana/40'
                    }`}
                  />
                  <span className={t.done ? 'line-through text-ink-dim' : ''}>{t.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Caixa de entrada */}
        <Panel title="Caixa de entrada" icon={Mail} to="/emails">
          {emailsNeedReply.length === 0 ? (
            <Empty>Nada aguardando resposta. 🎉</Empty>
          ) : (
            <ul className="space-y-2">
              {emailsNeedReply.slice(0, 3).map((e) => (
                <li key={e.id} className="flex items-start gap-2 text-sm">
                  <Reply size={13} className="mt-0.5 shrink-0 text-warn" />
                  <div className="min-w-0">
                    <span className="block truncate"><strong className="font-medium">{e.from.name.split('·')[0].trim()}</strong> — {e.subject}</span>
                  </div>
                </li>
              ))}
              <li className="text-[0.7rem] text-ink-dim pt-1">{emailsNeedReply.length} e-mail(s) aguardando resposta ou ação.</li>
            </ul>
          )}
        </Panel>

        {/* Próximos processos */}
        <Panel title="Próximos processos" icon={Briefcase} to="/processos">
          {upcomingStages.length === 0 ? (
            <Empty>Nenhuma etapa agendada.</Empty>
          ) : (
            <ul className="space-y-2">
              {upcomingStages.map((s) => (
                <li key={`${s.pid}-${s.id}`} className="flex items-center justify-between text-sm gap-2">
                  <span className="min-w-0 truncate">
                    <strong className="font-medium">{s.company}</strong> · {s.title}
                  </span>
                  <DueBadge date={s.date} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Prazos acadêmicos */}
        <Panel title="Prazos acadêmicos" icon={BookOpen} to="/academico">
          {academicDeadlines.length === 0 ? (
            <Empty>Nenhum prazo próximo.</Empty>
          ) : (
            <ul className="space-y-2">
              {academicDeadlines.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="min-w-0 truncate">{a.title}</span>
                  <DueBadge date={a.deadline} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Cursos em andamento */}
        <Panel title="Progresso dos cursos" icon={GraduationCap} to="/cursos">
          {activeCourses.length === 0 ? (
            <Empty>Nenhum curso ativo.</Empty>
          ) : (
            <ul className="space-y-3">
              {activeCourses.map((c) => (
                <li key={c.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate">{c.name}</span>
                    <span className="font-mono text-[0.7rem] text-ink-dim">{courseProgress(c)}%</span>
                  </div>
                  <ProgressBar value={courseProgress(c)} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Leitura */}
        <Panel title="Leitura em andamento" icon={Library} to="/biblioteca">
          {readingBooks.length === 0 ? (
            <Empty>Nenhum livro em andamento.</Empty>
          ) : (
            <ul className="space-y-3">
              {readingBooks.map((b) => (
                <li key={b.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate">{b.title}</span>
                    <span className="font-mono text-[0.7rem] text-ink-dim">{bookProgress(b)}%</span>
                  </div>
                  <ProgressBar value={bookProgress(b)} color="horizonte" />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Produtividade */}
        <Panel title="Produtividade" icon={Flame} to="/metas">
          <div className="space-y-3 text-sm">
            <Metric label="Cumprimento (7 dias)" value={rate == null ? '—' : `${rate}%`} />
            <Metric label="Sequência atual" value={`${streak} ${streak === 1 ? 'dia' : 'dias'}`} />
            <Metric label="Concluídas hoje" value={`${doneCount} de ${todaysTasks.length}`} />
          </div>
        </Panel>
      </div>
    </>
  );
}

function Kpi({ icon: Icon, label, value, hint, accent, small }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={14} className={accent === 'horizonte' ? 'text-horizonte' : 'text-aizome'} />
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-dim">{label}</span>
      </div>
      <div className={`font-heading font-bold ${small ? 'text-lg' : 'text-2xl'} leading-none`}>{value}</div>
      {hint && <span className="text-[0.68rem] text-ink-dim">{hint}</span>}
    </Card>
  );
}

function Panel({ title, icon: Icon, to, children, accent, className = '' }) {
  return (
    <Card className={`${accent ? 'border-horizonte/40 bg-horizonte-soft/20' : ''} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={15} className={accent ? 'text-horizonte' : 'text-aizome'} />
          <h2 className="font-heading font-bold text-base">{title}</h2>
        </div>
        <Link to={to} className="text-ink-dim hover:text-aizome" aria-label={`Ir para ${title}`}>
          <ArrowRight size={15} />
        </Link>
      </div>
      {children}
    </Card>
  );
}

function Empty({ children }) {
  return <p className="text-sm text-ink-dim py-3 text-center">{children}</p>;
}

function Metric({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-dim">{label}</span>
      <span className="font-heading font-bold">{value}</span>
    </div>
  );
}

function DueBadge({ date }) {
  const d = daysUntil(date);
  const label = d === 0 ? 'hoje' : d === 1 ? 'amanhã' : `${d}d`;
  const cls = d <= 1 ? 'text-danger border-danger/40 bg-danger/5' : d <= 4 ? 'text-warn border-warn/40 bg-warn/5' : 'text-ink-dim border-line';
  return (
    <span className={`chip shrink-0 ${cls}`}>
      <Clock size={10} /> {label}
    </span>
  );
}
