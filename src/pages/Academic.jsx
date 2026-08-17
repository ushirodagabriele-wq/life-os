import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  PageHeader, Card, Modal, Field, Input, Select, Textarea, StatusBadge,
  PriorityBadge, ProgressBar, IconBtn, EmptyState,
} from '../components/ui';
import { academicProgress } from '../store/selectors';
import { daysUntil, fmtShort, todayISO, addDays } from '../lib/date';
import {
  Plus, Pencil, Trash2, BookOpen, Clock, FileText, ExternalLink, Wand2, ChevronDown,
} from 'lucide-react';

const STATUS = ['Em andamento', 'Pausado', 'Concluído'];
const PRIORITY = [{ value: 'alta', label: 'Alta' }, { value: 'media', label: 'Média' }, { value: 'baixa', label: 'Baixa' }];
const TYPES = ['Monografia', 'Pesquisa', 'Artigo', 'Trabalho', 'Projeto'];

// Template steps for auto-splitting big projects.
const TEMPLATES = {
  Monografia: ['Definir tema', 'Pesquisar artigos', 'Elaborar metodologia', 'Escrever introdução', 'Escrever capítulo 1', 'Escrever capítulo 2', 'Revisão', 'Entrega'],
  Artigo: ['Definir tese', 'Revisão bibliográfica', 'Estrutura/outline', 'Escrever rascunho', 'Revisão', 'Submissão'],
  Pesquisa: ['Definir problema', 'Coletar dados', 'Análise', 'Escrever resultados', 'Conclusão'],
  Trabalho: ['Entender o enunciado', 'Pesquisa', 'Desenvolvimento', 'Revisão', 'Entrega'],
  Projeto: ['Escopo', 'Planejamento', 'Execução', 'Revisão', 'Entrega'],
};

