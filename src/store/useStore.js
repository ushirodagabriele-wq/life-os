import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildSeed } from './seed';
import { uid } from '../lib/id';
import { todayISO, addDays } from '../lib/date';
import { generateSuggestions } from '../lib/intelligence';

// Generic helper: immutable update of an item in an array field.
const upd = (arr, id, patch) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it));
const del = (arr, id) => arr.filter((it) => it.id !== id);

export const useStore = create(
  persist(
    (set, get) => ({
      ...buildSeed(),

      // ---------------------------------------------------------------
      // TASKS / CHECKLIST
      // ---------------------------------------------------------------
      addTask: (task) =>
        set((s) => ({
          tasks: [
            {
              id: uid('t'),
              date: todayISO(),
              done: false,
              priority: 'media',
              note: '',
              source: 'user',
              rolloverCount: 0,
              createdAt: todayISO(),
              ...task,
            },
            ...s.tasks,
          ],
        })),
      updateTask: (id, patch) => set((s) => ({ tasks: upd(s.tasks, id, patch) })),
      deleteTask: (id) => set((s) => ({ tasks: del(s.tasks, id) })),
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? todayISO() : null } : t
          ),
        })),

      // ---------------------------------------------------------------
      // EVENTOS (radar de oportunidades) — estado do usuário sobre o snapshot
      // ---------------------------------------------------------------
      toggleSaveEvent: (id) =>
        set((s) => ({
          savedEvents: s.savedEvents.includes(id)
            ? s.savedEvents.filter((x) => x !== id)
            : [id, ...s.savedEvents],
        })),
      // Registra visualização (histórico + base das recomendações). Mais
      // recente primeiro, sem duplicar, limitado às últimas 100.
      markEventViewed: (id) =>
        set((s) => ({
          viewedEvents: [id, ...s.viewedEvents.filter((x) => x !== id)].slice(0, 100),
        })),
      markEventsSeen: () => set({ eventsSeenAt: new Date().toISOString() }),
      // Adiciona o evento à agenda da plataforma (cria um compromisso) e marca
      // como vinculado para não duplicar.
      addEventToCalendar: (ev) => {
        if (get().linkedEvents.includes(ev.id)) return;
        const online = ev.format === 'online';
        get().addEvent({
          title: ev.name,
          date: ev.date || ev.deadline || todayISO(),
          time: ev.time || '',
          endTime: ev.endTime || '',
          location: online ? '' : (ev.venue || ev.city || ''),
          meetingLink: online ? ev.url : '',
          type: 'pessoal',
          note: `${ev.org}\n${ev.description}\nInscrição: ${ev.url}`,
        });
        set((s) => ({ linkedEvents: [ev.id, ...s.linkedEvents] }));
      },

      // ---------------------------------------------------------------
      // EVENTS (personal calendar entries)
      // ---------------------------------------------------------------
      addEvent: (e) =>
        set((s) => ({
          events: [
            { id: uid('e'), category: 'compromisso', recurrence: 'none', doneDates: [], ...e },
            ...s.events,
          ],
        })),
      updateEvent: (id, patch) =>
        set((s) => {
          const events = upd(s.events, id, patch);
          const ev = events.find((e) => e.id === id);
          // Keep any already-created finance entries in sync with the fatura.
          let expenses = s.expenses;
          if (ev && ev.category === 'fatura') {
            expenses = expenses.map((x) =>
              x.sourceEventId === id
                ? { ...x, amount: Number(ev.amount) || 0, category: ev.financeCategory || 'Outros', place: ev.title }
                : x
            );
          }
          return { events, expenses };
        }),
      deleteEvent: (id) => set((s) => ({ events: del(s.events, id) })),
      // Mark a single occurrence (by date) as done/attended/paid — toggles membership.
      // For faturas, this also mirrors the value into Finances (and reverses it).
      toggleEventDate: (id, date) =>
        set((s) => {
          const ev = s.events.find((e) => e.id === id);
          if (!ev) return {};
          const dates = ev.doneDates || [];
          const marking = !dates.includes(date);
          const events = s.events.map((e) =>
            e.id === id
              ? { ...e, doneDates: marking ? [...dates, date] : dates.filter((d) => d !== date) }
              : e
          );

          let expenses = s.expenses;
          if (ev.category === 'fatura') {
            if (marking) {
              const already = expenses.some((x) => x.sourceEventId === id && x.sourceDate === date);
              if (!already && ev.amount != null) {
                expenses = [
                  {
                    id: uid('x'),
                    amount: Number(ev.amount) || 0,
                    category: ev.financeCategory || 'Outros',
                    place: ev.title,
                    date,
                    note: 'Fatura paga (via calendário)',
                    sourceEventId: id,
                    sourceDate: date,
                  },
                  ...expenses,
                ];
              }
            } else {
              // Unpaying removes the auto-created entry (manual edits/deletes are safe no-ops).
              expenses = expenses.filter((x) => !(x.sourceEventId === id && x.sourceDate === date));
            }
          }
          return { events, expenses };
        }),

      // ---------------------------------------------------------------
      // COURSES
      // ---------------------------------------------------------------
      addCourse: (c) =>
        set((s) => ({
          courses: [
            { id: uid('c'), status: 'Em andamento', progressMode: 'horas', studiedHours: 0, completedModules: 0, ...c },
            ...s.courses,
          ],
        })),
      updateCourse: (id, patch) => set((s) => ({ courses: upd(s.courses, id, patch) })),
      deleteCourse: (id) => set((s) => ({ courses: del(s.courses, id) })),

      // ---------------------------------------------------------------
      // PROCESSES
      // ---------------------------------------------------------------
      addProcess: (p) =>
        set((s) => ({
          processes: [{ id: uid('p'), status: 'Interesse', contacts: [], stages: [], links: [], ...p }, ...s.processes],
        })),
      updateProcess: (id, patch) => set((s) => ({ processes: upd(s.processes, id, patch) })),
      deleteProcess: (id) => set((s) => ({ processes: del(s.processes, id) })),
      // Turn a suggested plan (e.g. from an email) into a process + stages.
      // Finds an existing process by company (or creates one) and appends only
      // the stages that aren't already there (deduped by title). Stages flow to
      // the calendar automatically. Returns the affected process id.
      addStagesToProcess: ({ company, program, area, applyLink, deadline, stages = [] }) => {
        let targetId;
        set((s) => {
          let processes = s.processes;
          let proc = processes.find((p) => (p.company || '').toLowerCase() === company.toLowerCase());
          if (!proc) {
            proc = {
              id: uid('p'), company, program: program || '', area: area || '', description: '',
              links: [], applyLink: applyLink || '', deadline: deadline || '', status: 'Em processo',
              contacts: [], stages: [],
            };
            processes = [proc, ...processes];
          }
          targetId = proc.id;
          const existing = new Set((proc.stages || []).map((st) => (st.title || '').toLowerCase()));
          const toAdd = stages
            .filter((st) => !existing.has((st.title || '').toLowerCase()))
            .map((st) => ({ id: uid('s'), status: 'Pendente', ...st }));
          processes = processes.map((p) =>
            p.id === proc.id
              ? { ...p, stages: [...(p.stages || []), ...toAdd], applyLink: p.applyLink || applyLink || '' }
              : p
          );
          return { processes };
        });
        return targetId;
      },
      addStage: (pid, stage) =>
        set((s) => ({
          processes: s.processes.map((p) =>
            p.id === pid ? { ...p, stages: [...(p.stages || []), { id: uid('s'), status: 'Pendente', ...stage }] } : p
          ),
        })),
      updateStage: (pid, sid, patch) =>
        set((s) => ({
          processes: s.processes.map((p) =>
            p.id === pid ? { ...p, stages: upd(p.stages, sid, patch) } : p
          ),
        })),
      deleteStage: (pid, sid) =>
        set((s) => ({
          processes: s.processes.map((p) => (p.id === pid ? { ...p, stages: del(p.stages, sid) } : p)),
        })),
      addContact: (pid, contact) =>
        set((s) => ({
          processes: s.processes.map((p) =>
            p.id === pid ? { ...p, contacts: [...(p.contacts || []), { id: uid('ct'), ...contact }] } : p
          ),
        })),
      deleteContact: (pid, cid) =>
        set((s) => ({
          processes: s.processes.map((p) => (p.id === pid ? { ...p, contacts: del(p.contacts, cid) } : p)),
        })),

      // ---------------------------------------------------------------
      // ACADEMIC
      // ---------------------------------------------------------------
      addAcademic: (a) =>
        set((s) => ({
          academic: [{ id: uid('a'), status: 'Em andamento', steps: [], docs: [], priority: 'media', ...a }, ...s.academic],
        })),
      updateAcademic: (id, patch) => set((s) => ({ academic: upd(s.academic, id, patch) })),
      deleteAcademic: (id) => set((s) => ({ academic: del(s.academic, id) })),
      addStep: (aid, step) =>
        set((s) => ({
          academic: s.academic.map((a) =>
            a.id === aid ? { ...a, steps: [...(a.steps || []), { id: uid('st'), done: false, ...step }] } : a
          ),
        })),
      updateStep: (aid, sid, patch) =>
        set((s) => ({
          academic: s.academic.map((a) => (a.id === aid ? { ...a, steps: upd(a.steps, sid, patch) } : a)),
        })),
      deleteStep: (aid, sid) =>
        set((s) => ({
          academic: s.academic.map((a) => (a.id === aid ? { ...a, steps: del(a.steps, sid) } : a)),
        })),
      addDoc: (aid, doc) =>
        set((s) => ({
          academic: s.academic.map((a) =>
            a.id === aid ? { ...a, docs: [...(a.docs || []), { id: uid('d'), ...doc }] } : a
          ),
        })),
      deleteDoc: (aid, did) =>
        set((s) => ({
          academic: s.academic.map((a) => (a.id === aid ? { ...a, docs: del(a.docs, did) } : a)),
        })),

      // ---------------------------------------------------------------
      // NOTES (free studies)
      // ---------------------------------------------------------------
      addNote: (n) => set((s) => ({ notes: [{ id: uid('n'), updatedAt: todayISO(), ...n }, ...s.notes] })),
      updateNote: (id, patch) =>
        set((s) => ({ notes: upd(s.notes, id, { ...patch, updatedAt: todayISO() }) })),
      deleteNote: (id) => set((s) => ({ notes: del(s.notes, id) })),

      // ---------------------------------------------------------------
      // BOOKS
      // ---------------------------------------------------------------
      addBook: (b) =>
        set((s) => ({ books: [{ id: uid('b'), status: 'Quero ler', pagesRead: 0, rating: 0, ...b }, ...s.books] })),
      updateBook: (id, patch) => set((s) => ({ books: upd(s.books, id, patch) })),
      deleteBook: (id) => set((s) => ({ books: del(s.books, id) })),

      // ---------------------------------------------------------------
      // MEDIA (movies & series)
      // ---------------------------------------------------------------
      addMedia: (m) =>
        set((s) => ({ media: [{ id: uid('m'), status: 'Quero assistir', rating: 0, ...m }, ...s.media] })),
      updateMedia: (id, patch) => set((s) => ({ media: upd(s.media, id, patch) })),
      deleteMedia: (id) => set((s) => ({ media: del(s.media, id) })),

      // ---------------------------------------------------------------
      // EXPENSES
      // ---------------------------------------------------------------
      addExpense: (x) =>
        set((s) => ({ expenses: [{ id: uid('x'), ...x, date: x.date || todayISO() }, ...s.expenses] })),
      updateExpense: (id, patch) => set((s) => ({ expenses: upd(s.expenses, id, patch) })),
      deleteExpense: (id) => set((s) => ({ expenses: del(s.expenses, id) })),
      // One-time removal of the demo/example data that fed the calendar,
      // keeping the user's real Google-synced events. Idempotent via meta flag.
      clearDemoData: () =>
        set((s) => {
          if (s.meta?.demoCleared) return {};
          return {
            events: (s.events || []).filter((e) => e.fromGoogle),
            processes: [],
            academic: [],
            courses: [],
            goals: [],
            meta: { ...(s.meta || {}), demoCleared: true },
          };
        }),

      // Self-heal legacy/corrupted rows (e.g. expenses persisted without a date).
      healData: () =>
        set((s) => ({
          expenses: s.expenses.map((x) => (x && x.date ? x : { ...x, date: todayISO() })),
          events: s.events.map((e) => (e && e.doneDates ? e : { ...e, doneDates: [] })),
          biblePlan: s.biblePlan && Array.isArray(s.biblePlan.done) ? s.biblePlan : { done: [], startedAt: null },
          timeline: s.timeline && typeof s.timeline === 'object' ? s.timeline : {},
        })),

      // ---------------------------------------------------------------
      // CRONOGRAMA DO DIA (time-blocking)
      // ---------------------------------------------------------------
      setTimelineSlot: (date, hour, text) =>
        set((s) => {
          const tl = s.timeline || {};
          const day = { ...(tl[date] || {}) };
          if (text && text.trim()) day[hour] = text;
          else delete day[hour];
          const next = { ...tl };
          if (Object.keys(day).length) next[date] = day;
          else delete next[date];
          return { timeline: next };
        }),

      // ---------------------------------------------------------------
      // BIBLE READING PLAN
      // ---------------------------------------------------------------
      toggleBibleDay: (day) =>
        set((s) => {
          const bp = s.biblePlan || { done: [], startedAt: null };
          const done = bp.done || [];
          const has = done.includes(day);
          return {
            biblePlan: {
              ...bp,
              done: has ? done.filter((d) => d !== day) : [...done, day],
              startedAt: bp.startedAt || todayISO(),
            },
          };
        }),
      resetBiblePlan: () => set((s) => ({ biblePlan: { done: [], startedAt: null } })),

      // ---------------------------------------------------------------
      // GOALS
      // ---------------------------------------------------------------
      addGoal: (g) =>
        set((s) => ({
          goals: [{ id: uid('g'), status: 'Não iniciada', projects: [], importance: 3, priority: 'media', start: todayISO(), ...g }, ...s.goals],
        })),
      updateGoal: (id, patch) => set((s) => ({ goals: upd(s.goals, id, patch) })),
      deleteGoal: (id) => set((s) => ({ goals: del(s.goals, id) })),
      addGoalProject: (gid, title) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === gid ? { ...g, projects: [...(g.projects || []), { id: uid('pr'), title, done: false }] } : g
          ),
        })),
      toggleGoalProject: (gid, pid) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === gid ? { ...g, projects: g.projects.map((pr) => (pr.id === pid ? { ...pr, done: !pr.done } : pr)) } : g
          ),
        })),
      deleteGoalProject: (gid, pid) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === gid ? { ...g, projects: del(g.projects, pid) } : g)),
        })),

      // ---------------------------------------------------------------
      // INTELLIGENCE — daily maintenance + suggestion sync
      // ---------------------------------------------------------------

      // Regenerate system suggestions for today (idempotent via stable keys).
      syncSuggestions: () => {
        const state = get();
        const suggestions = generateSuggestions(state);
        const existingKeys = new Set(
          state.tasks.filter((t) => t.suggestionKey).map((t) => t.suggestionKey)
        );
        const today = todayISO();
        const newTasks = suggestions
          .filter((sug) => !existingKeys.has(sug.key))
          .map((sug) => ({
            id: uid('t'),
            title: sug.title,
            list: 'sugestoes',
            date: today,
            done: false,
            priority: sug.priority,
            note: sug.note,
            source: 'system',
            origin: sug.origin,
            suggestionKey: sug.key,
            rolloverCount: 0,
            createdAt: today,
          }));

        // Drop stale, still-open suggestions that are no longer generated
        const liveKeys = new Set(suggestions.map((s) => s.key));
        set((s) => ({
          tasks: [
            ...newTasks,
            ...s.tasks.filter((t) => {
              if (t.source !== 'system') return true;
              if (t.done) return true; // keep completed ones for history
              return liveKeys.has(t.suggestionKey);
            }),
          ],
        }));
      },

      // Run once per day: roll over incomplete user tasks, snapshot history.
      runDailyMaintenance: () => {
        const state = get();
        const today = todayISO();
        if (state.meta.lastMaintenance === today) {
          get().syncSuggestions();
          return;
        }

        // Snapshot each past day up to yesterday for the history/streak.
        const history = { ...state.meta.history };
        const relevant = state.tasks.filter((t) => t.date < today);
        const byDate = {};
        for (const t of relevant) {
          if (!byDate[t.date]) byDate[t.date] = { completed: 0, planned: 0 };
          byDate[t.date].planned++;
          if (t.done) byDate[t.date].completed++;
        }
        for (const [d, v] of Object.entries(byDate)) history[d] = v;

        // Roll over: incomplete, past, user-authored tasks move to today.
        const tasks = state.tasks
          .filter((t) => {
            // discard past, incomplete SYSTEM suggestions (they'll regenerate)
            if (t.source === 'system' && !t.done && t.date < today) return false;
            return true;
          })
          .map((t) => {
            if (t.source !== 'system' && !t.done && t.date < today) {
              return { ...t, date: today, rolloverCount: (t.rolloverCount || 0) + 1 };
            }
            return t;
          });

        set({ tasks, meta: { ...state.meta, lastMaintenance: today, history } });
        get().syncSuggestions();
      },

      // Promote a suggestion into a "real" personal task (accept it).
      acceptSuggestion: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, list: 'pessoal', source: 'user', acceptedFromSystem: true } : t
          ),
        })),

      // ---------------------------------------------------------------
      // DATA MANAGEMENT
      // ---------------------------------------------------------------
      resetAll: () => set({ ...buildSeed() }),
      importData: (data) => set({ ...data }),
    }),
    {
      name: 'life-os-store',
      version: 1,
    }
  )
);
