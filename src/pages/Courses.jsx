import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  PageHeader, Card, Modal, Field, Input, Select, Textarea, ProgressBar,
  StatusBadge, IconBtn, EmptyState,
} from '../components/ui';
import { courseProgress } from '../store/selectors';
import { daysUntil, fmtShort } from '../lib/date';
import { Plus, Pencil, Trash2, ExternalLink, GraduationCap, Clock } from 'lucide-react';

const STATUS = ['Em andamento', 'Pausado', 'Concluído'];

export default function Courses() {
  const courses = useStore((s) => s.courses);
  const addCourse = useStore((s) => s.addCourse);
  const updateCourse = useStore((s) => s.updateCourse);
  const deleteCourse = useStore((s) => s.deleteCourse);
  const [editing, setEditing] = useState(null);

  return (
    <>
      <PageHeader eyebrow="Módulo 11 · Cursos" title="Central de Cursos">
        <button className="btn-ghost" onClick={() => setEditing({})}>
          <Plus size={14} /> Novo curso
        </button>
      </PageHeader>

      {courses.length === 0 ? (
        <Card><EmptyState icon={GraduationCap} title="Nenhum curso ainda" hint="Cadastre um curso e o Life OS calcula seu cronograma de estudos." /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onEdit={() => setEditing(c)}
              onDelete={() => deleteCourse(c.id)}
              onUpdate={(patch) => updateCourse(c.id, patch)}
            />
          ))}
        </div>
      )}

      {editing && (
        <CourseModal
          course={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (editing.id) updateCourse(editing.id, data);
            else addCourse(data);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function CourseCard({ course: c, onEdit, onDelete, onUpdate }) {
  const mode = c.progressMode || 'horas';
  const progress = courseProgress(c);
  const left = daysUntil(c.deadline);

  const logHours = (h) => {
    const next = (c.studiedHours || 0) + h;
    onUpdate({ studiedHours: c.totalHours ? Math.min(next, c.totalHours) : Math.max(next, 0) });
  };
  const logModule = (n) => {
    const next = (c.completedModules || 0) + n;
    onUpdate({ completedModules: c.totalModules ? Math.min(Math.max(next, 0), c.totalModules) : Math.max(next, 0) });
  };

  // Deadline hint, per metric.
  let hint = null;
  if (c.status === 'Em andamento' && c.deadline && left != null) {
    if (mode === 'modulos' && c.totalModules) {
      const rem = Math.max(c.totalModules - (c.completedModules || 0), 0);
      if (rem > 0) {
        const weeks = Math.max(Math.round(left / 7), 1);
        hint = <>Para concluir no prazo: <b>~{(rem / weeks).toFixed(1)} módulos/semana</b> ({rem} restantes).</>;
      }
    } else if (mode === 'horas' && c.totalHours) {
      const rem = Math.max(c.totalHours - (c.studiedHours || 0), 0);
      if (rem > 0) {
        const bd = left > 0 ? Math.max(Math.round((left * 5) / 7), 1) : 1;
        hint = <>Para concluir no prazo: <b>~{(rem / bd).toFixed(1)}h/dia útil</b> ({rem.toFixed(1)}h restantes).</>;
      }
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="font-heading font-bold text-base leading-tight">{c.name}</h3>
          <p className="text-[0.72rem] text-ink-dim mt-0.5">{c.platform}</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {c.link && (
            <a href={c.link} target="_blank" rel="noopener noreferrer" className="p-1.5 text-ink-dim hover:text-aizome" aria-label="Abrir curso">
              <ExternalLink size={15} />
            </a>
          )}
          <IconBtn icon={Pencil} label="Editar" onClick={onEdit} />
          <IconBtn icon={Trash2} label="Excluir" onClick={onDelete} className="hover:text-danger" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <StatusBadge status={c.status} />
        <span className="chip text-ink-dim border-line">
          {mode === 'modulos' ? 'Por módulos' : 'Por horas'}
        </span>
        {c.deadline && (
          <span className={`chip ${left != null && left < 0 ? 'text-danger border-danger/40' : 'text-ink-dim border-line'}`}>
            <Clock size={10} /> {left != null && left < 0 ? `atrasado ${-left}d` : `${fmtShort(c.deadline)} · ${left}d`}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-ink-dim">
          {mode === 'modulos'
            ? `${c.completedModules || 0} de ${c.totalModules || 0} módulos`
            : `${c.studiedHours || 0}h de ${c.totalHours || 0}h`}
        </span>
        <span className="font-mono text-[0.72rem]">{progress}%</span>
      </div>
      <ProgressBar value={progress} />

      {hint && (
        <p className="text-[0.72rem] text-aizome mt-3 flex items-start gap-1.5">
          <GraduationCap size={13} className="mt-0.5 shrink-0" />
          <span>{hint} O Life OS já sugere isso na sua checklist.</span>
        </p>
      )}

      {c.note && <p className="text-[0.72rem] text-ink-dim mt-2">{c.note}</p>}

      {c.status === 'Em andamento' && (
        <div className="flex gap-1.5 mt-3 pt-3 border-t border-line items-center flex-wrap">
          <span className="font-mono text-[0.6rem] uppercase text-ink-dim self-center mr-1">Registrar:</span>
          {mode === 'modulos' ? (
            <>
              <button className="btn-soft py-1 px-2.5" onClick={() => logModule(1)}>+1 módulo</button>
              <button className="btn-soft py-1 px-2.5" onClick={() => logModule(-1)}>−1</button>
            </>
          ) : (
            [0.5, 1, 2].map((h) => (
              <button key={h} className="btn-soft py-1 px-2.5" onClick={() => logHours(h)}>+{h}h</button>
            ))
          )}
        </div>
      )}
    </Card>
  );
}

function CourseModal({ course, onClose, onSave }) {
  const [form, setForm] = useState({
    name: course?.name || '', platform: course?.platform || '', link: course?.link || '',
    progressMode: course?.progressMode || 'horas',
    totalHours: course?.totalHours || '', studiedHours: course?.studiedHours || 0,
    totalModules: course?.totalModules || '', completedModules: course?.completedModules || 0,
    deadline: course?.deadline || '', status: course?.status || 'Em andamento', note: course?.note || '',
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const num = (k) => (e) => setForm({ ...form, [k]: e.target.value === '' ? '' : Number(e.target.value) });
  const isModulos = form.progressMode === 'modulos';

  return (
    <Modal open onClose={onClose} title={course ? 'Editar curso' : 'Novo curso'}>
      <Field label="Nome"><Input value={form.name} onChange={set('name')} autoFocus /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Plataforma"><Input value={form.platform} onChange={set('platform')} placeholder="Udemy, Alura..." /></Field>
        <Field label="Link"><Input value={form.link} onChange={set('link')} placeholder="https://" /></Field>
      </div>

      {/* Métrica de progresso */}
      <Field label="Acompanhar progresso por">
        <div className="grid grid-cols-2 gap-1 p-0.5 border border-line rounded-sharp">
          {[['horas', 'Horas'], ['modulos', 'Módulos']].map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setForm({ ...form, progressMode: v })}
              className={`py-2 rounded-sharp font-mono text-[0.65rem] uppercase tracking-[0.06em] transition-colors ${
                form.progressMode === v ? 'bg-obsidiana text-washi' : 'text-ink-dim hover:text-obsidiana'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      {isModulos ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Total de módulos"><Input type="number" value={form.totalModules} onChange={num('totalModules')} /></Field>
          <Field label="Módulos concluídos"><Input type="number" value={form.completedModules} onChange={num('completedModules')} /></Field>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Carga horária (h)"><Input type="number" value={form.totalHours} onChange={num('totalHours')} /></Field>
          <Field label="Horas estudadas"><Input type="number" value={form.studiedHours} onChange={num('studiedHours')} /></Field>
        </div>
      )}
      <p className="text-[0.68rem] text-ink-dim -mt-1 mb-3">
        {isModulos
          ? 'A barra de progresso será calculada por módulos concluídos — ideal quando o curso não informa carga horária.'
          : 'A barra de progresso será calculada pelas horas estudadas.'}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prazo de conclusão"><Input type="date" value={form.deadline} onChange={set('deadline')} /></Field>
        <Field label="Status"><Select value={form.status} onChange={set('status')} options={STATUS} /></Field>
      </div>
      <Field label="Observações"><Textarea value={form.note} onChange={set('note')} /></Field>
      <div className="flex justify-end gap-2 mt-2">
        <button className="btn-soft" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={() => form.name.trim() && onSave(form)}>Salvar</button>
      </div>
    </Modal>
  );
}
