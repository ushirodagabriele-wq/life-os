import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  PageHeader, Card, Modal, Field, Input, Select, Textarea, StatusBadge,
  ProgressBar, IconBtn, EmptyState,
} from '../components/ui';
import { processProgress } from '../store/selectors';
import { daysUntil, fmtShort } from '../lib/date';
import {
  Plus, Pencil, Trash2, ExternalLink, Briefcase, Clock, Phone, Mail,
  Linkedin, MessageCircle, ChevronRight, Building2, Users, ListChecks, MapPin, Video,
  ClipboardList, FileText, MessageSquare, Check, Milestone,
} from 'lucide-react';

const STATUS = ['Interesse', 'Inscrito', 'Em processo', 'Aprovado', 'Descartado'];
const STAGE_STATUS = ['Pendente', 'Em andamento', 'Concluída', 'Reagendada', 'Cancelada'];

// Detect whether a location string is a URL (meeting link) vs a physical address.
function isLink(str) {
  return /^(https?:\/\/|www\.)/i.test((str || '').trim());
}

export default function Processes() {
  const processes = useStore((s) => s.processes);
  const addProcess = useStore((s) => s.addProcess);
  const deleteProcess = useStore((s) => s.deleteProcess);
  const [detail, setDetail] = useState(null);
  const [adding, setAdding] = useState(false);

  const nextStageOf = (p) =>
    (p.stages || [])
      .filter((s) => s.status !== 'Concluída' && daysUntil(s.date) != null && daysUntil(s.date) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <>
      <PageHeader eyebrow="Módulo 08 · Carreira" title="Processos Seletivos">
        <button className="btn-ghost" onClick={() => setAdding(true)}>
          <Plus size={14} /> Nova empresa
        </button>
      </PageHeader>

      {/* Overview table */}
      {processes.length === 0 ? (
        <Card><EmptyState icon={Briefcase} title="Nenhum processo cadastrado" hint="Adicione uma empresa para acompanhar etapas, contatos e prazos." /></Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[0.6rem] uppercase tracking-wider text-ink-dim">
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3 hidden md:table-cell">Programa / Área</th>
                  <th className="px-4 py-3">Próxima etapa</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Inscrição</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {processes.map((p) => {
                  const next = nextStageOf(p);
                  const left = next ? daysUntil(next.date) : null;
                  const applyLeft = daysUntil(p.deadline);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-line/60 last:border-0 hover:bg-washi-soft cursor-pointer"
                      onClick={() => setDetail(p.id)}
                    >
                      <td className="px-4 py-3 font-medium">{p.company}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-ink-dim">
                        {p.program}{p.area ? ` · ${p.area}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        {next ? (
                          <span className="flex items-center gap-1.5">
                            {next.title}
                            <span className={`chip ${left <= 2 ? 'text-danger border-danger/40' : 'text-ink-dim border-line'}`}>
                              {left === 0 ? 'hoje' : `${left}d`}
                            </span>
                          </span>
                        ) : <span className="text-ink-dim">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-ink-dim">
                        {p.deadline ? (
                          <span className={applyLeft != null && applyLeft <= 3 && applyLeft >= 0 ? 'text-danger' : ''}>
                            {fmtShort(p.deadline)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight size={16} className="text-ink-dim inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {detail && (
        <ProcessDetail
          id={detail}
          onClose={() => setDetail(null)}
          onDelete={() => { deleteProcess(detail); setDetail(null); }}
        />
      )}
      {adding && (
        <ProcessFormModal
          onClose={() => setAdding(false)}
          onSave={(data) => { addProcess(data); setAdding(false); }}
        />
      )}
    </>
  );
}

function ProcessDetail({ id, onClose, onDelete }) {
  const p = useStore((s) => s.processes.find((x) => x.id === id));
  const updateProcess = useStore((s) => s.updateProcess);
  const addStage = useStore((s) => s.addStage);
  const updateStage = useStore((s) => s.updateStage);
  const deleteStage = useStore((s) => s.deleteStage);
  const addContact = useStore((s) => s.addContact);
  const deleteContact = useStore((s) => s.deleteContact);
  const [tab, setTab] = useState('info');
  const [editing, setEditing] = useState(false);
  const [newStage, setNewStage] = useState(false);
  const [editStageId, setEditStageId] = useState(null);
  const [newContact, setNewContact] = useState(false);

  if (!p) return null;
  const TABS = [
    { key: 'info', label: 'Informações', icon: Building2 },
    { key: 'contacts', label: 'Contatos', icon: Users },
    { key: 'stages', label: 'Acompanhamento', icon: ClipboardList },
  ];

  return (
    <Modal open onClose={onClose} wide title={p.company}>
      <div className="flex items-center justify-between mb-4 -mt-1">
        <div className="flex items-center gap-3">
          <StatusBadge status={p.status} />
          <span className="text-sm text-ink-dim">{processProgress(p)}% concluído</span>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn icon={Pencil} label="Editar" onClick={() => setEditing(true)} />
          <IconBtn icon={Trash2} label="Excluir processo" onClick={onDelete} className="hover:text-danger" />
        </div>
      </div>
      <ProgressBar value={processProgress(p)} color="horizonte" className="mb-4" />

      <div className="flex gap-1 border-b border-line mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 font-mono text-[0.65rem] uppercase tracking-[0.06em] border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'border-aizome text-aizome' : 'border-transparent text-ink-dim hover:text-obsidiana'
            }`}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="space-y-3 text-sm">
          <Info label="Programa" value={p.program} />
          <Info label="Área" value={p.area} />
          <Info label="Descrição" value={p.description} />
          {p.applyLink && (
            <div>
              <span className="label">Inscrição</span>
              <a href={p.applyLink} target="_blank" rel="noopener noreferrer" className="text-aizome inline-flex items-center gap-1 hover:underline">
                {p.applyLink} <ExternalLink size={13} />
              </a>
            </div>
          )}
          {(p.links || []).length > 0 && (
            <div>
              <span className="label">Links importantes</span>
              <ul className="space-y-1">
                {p.links.map((l, i) => (
                  <li key={i}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-aizome inline-flex items-center gap-1 hover:underline">
                      {l.label || l.url} <ExternalLink size={12} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'contacts' && (
        <div>
          {(p.contacts || []).length === 0 && <p className="text-sm text-ink-dim py-2">Nenhum contato cadastrado.</p>}
          <ul className="space-y-2">
            {(p.contacts || []).map((c) => (
              <li key={c.id} className="border border-line rounded-sharp p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    {c.role && <p className="text-[0.72rem] text-ink-dim">{c.role}</p>}
                  </div>
                  <IconBtn icon={Trash2} label="Excluir contato" onClick={() => deleteContact(p.id, c.id)} className="hover:text-danger" />
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-[0.72rem]">
                  {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-aizome hover:underline"><Mail size={12} />{c.email}</a>}
                  {c.phone && <span className="flex items-center gap-1 text-ink-dim"><Phone size={12} />{c.phone}</span>}
                  {c.whatsapp && <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-success hover:underline"><MessageCircle size={12} />WhatsApp</a>}
                  {c.linkedin && <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-aizome hover:underline"><Linkedin size={12} />LinkedIn</a>}
                </div>
              </li>
            ))}
          </ul>
          {newContact ? (
            <ContactForm onCancel={() => setNewContact(false)} onSave={(data) => { addContact(p.id, data); setNewContact(false); }} />
          ) : (
            <button className="btn-soft mt-3" onClick={() => setNewContact(true)}><Plus size={13} /> Contato</button>
          )}
        </div>
      )}

      {tab === 'stages' && (() => {
        const sorted = (p.stages || []).slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        const current = sorted.find((s) => !['Concluída', 'Cancelada'].includes(s.status));
        const doneN = sorted.filter((s) => s.status === 'Concluída').length;
        const activeN = sorted.filter((s) => s.status !== 'Cancelada').length;
        return (
          <div>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div>
                <span className="label flex items-center gap-1"><Milestone size={11} /> Fase atual</span>
                <p className="font-heading font-bold text-sm mt-0.5">
                  {current ? current.title : sorted.length ? 'Todas as etapas concluídas 🎉' : 'Nenhuma etapa ainda'}
                </p>
              </div>
              {activeN > 0 && <span className="chip text-ink-dim border-line">{doneN}/{activeN} concluídas</span>}
            </div>

            <ul className="space-y-2">
              {sorted.map((s) =>
                editStageId === s.id ? (
                  <li key={s.id}>
                    <StageForm
                      stage={s}
                      onCancel={() => setEditStageId(null)}
                      onSave={(data) => { updateStage(p.id, s.id, data); setEditStageId(null); }}
                    />
                  </li>
                ) : (
                  <li key={s.id}>
                    <StageCard
                      s={s}
                      onToggle={() => updateStage(p.id, s.id, { status: s.status === 'Concluída' ? 'Pendente' : 'Concluída' })}
                      onEdit={() => { setNewStage(false); setEditStageId(s.id); }}
                      onDelete={() => deleteStage(p.id, s.id)}
                    />
                  </li>
                )
              )}
            </ul>

            {newStage ? (
              <StageForm onCancel={() => setNewStage(false)} onSave={(data) => { addStage(p.id, data); setNewStage(false); }} />
            ) : (
              <button className="btn-soft mt-3" onClick={() => setNewStage(true)}><Plus size={13} /> Etapa</button>
            )}
            <p className="text-[0.68rem] text-ink-dim mt-3">
              As etapas alimentam o calendário automaticamente e geram lembretes/sugestões quando a data se aproxima.
            </p>
          </div>
        );
      })()}

      {editing && (
        <ProcessFormModal
          process={p}
          onClose={() => setEditing(false)}
          onSave={(data) => { updateProcess(p.id, data); setEditing(false); }}
        />
      )}
    </Modal>
  );
}

function Info({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <span className="label">{label}</span>
      <p className="text-obsidiana">{value}</p>
    </div>
  );
}

function StageCard({ s, onToggle, onEdit, onDelete }) {
  const left = daysUntil(s.date);
  const meetLink = s.meetingLink || (isLink(s.location) ? s.location : '');
  const addr = s.address || (s.location && !isLink(s.location) ? s.location : '');
  const done = s.status === 'Concluída';
  const cancelled = s.status === 'Cancelada';
  const upcoming = !['Concluída', 'Cancelada'].includes(s.status) && left != null && left >= 0;

  return (
    <div className={`border rounded-sharp p-3 ${cancelled ? 'border-line opacity-60' : 'border-line'}`}>
      <div className="flex items-start gap-2.5">
        <button
          onClick={onToggle}
          aria-label="Alternar conclusão"
          className={`mt-0.5 w-4 h-4 rounded-sharp border shrink-0 flex items-center justify-center transition-colors ${
            done ? 'bg-success border-success text-washi' : 'border-obsidiana/40 hover:border-success'
          }`}
        >
          {done && <Check size={11} strokeWidth={3} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-sm font-medium ${done || cancelled ? 'line-through text-ink-dim' : ''}`}>{s.title}</span>
            <StatusBadge status={s.status} />
            {upcoming && (
              <span className={`chip ${left <= 2 ? 'text-danger border-danger/40 bg-danger/5' : 'text-ink-dim border-line'}`}>
                <Clock size={10} /> {left === 0 ? 'hoje' : `em ${left}d`}
              </span>
            )}
          </div>
          <p className="text-[0.7rem] text-ink-dim mt-0.5">
            {s.date ? fmtShort(s.date) : 'sem data'}
            {s.time ? ` · ${s.time}${s.endTime ? `–${s.endTime}` : ''}` : ''}
          </p>

          {meetLink && (
            <a href={meetLink.startsWith('http') ? meetLink : `https://${meetLink}`} target="_blank" rel="noopener noreferrer"
              className="text-[0.72rem] mt-1 inline-flex items-center gap-1 text-aizome hover:underline">
              <Video size={11} /> Entrar na reunião
            </a>
          )}
          {addr && (
            <p className="text-[0.72rem] mt-1 flex items-center gap-1 text-ink-dim"><MapPin size={11} className="shrink-0" /> {addr}</p>
          )}

          {s.prep && (
            <div className="mt-2">
              <span className="label flex items-center gap-1 mb-0.5"><FileText size={10} /> Preparação / materiais</span>
              <p className="text-[0.72rem] text-ink-dim whitespace-pre-wrap">{s.prep}</p>
            </div>
          )}
          {s.feedback && (
            <div className="mt-2 border-l-2 border-aizome/40 pl-2">
              <span className="label flex items-center gap-1 mb-0.5"><MessageSquare size={10} /> Feedback / pós-etapa</span>
              <p className="text-[0.72rem] text-obsidiana/90 whitespace-pre-wrap">{s.feedback}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <IconBtn icon={Pencil} label="Editar etapa" onClick={onEdit} />
          <IconBtn icon={Trash2} label="Excluir etapa" onClick={onDelete} className="hover:text-danger" />
        </div>
      </div>
    </div>
  );
}

function StageForm({ stage, onSave, onCancel }) {
  const [f, setF] = useState({
    title: stage?.title || '', date: stage?.date || '', time: stage?.time || '', endTime: stage?.endTime || '',
    status: stage?.status || 'Pendente',
    locationType: stage?.locationType || (isLink(stage?.location) ? 'online' : stage?.location ? 'presencial' : 'online'),
    meetingLink: stage?.meetingLink || (isLink(stage?.location) ? stage.location : ''),
    address: stage?.address || (stage?.location && !isLink(stage?.location) ? stage.location : ''),
    prep: stage?.prep || stage?.note || '',
    feedback: stage?.feedback || '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const online = f.locationType === 'online';

  return (
    <div className="border border-aizome/40 rounded-sharp p-3 mt-3 bg-aizome-soft">
      <div className="grid grid-cols-2 gap-2">
        <div><span className="label">Nome da etapa</span><Input placeholder="Inscrição, teste, case, entrevista..." value={f.title} onChange={set('title')} autoFocus /></div>
        <div><span className="label">Status</span><Select value={f.status} onChange={set('status')} options={STAGE_STATUS} /></div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div><span className="label">Data</span><Input type="date" value={f.date} onChange={set('date')} /></div>
        <div><span className="label">Início</span><Input type="time" value={f.time} onChange={set('time')} /></div>
        <div><span className="label">Término</span><Input type="time" value={f.endTime} onChange={set('endTime')} /></div>
      </div>

      <div className="mt-2">
        <span className="label">Local</span>
        <div className="grid grid-cols-2 gap-1 p-0.5 border border-line rounded-sharp mb-2 bg-washi">
          {[['online', 'Online'], ['presencial', 'Presencial']].map(([v, label]) => (
            <button key={v} type="button" onClick={() => setF({ ...f, locationType: v })}
              className={`py-1.5 rounded-sharp font-mono text-[0.62rem] uppercase tracking-[0.06em] transition-colors ${
                f.locationType === v ? 'bg-obsidiana text-washi' : 'text-ink-dim hover:text-obsidiana'
              }`}>{label}</button>
          ))}
        </div>
        {online ? (
          <Input placeholder="Link da reunião (Meet, Teams, Zoom...)" value={f.meetingLink} onChange={set('meetingLink')} />
        ) : (
          <Input placeholder="Endereço (rua, número, cidade)" value={f.address} onChange={set('address')} />
        )}
      </div>

      <div className="mt-2">
        <span className="label">Observações e materiais de preparação</span>
        <Textarea value={f.prep} onChange={set('prep')} placeholder="O que estudar, o que levar, links de material..." />
      </div>
      <div className="mt-2">
        <span className="label">Feedback / anotações após a etapa</span>
        <Textarea value={f.feedback} onChange={set('feedback')} placeholder="Como foi, o que perguntaram, próximos passos..." />
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button className="btn-soft" onClick={onCancel}>Cancelar</button>
        <button className="btn-primary" onClick={() => f.title.trim() && onSave(f)}>{stage ? 'Salvar' : 'Adicionar'}</button>
      </div>
    </div>
  );
}

function ContactForm({ onSave, onCancel }) {
  const [f, setF] = useState({ name: '', role: '', email: '', phone: '', whatsapp: '', linkedin: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="border border-aizome/40 rounded-sharp p-3 mt-3 bg-aizome-soft">
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Nome" value={f.name} onChange={set('name')} autoFocus />
        <Input placeholder="Cargo" value={f.role} onChange={set('role')} />
        <Input placeholder="E-mail" value={f.email} onChange={set('email')} />
        <Input placeholder="Telefone" value={f.phone} onChange={set('phone')} />
        <Input placeholder="WhatsApp" value={f.whatsapp} onChange={set('whatsapp')} />
        <Input placeholder="LinkedIn (URL)" value={f.linkedin} onChange={set('linkedin')} />
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button className="btn-soft" onClick={onCancel}>Cancelar</button>
        <button className="btn-primary" onClick={() => f.name.trim() && onSave(f)}>Adicionar</button>
      </div>
    </div>
  );
}

function ProcessFormModal({ process, onClose, onSave }) {
  const [f, setF] = useState({
    company: process?.company || '', program: process?.program || '', area: process?.area || '',
    description: process?.description || '', applyLink: process?.applyLink || '',
    deadline: process?.deadline || '', status: process?.status || 'Interesse',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal open onClose={onClose} title={process ? 'Editar empresa' : 'Nova empresa'}>
      <Field label="Empresa"><Input value={f.company} onChange={set('company')} autoFocus /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Programa"><Input value={f.program} onChange={set('program')} /></Field>
        <Field label="Área"><Input value={f.area} onChange={set('area')} /></Field>
      </div>
      <Field label="Descrição"><Textarea value={f.description} onChange={set('description')} /></Field>
      <Field label="Link da inscrição"><Input value={f.applyLink} onChange={set('applyLink')} placeholder="https://" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prazo de inscrição"><Input type="date" value={f.deadline} onChange={set('deadline')} /></Field>
        <Field label="Status"><Select value={f.status} onChange={set('status')} options={STATUS} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button className="btn-soft" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={() => f.company.trim() && onSave(f)}>Salvar</button>
      </div>
    </Modal>
  );
}
