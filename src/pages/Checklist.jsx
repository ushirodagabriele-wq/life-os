import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  PageHeader, Card, Modal, Field, Input, Textarea, Select, PriorityBadge,
  OriginTag, IconBtn, EmptyState,
} from '../components/ui';
import { todayISO, fmtLong, fmtShort, daysUntil } from '../lib/date';
import {
  Plus, Sparkles, User, Brain, GraduationCap, Pencil, Trash2, Check, RotateCw,
  Clock, AlertTriangle, ArrowDownUp,
} from 'lucide-react';

// Deadline badge styling + label for a task, based on how close its due date is.
// Returns null when the task has no deadline.
function dueMeta(task) {
  if (!task.due) return null;
  const t = task.dueTime ? ` · ${task.dueTime}` : '';
  if (task.done) return { cls: 'text-ink-dim border-line', icon: Clock, label: `${fmtShort(task.due)}${t}` };
  const left = daysUntil(task.due);
  if (left == null) return { cls: 'text-ink-dim border-line', icon: Clock, label: `${fmtShort(task.due)}${t}` };
  if (left < 0) return { overdue: true, cls: 'text-danger border-danger/40 bg-danger/5', icon: AlertTriangle, label: `Atrasada · ${fmtShort(task.due)}${t}` };
  if (left === 0) return { overdue: true, cls: 'text-danger border-danger/40 bg-danger/5', icon: Clock, label: `Vence hoje${t}` };
  if (left <= 2) return { cls: 'text-warn border-warn/40 bg-warn/5', icon: Clock, label: `${fmtShort(task.due)}${t} · em ${left}d` };
  return { cls: 'text-ink-dim border-line', icon: Clock, label: `${fmtShort(task.due)}${t}` };
}

const LISTS = [
  { key: 'pessoal', label: 'Pessoal', icon: User, color: 'text-obsidiana' },
  { key: 'brain', label: 'Brain', icon: Brain, color: 'text-aizome' },
  { key: 'academica', label: 'Acadêmica', icon: GraduationCap, color: 'text-horizonte' },
  { key: 'sugestoes', label: 'Sugestões do Life OS', icon: Sparkles, color: 'text-horizonte' },
];

const PRIORITIES = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
];

