import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  PageHeader, Card, Modal, Field, Input, Select, Textarea, ProgressBar,
  StatusBadge, PriorityBadge, IconBtn, EmptyState,
} from '../components/ui';
import { goalProgress, computeStreak, completionRate } from '../store/selectors';
import { daysUntil, fmtShort, todayISO } from '../lib/date';
import {
  Plus, Pencil, Trash2, Target, Check, Clock, Flame, TrendingUp,
  CheckCircle2, AlertTriangle, ListChecks,
} from 'lucide-react';

const CATEGORIES = ['Pessoal', 'Acadêmica', 'Profissional', 'Financeira', 'Saúde', 'Leitura', 'Desenvolvimento Pessoal', 'Outra'];
const STATUS = ['Não iniciada', 'Em andamento', 'Concluída', 'Pausada'];
const PRIORITY = [{ value: 'alta', label: 'Alta' }, { value: 'media', label: 'Média' }, { value: 'baixa', label: 'Baixa' }];

export default function Goals() {
  const state = useStore();
  const goals = useStore((s) => s.goals);
  const addGoal = useStore((s) => s.addGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const [editing, setEditing] = useState(null);

  const active = goals.filter((g) => g.status === 'Em andamento');
  const done = goals.filter((g) => g.status === 'Concluída');
  const overdue = goals.filter((g) => g.status === 'Em andamento' && daysUntil(g.deadline) != null && daysUntil(g.deadline) < 0);
  const soon = active.filter((g) => { const d = daysUntil(g.deadline); return d != null && d >= 0 && d <= 14; });
  const pct = goals.length ? Math.round((done.length / goals.length) * 100) : 0;
  const streak = computeStreak(state);
  const rate = completionRate(state);

  return (
    <>
      <PageHeader eyebrow="Módulo 06 · Metas & OKRs" title="Metas & Objetivos">
        <button className="btn-ghost" onClick={() => setEditing({})}>
          <Plus size={14} /> Nova meta
        </button>
      </PageHeader>

      {/* Dashboard indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <Ind icon={Target} label="Em andamento" value={active.length} />
        <Ind icon={CheckCircle2} label="Concluídas" value={done.length} accent="success" />
        <Ind icon={AlertTriangle} label="Atrasadas" value={overdue.length} accent="danger" />
        <Ind icon={Clock} label="Prazo ≤14d" value={soon.length} accent="warn" />
        <Ind icon={Flame} label="Sequência" value={`${streak}d`} accent="horizonte" />
        <Ind icon={TrendingUp} label="Cumprim. 7d" value={rate == null ? '—' : `${rate}%`} />
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-heading font-bold">Progresso geral</span>
          <span className="font-mono text-[0.72rem] text-ink-dim">{done.length}/{goals.length} concluídas · {pct}%</span>
        </div>
        <ProgressBar value={pct} color="success" className="h-2" />
      </div>

      {goals.length === 0 ? (
        <Card><EmptyState icon={Target} title="Nenhuma meta definida" hint="Crie uma meta — o Life OS a transforma em projetos e tarefas ao longo do tempo." /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} onEdit={() => setEditing(g)} onDelete={() => deleteGoal(g.id)} />
          ))}
        </div>
      )}

      {editing && (
        <GoalModal
          goal={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSave={(data, autoProjects) => {
            if (editing.id) useStore.getState().updateGoal(editing.id, data);
            else {
              addGoal(data);
              if (autoProjects) {
                const created = useStore.getState().goals[0];
                autoProjects.forEach((t) => useStore.getState().addGoalProject(created.id, t));
              }
            }
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function Ind({ icon: Icon, label, value, accent }) {
  const color = { success: 'text-success', danger: 'text-danger', warn: 'text-warn', horizonte: 'text-horizonte' }[accent] || 'text-aizome';
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={13} className={color} />
        <span className="font-mono text-[0.55rem] uppercase tracking-[0.08em] text-ink-dim leading-tight">{label}</span>
      </div>
      <div className="font-heading font-bold text-xl leading-none">{value}</div>
    </Card>
  );
}

function GoalCard({ goal: g, onEdit, onDelete }) {
  const addGoalProject = useStore((s) => s.addGoalProject);
  const toggleGoalProject = useStore((s) => s.toggleGoalProject);
  const deleteGoalProject = useStore((s) => s.deleteGoalProject);
  const [newProject, setNewProject] = useState('');
  const progress = goalProgress(g);
  const left = daysUntil(g.deadline);
  const doneCount = (g.projects || []).filter((p) => p.done).length;

  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="chip text-aizome border-aizome/40 bg-aizome-soft">{g.category}</span>
            <StatusBadge status={g.status} />
            <PriorityBadge priority={g.priority} />
          </div>
          <h3 className="font-heading font-bold text-lg leading-tight">{g.name}</h3>
          {g.description && <p className="text-[0.78rem] text-ink-dim mt-0.5">{g.description}</p>}
        </div>
        <div className="flex gap-0.5 shrink-0">
          <IconBtn icon={Pencil} label="Editar" onClick={onEdit} />
          <IconBtn icon={Trash2} label="Excluir" onClick={onDelete} className="hover:text-danger" />
        </div>
      </div>

      <div className="flex items-center gap-3 my-3">
        <ProgressBar value={progress} color="success" />
        <span className="font-mono text-[0.72rem] text-ink-dim shrink-0">{progress}%</span>
      </div>

      <div className="flex items-center gap-2 text-[0.7rem] text-ink-dim mb-3">
        {g.deadline && (
          <span className={`chip ${left != null && left < 0 ? 'text-danger border-danger/40' : 'text-ink-dim border-line'}`}>
            <Clock size={10} /> {left != null && left < 0 ? `atrasada ${-left}d` : `${fmtShort(g.deadline)} · ${left}d`}
          </span>
        )}
        <span className="chip text-ink-dim border-line"><ListChecks size={10} /> {doneCount}/{(g.projects || []).length} projetos</span>
        <span className="flex items-center gap-0.5">Importância: {'★'.repeat(g.importance || 0)}</span>
      </div>

      {/* Projects / milestones */}
      <div className="mt-auto border-t border-line pt-3">
        <h4 className="label mb-2">Projetos & marcos</h4>
        <ul className="space-y-1.5">
          {(g.projects || []).map((p) => (
            <li key={p.id} className="group flex items-center gap-2 text-sm">
              <button
                onClick={() => toggleGoalProject(g.id, p.id)}
                className={`w-4 h-4 rounded-sharp border shrink-0 flex items-center justify-center ${p.done ? 'bg-success border-success text-washi' : 'border-obsidiana/40'}`}
                aria-label="Alternar projeto"
              >
                {p.done && <Check size={11} strokeWidth={3} />}
              </button>
              <span className={`flex-1 ${p.done ? 'line-through text-ink-dim' : ''}`}>{p.title}</span>
              <IconBtn icon={Trash2} label="Excluir projeto" onClick={() => deleteGoalProject(g.id, p.id)} className="opacity-0 group-hover:opacity-100 hover:text-danger" />
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-2">
          <input
            className="input py-1.5"
            placeholder="Novo projeto/marco..."
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && newProject.trim()) { addGoalProject(g.id, newProject.trim()); setNewProject(''); } }}
          />
          <button className="btn-soft shrink-0" onClick={() => { if (newProject.trim()) { addGoalProject(g.id, newProject.trim()); setNewProject(''); } }}>
            <Plus size={13} />
          </button>
        </div>
      </div>
    </Card>
  );
}

function GoalModal({ goal, onClose, onSave }) {
  const [f, setF] = useState({
    name: goal?.name || '', category: goal?.category || 'Profissional', description: goal?.description || '',
    start: goal?.start || todayISO(), deadline: goal?.deadline || '', priority: goal?.priority || 'media',
    importance: goal?.importance || 3, status: goal?.status || 'Em andamento',
  });
  const [plan, setPlan] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Turn the free-text "context" into initial projects (one per line).
  const buildProjects = () => plan.split('\n').map((l) => l.trim()).filter(Boolean);

  return (
    <Modal open onClose={onClose} wide title={goal ? 'Editar meta' : 'Nova meta'}>
      <Field label="Nome da meta"><Input value={f.name} onChange={set('name')} autoFocus placeholder="Conseguir estágio no mercado financeiro" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoria"><Select value={f.category} onChange={set('category')} options={CATEGORIES} /></Field>
        <Field label="Status"><Select value={f.status} onChange={set('status')} options={STATUS} /></Field>
      </div>
      <Field label="Descrição"><Textarea value={f.description} onChange={set('description')} /></Field>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Início"><Input type="date" value={f.start} onChange={set('start')} /></Field>
        <Field label="Prazo final"><Input type="date" value={f.deadline} onChange={set('deadline')} /></Field>
        <Field label="Prioridade"><Select value={f.priority} onChange={set('priority')} options={PRIORITY} /></Field>
        <Field label="Importância (1-5)"><Input type="number" min="1" max="5" value={f.importance} onChange={(e) => setF({ ...f, importance: Number(e.target.value) })} /></Field>
      </div>

      {!goal && (
        <Field label="Plano inicial — um projeto/marco por linha (opcional)">
          <Textarea
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="input min-h-[100px] resize-y"
            placeholder={'Concluir todos os cursos\nAtualizar currículo\nCandidatar-se às empresas\nPreparar entrevistas'}
          />
        </Field>
      )}

      <div className="flex justify-end gap-2 mt-2">
        <button className="btn-soft" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={() => f.name.trim() && onSave(f, goal ? null : buildProjects())}>Salvar</button>
      </div>
    </Modal>
  );
}
