// The "brain" of Life OS. Pure functions that read the whole state and
// derive suggested tasks, rollover actions, and notifications.
// Nothing here mutates state — the store applies the results.

import { todayISO, addDays, daysUntil, fromISO, toISO } from './date';

const ROLLOVER_ALERT = 3; // adiada 3+ vezes => sugerir reorganização

function businessDaysUntil(deadline, from = todayISO()) {
  const total = daysUntil(deadline);
  if (total == null) return null;
  if (total <= 0) return 0;
  let count = 0;
  let cur = from;
  for (let i = 0; i < total; i++) {
    cur = addDays(cur, 1);
    const dow = fromISO(cur).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return Math.max(count, 1);
}

// ---- Suggestion generators. Each returns [{ key, title, priority, note, origin }]

function fromCourses(courses) {
  const out = [];
  for (const c of courses) {
    if (c.status === 'Concluído' || c.status === 'Pausado') continue;
    if (!c.deadline) continue;
    const left = daysUntil(c.deadline);
    const overdue = left != null && left < 0;
    let priority = overdue || (left != null && left <= 7) ? 'alta' : 'media';
    let title;

    if ((c.progressMode || 'horas') === 'modulos') {
      const remaining = Math.max((c.totalModules || 0) - (c.completedModules || 0), 0);
      if (remaining <= 0) continue;
      title = overdue
        ? `Recuperar curso atrasado: ${c.name} (${remaining} módulos restantes)`
        : `Avançar em ${c.name} (próximo módulo · ${remaining} restantes)`;
    } else {
      const remaining = Math.max((c.totalHours || 0) - (c.studiedHours || 0), 0);
      if (remaining <= 0) continue;
      const bd = businessDaysUntil(c.deadline);
      const perDay = bd ? remaining / bd : remaining;
      const chunk = Math.min(Math.max(perDay, 0.5), 3);
      title = overdue
        ? `Recuperar curso atrasado: ${c.name} (${remaining.toFixed(1)}h restantes)`
        : `Estudar ${c.name} (~${chunk.toFixed(1)}h hoje)`;
    }

    out.push({
      key: `course:${c.id}:${todayISO()}`,
      title,
      priority,
      note: `Meta calculada para concluir até ${c.deadline}.`,
      origin: { module: 'courses', label: 'Cursos', refId: c.id },
    });
  }
  return out;
}

function fromProcesses(processes) {
  const out = [];
  const horizon = 7;
  for (const p of processes) {
    for (const s of p.stages || []) {
      if (s.status === 'Concluída' || s.status === 'Cancelada') continue;
      const left = daysUntil(s.date);
      if (left == null) continue;
      if (left < 0 || left > horizon) continue;
      out.push({
        key: `stage:${p.id}:${s.id}:${todayISO()}`,
        title: `Preparar ${s.title} — ${p.company}${left === 0 ? ' (hoje!)' : ` (em ${left}d)`}`,
        priority: left <= 2 ? 'alta' : 'media',
        note: `Etapa do processo seletivo da ${p.company}${s.time ? ' às ' + s.time : ''}.`,
        origin: { module: 'processes', label: 'Processos', refId: p.id },
      });
    }
    // Deadline de inscrição próximo
    const applyLeft = daysUntil(p.deadline);
    if (applyLeft != null && applyLeft >= 0 && applyLeft <= 3 && p.status !== 'Inscrito' && p.status !== 'Descartado') {
      out.push({
        key: `apply:${p.id}:${todayISO()}`,
        title: `Finalizar inscrição — ${p.company}${applyLeft === 0 ? ' (encerra hoje!)' : ` (${applyLeft}d)`}`,
        priority: 'alta',
        note: 'Prazo de inscrição se aproximando.',
        origin: { module: 'processes', label: 'Processos', refId: p.id },
      });
    }
  }
  return out;
}

function fromAcademic(projects) {
  const out = [];
  for (const proj of projects) {
    if (proj.status === 'Concluído') continue;
    // next actionable step: earliest not-done with a date <= today+horizon
    const steps = (proj.steps || []).filter((s) => !s.done);
    for (const s of steps) {
      const left = daysUntil(s.date);
      if (left == null) continue;
      if (left > 5) continue;
      out.push({
        key: `acad:${proj.id}:${s.id}:${todayISO()}`,
        title: `${proj.title}: ${s.title}${left < 0 ? ' (atrasado)' : left === 0 ? ' (hoje)' : ''}`,
        priority: left <= 0 ? 'alta' : 'media',
        note: `Etapa de "${proj.title}"${proj.advisor ? ' · orient. ' + proj.advisor : ''}.`,
        origin: { module: 'academic', label: 'Acadêmica', refId: proj.id },
      });
    }
  }
  return out;
}

function fromGoals(goals) {
  const out = [];
  for (const g of goals) {
    if (g.status !== 'Em andamento') continue;
    const left = daysUntil(g.deadline);
    const nextProject = (g.projects || []).find((pr) => !pr.done);
    if (!nextProject) continue;
    // nudge only when the goal is meaningfully time-boxed
    if (left != null && left <= 45) {
      out.push({
        key: `goal:${g.id}:${todayISO()}`,
        title: `Avançar meta "${g.name}": ${nextProject.title}`,
        priority: left <= 14 ? 'alta' : 'media',
        note: `${left != null ? left + ' dias até o prazo. ' : ''}Próximo passo do plano da meta.`,
        origin: { module: 'goals', label: 'Metas', refId: g.id },
      });
    }
  }
  return out;
}

function fromBooks(books) {
  const out = [];
  for (const b of books) {
    if (b.status !== 'Lendo') continue;
    const remaining = Math.max((b.pages || 0) - (b.pagesRead || 0), 0);
    if (remaining <= 0) continue;
    const perDay = Math.max(Math.ceil(remaining / 14), 5); // finish in ~2 weeks
    out.push({
      key: `book:${b.id}:${todayISO()}`,
      title: `Ler "${b.title}": ~${perDay} páginas`,
      priority: 'baixa',
      note: `Meta de leitura para manter o ritmo (${remaining} págs restantes).`,
      origin: { module: 'library', label: 'Biblioteca', refId: b.id },
    });
  }
  return out;
}

// Public: generate the full set of system suggestions for today.
export function generateSuggestions(state) {
  return [
    ...fromProcesses(state.processes),
    ...fromAcademic(state.academic),
    ...fromGoals(state.goals),
    ...fromCourses(state.courses),
    ...fromBooks(state.books),
  ];
}

// Public: detect noteworthy conditions to surface on the dashboard.
export function generateNotifications(state) {
  const notes = [];
  const today = todayISO();

  // Overloaded day
  const todays = state.tasks.filter((t) => t.date === today && !t.done);
  if (todays.length >= 8) {
    notes.push({
      id: 'overload',
      level: 'warn',
      text: `Você tem ${todays.length} tarefas hoje. Considere adiar as de menor prioridade para não sobrecarregar o dia.`,
    });
  }

  // Repeatedly postponed tasks
  const stuck = state.tasks.filter((t) => !t.done && (t.rolloverCount || 0) >= ROLLOVER_ALERT);
  if (stuck.length) {
    notes.push({
      id: 'stuck',
      level: 'danger',
      text: `${stuck.length} tarefa(s) foram adiadas ${ROLLOVER_ALERT}+ vezes${stuck[0] ? ': "' + stuck[0].title + '"' : ''}. Que tal reorganizar a rotina ou quebrá-las em passos menores?`,
    });
  }

  // Calendar conflicts (same date+time across sources)
  // handled in selectors; here we just flag deadlines
  for (const p of state.processes) {
    for (const s of p.stages || []) {
      const left = daysUntil(s.date);
      if (s.status !== 'Concluída' && s.status !== 'Cancelada' && left != null && left >= 0 && left <= 2) {
        notes.push({
          id: `proc-${p.id}-${s.id}`,
          level: 'aizome',
          text: `${s.title} da ${p.company} ${left === 0 ? 'é hoje' : 'em ' + left + ' dia(s)'}${s.time ? ' às ' + s.time : ''}.`,
        });
      }
    }
  }

  for (const proj of state.academic) {
    const left = daysUntil(proj.deadline);
    if (proj.status !== 'Concluído' && left != null && left >= 0 && left <= 5) {
      notes.push({
        id: `acad-${proj.id}`,
        level: 'aizome',
        text: `Prazo de "${proj.title}" em ${left} dia(s).`,
      });
    }
  }

  return notes;
}

export { ROLLOVER_ALERT };