export default function Checklist() {
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const toggleTask = useStore((s) => s.toggleTask);
  const acceptSuggestion = useStore((s) => s.acceptSuggestion);

  const [editing, setEditing] = useState(null); // task object or {list} for new
  const [sortBy, setSortBy] = useState('padrao'); // 'padrao' | 'prazo'
  const today = todayISO();
  const todays = tasks.filter((t) => t.date === today);

  // Completed tasks always sink to the bottom. Within the same status, "prazo"
  // orders by due date (then time); tasks without a deadline go last.
  const compare = (a, b) => {
    if (Number(a.done) !== Number(b.done)) return Number(a.done) - Number(b.done);
    if (sortBy === 'prazo') {
      const av = a.due || '9999-12-31', bv = b.due || '9999-12-31';
      if (av !== bv) return av.localeCompare(bv);
      return (a.dueTime || '99:99').localeCompare(b.dueTime || '99:99');
    }
    return 0;
  };

  return (
    <>
      <PageHeader eyebrow="Módulo 02 · Tarefas do dia" title="Checklist Inteligente">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-line rounded-sharp p-0.5" title="Ordenar tarefas">
            {[['padrao', 'Padrão'], ['prazo', 'Por prazo']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setSortBy(v)}
                className={`flex items-center gap-1 px-2 py-1 rounded-sharp font-mono text-[0.6rem] uppercase tracking-[0.06em] transition-colors ${
                  sortBy === v ? 'bg-obsidiana text-washi' : 'text-ink-dim hover:text-obsidiana'
                }`}
              >
                {v === 'prazo' && <ArrowDownUp size={11} />} {label}
              </button>
            ))}
          </div>
          <span className="hidden sm:inline font-mono text-[0.7rem] text-ink-dim capitalize">{fmtLong(today)}</span>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        {LISTS.map((list) => {
          const items = todays
            .filter((t) => t.list === list.key)
            .sort(compare);
          const isSuggestion = list.key === 'sugestoes';
          return (
            <Card key={list.key} className={isSuggestion ? 'border-horizonte/40 bg-horizonte-soft/30' : ''}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <list.icon size={16} className={list.color} />
                  <h2 className="font-heading font-bold text-base">{list.label}</h2>
                  <span className="chip text-ink-dim border-line">{items.length}</span>
                </div>
                {!isSuggestion && (
                  <IconBtn icon={Plus} label="Adicionar tarefa" onClick={() => setEditing({ list: list.key })} />
                )}
              </div>

              {isSuggestion && (
                <p className="text-[0.72rem] text-ink-dim mb-3 flex items-start gap-1.5">
                  <Sparkles size={13} className="mt-0.5 shrink-0 text-horizonte" />
                  Geradas automaticamente a partir dos seus cursos, processos, metas e prazos. Aceite para mover à sua lista.
                </p>
              )}

              {items.length === 0 ? (
                <p className="text-sm text-ink-dim py-4 text-center">Nada por aqui.</p>
              ) : (
                <ul className="space-y-1.5">
                  {items.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      onToggle={() => toggleTask(t.id)}
                      onEdit={() => setEditing(t)}
                      onDelete={() => deleteTask(t.id)}
                      onAccept={() => acceptSuggestion(t.id)}
                    />
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      {editing && (
        <TaskModal
          task={editing.id ? editing : null}
          defaultList={editing.list}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (editing.id) updateTask(editing.id, data);
            else addTask(data);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function TaskRow({ task, onToggle, onEdit, onDelete, onAccept }) {
  const isSystem = task.source === 'system';
  const due = dueMeta(task);
  return (
    <li className={`group flex items-start gap-2.5 py-1.5 border-b border-line/60 last:border-0 ${
      due?.overdue ? 'border-l-2 border-l-danger bg-danger/5 pl-2 -ml-2 rounded-sharp' : ''
    }`}>
      <button
        onClick={onToggle}
        aria-label={task.done ? 'Desmarcar' : 'Concluir'}
        className={`mt-0.5 w-4 h-4 shrink-0 rounded-sharp border flex items-center justify-center transition-colors ${
          task.done ? 'bg-success border-success text-washi' : 'border-obsidiana/40 hover:border-aizome'
        }`}
      >
        {task.done && <Check size={11} strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-sm ${task.done ? 'line-through text-ink-dim' : 'text-obsidiana'}`}>
            {task.title}
          </span>
          {task.priority && task.priority !== 'media' && <PriorityBadge priority={task.priority} />}
          {due && (
            <span className={`chip ${due.cls}`} title="Prazo de entrega">
              <due.icon size={10} /> {due.label}
            </span>
          )}
          {isSystem && <OriginTag origin={task.origin} />}
          {(task.rolloverCount || 0) > 0 && (
            <span className="chip text-warn border-warn/40 bg-warn/5" title="Vezes adiada">
              <RotateCw size={10} /> {task.rolloverCount}x
            </span>
          )}
        </div>
        {task.note && <p className="text-[0.72rem] text-ink-dim mt-0.5">{task.note}</p>}
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {isSystem && !task.done && (
          <IconBtn icon={Check} label="Aceitar sugestão" onClick={onAccept} className="hover:text-success" />
        )}
        <IconBtn icon={Pencil} label="Editar" onClick={onEdit} />
        <IconBtn icon={Trash2} label="Excluir" onClick={onDelete} className="hover:text-danger" />
      </div>
    </li>
  );
}

function TaskModal({ task, defaultList, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    list: task?.list || defaultList || 'pessoal',
    priority: task?.priority || 'media',
    note: task?.note || '',
    date: task?.date || todayISO(),
    due: task?.due || '',
    dueTime: task?.dueTime || '',
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal open onClose={onClose} title={task ? 'Editar tarefa' : 'Nova tarefa'}>
      <Field label="Título">
        <Input value={form.title} onChange={set('title')} autoFocus placeholder="O que precisa ser feito?" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Lista">
          <Select
            value={form.list}
            onChange={set('list')}
            options={LISTS.filter((l) => l.key !== 'sugestoes').map((l) => ({ value: l.key, label: l.label }))}
          />
        </Field>
        <Field label="Prioridade">
          <Select value={form.priority} onChange={set('priority')} options={PRIORITIES} />
        </Field>
      </div>
      <Field label="Dia da tarefa">
        <Input type="date" value={form.date} onChange={set('date')} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prazo (vencimento)">
          <Input type="date" value={form.due} onChange={set('due')} />
        </Field>
        <Field label="Horário do prazo (opcional)">
          <Input type="time" value={form.dueTime} onChange={set('dueTime')} disabled={!form.due} />
        </Field>
      </div>
      <Field label="Observações">
        <Textarea value={form.note} onChange={set('note')} placeholder="Notas, links, contexto..." />
      </Field>
      <div className="flex justify-end gap-2 mt-2">
        <button className="btn-soft" onClick={onClose}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={() => form.title.trim() && onSave({ ...form, dueTime: form.due ? form.dueTime : '' })}
        >
          Salvar
        </button>
      </div>
    </Modal>
  );
}