export default function Academic() {
  const academic = useStore((s) => s.academic);
  const addAcademic = useStore((s) => s.addAcademic);
  const deleteAcademic = useStore((s) => s.deleteAcademic);
  const [editing, setEditing] = useState(null);

  return (
    <>
      <PageHeader eyebrow="Módulo 09 · Acadêmica" title="Central Acadêmica">
        <button className="btn-ghost" onClick={() => setEditing({})}>
          <Plus size={14} /> Novo projeto
        </button>
      </PageHeader>

      {academic.length === 0 ? (
        <Card><EmptyState icon={BookOpen} title="Nenhum projeto acadêmico" hint="Cadastre a monografia, artigos ou trabalhos — o Life OS divide em etapas automaticamente." /></Card>
      ) : (
        <div className="space-y-4">
          {academic.map((a) => (
            <ProjectCard key={a.id} project={a} onEdit={() => setEditing(a)} onDelete={() => deleteAcademic(a.id)} />
          ))}
        </div>
      )}

      {editing && (
        <ProjectModal
          project={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSave={(data, autoSteps) => {
            if (editing.id) useStore.getState().updateAcademic(editing.id, data);
            else {
              addAcademic(data);
              if (autoSteps) {
                const created = useStore.getState().academic[0];
                autoSteps.forEach((st) => useStore.getState().addStep(created.id, st));
              }
            }
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function ProjectCard({ project: a, onEdit, onDelete }) {
  const [open, setOpen] = useState(true);
  const addStep = useStore((s) => s.addStep);
  const updateStep = useStore((s) => s.updateStep);
  const deleteStep = useStore((s) => s.deleteStep);
  const addDoc = useStore((s) => s.addDoc);
  const deleteDoc = useStore((s) => s.deleteDoc);
  const [newStep, setNewStep] = useState(false);
  const [newDoc, setNewDoc] = useState(false);

  const left = daysUntil(a.deadline);
  const progress = academicProgress(a);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-bold text-lg">{a.title}</h3>
            <span className="chip text-ink-dim border-line">{a.type}</span>
            <StatusBadge status={a.status} />
            <PriorityBadge priority={a.priority} />
          </div>
          <p className="text-[0.72rem] text-ink-dim mt-1">
            {a.advisor && <>Orientador: {a.advisor} · </>}
            {a.deadline && (
              <span className={left != null && left < 0 ? 'text-danger' : ''}>
                Prazo {fmtShort(a.deadline)} {left != null && `(${left < 0 ? `atrasado ${-left}d` : `${left}d`})`}
              </span>
            )}
          </p>
          {a.note && <p className="text-sm text-ink-dim mt-1">{a.note}</p>}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <IconBtn icon={Pencil} label="Editar" onClick={onEdit} />
          <IconBtn icon={Trash2} label="Excluir" onClick={onDelete} className="hover:text-danger" />
          <IconBtn icon={ChevronDown} label="Expandir" onClick={() => setOpen(!open)} className={open ? 'rotate-180' : ''} />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <ProgressBar value={progress} />
        <span className="font-mono text-[0.72rem] text-ink-dim shrink-0">{progress}%</span>
      </div>

      {open && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* Steps */}
          <div>
            <h4 className="label mb-2">Cronograma / Etapas</h4>
            <ul className="space-y-1.5">
              {(a.steps || []).map((s) => {
                const sl = daysUntil(s.date);
                return (
                  <li key={s.id} className="group flex items-center gap-2 text-sm">
                    <button
                      onClick={() => updateStep(a.id, s.id, { done: !s.done })}
                      className={`w-4 h-4 rounded-sharp border shrink-0 ${s.done ? 'bg-success border-success' : 'border-obsidiana/40'}`}
                      aria-label="Alternar etapa"
                    />
                    <span className={`flex-1 ${s.done ? 'line-through text-ink-dim' : ''}`}>{s.title}</span>
                    {s.date && (
                      <span className={`chip ${!s.done && sl != null && sl < 0 ? 'text-danger border-danger/40' : 'text-ink-dim border-line'}`}>
                        {fmtShort(s.date)}
                      </span>
                    )}
                    <IconBtn icon={Trash2} label="Excluir etapa" onClick={() => deleteStep(a.id, s.id)} className="opacity-0 group-hover:opacity-100 hover:text-danger" />
                  </li>
                );
              })}
            </ul>
            {newStep ? (
              <StepForm onCancel={() => setNewStep(false)} onSave={(d) => { addStep(a.id, d); setNewStep(false); }} />
            ) : (
              <button className="btn-soft mt-2" onClick={() => setNewStep(true)}><Plus size={13} /> Etapa</button>
            )}
          </div>

          {/* Docs */}
          <div>
            <h4 className="label mb-2">Documentos vinculados</h4>
            {(a.docs || []).length === 0 && <p className="text-[0.72rem] text-ink-dim">Nenhum documento.</p>}
            <ul className="space-y-1.5">
              {(a.docs || []).map((d) => (
                <li key={d.id} className="group flex items-center gap-2 text-sm">
                  <FileText size={14} className="text-aizome shrink-0" />
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-aizome hover:underline truncate inline-flex items-center gap-1">
                    {d.name} <ExternalLink size={11} />
                  </a>
                  <IconBtn icon={Trash2} label="Excluir doc" onClick={() => deleteDoc(a.id, d.id)} className="opacity-0 group-hover:opacity-100 hover:text-danger" />
                </li>
              ))}
            </ul>
            {newDoc ? (
              <DocForm onCancel={() => setNewDoc(false)} onSave={(d) => { addDoc(a.id, d); setNewDoc(false); }} />
            ) : (
              <button className="btn-soft mt-2" onClick={() => setNewDoc(true)}><Plus size={13} /> Documento</button>
            )}
            <p className="text-[0.66rem] text-ink-dim mt-2">Cole o link de um Google Doc/Drive — ele fica vinculado ao projeto.</p>
          </div>
        </div>
      )}
    </Card>
  );
}

function StepForm({ onSave, onCancel }) {
  const [f, setF] = useState({ title: '', date: '' });
  return (
    <div className="flex gap-2 mt-2">
      <Input placeholder="Etapa" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} autoFocus />
      <Input type="date" className="input w-40" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
      <button className="btn-primary" onClick={() => f.title.trim() && onSave(f)}>OK</button>
      <button className="btn-soft" onClick={onCancel}>×</button>
    </div>
  );
}

function DocForm({ onSave, onCancel }) {
  const [f, setF] = useState({ name: '', url: '' });
  return (
    <div className="flex gap-2 mt-2">
      <Input placeholder="Nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus />
      <Input placeholder="URL" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
      <button className="btn-primary" onClick={() => f.name.trim() && onSave(f)}>OK</button>
      <button className="btn-soft" onClick={onCancel}>×</button>
    </div>
  );
}

function ProjectModal({ project, onClose, onSave }) {
  const [f, setF] = useState({
    title: project?.title || '', type: project?.type || 'Monografia', advisor: project?.advisor || '',
    deadline: project?.deadline || '', priority: project?.priority || 'media',
    status: project?.status || 'Em andamento', note: project?.note || '',
  });
  const [autoSplit, setAutoSplit] = useState(!project);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Build evenly-distributed steps from today to deadline.
  const buildSteps = () => {
    const template = TEMPLATES[f.type] || [];
    if (!template.length) return null;
    const start = todayISO();
    const total = f.deadline ? Math.max(daysUntil(f.deadline), template.length) : template.length * 10;
    return template.map((title, i) => ({
      title,
      date: addDays(start, Math.round(((i + 1) / template.length) * total)),
    }));
  };

  return (
    <Modal open onClose={onClose} title={project ? 'Editar projeto' : 'Novo projeto acadêmico'}>
      <Field label="Título"><Input value={f.title} onChange={set('title')} autoFocus placeholder="Monografia — NDB e o BRICS" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo"><Select value={f.type} onChange={set('type')} options={TYPES} /></Field>
        <Field label="Orientador"><Input value={f.advisor} onChange={set('advisor')} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Prazo"><Input type="date" value={f.deadline} onChange={set('deadline')} /></Field>
        <Field label="Prioridade"><Select value={f.priority} onChange={set('priority')} options={PRIORITY} /></Field>
        <Field label="Status"><Select value={f.status} onChange={set('status')} options={STATUS} /></Field>
      </div>
      <Field label="Observações"><Textarea value={f.note} onChange={set('note')} /></Field>

      {!project && (
        <label className="flex items-start gap-2 p-3 border border-horizonte/40 bg-horizonte-soft rounded-sharp cursor-pointer">
          <input type="checkbox" checked={autoSplit} onChange={(e) => setAutoSplit(e.target.checked)} className="mt-0.5" />
          <span className="text-sm">
            <span className="flex items-center gap-1.5 font-medium"><Wand2 size={14} className="text-horizonte" /> Dividir automaticamente em etapas</span>
            <span className="text-[0.72rem] text-ink-dim">Gera as etapas de "{f.type}" distribuídas até o prazo, já alimentando o calendário e as sugestões.</span>
          </span>
        </label>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <button className="btn-soft" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={() => f.title.trim() && onSave(f, autoSplit ? buildSteps() : null)}>Salvar</button>
      </div>
    </Modal>
  );
}
