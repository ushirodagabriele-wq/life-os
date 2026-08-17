import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader, Card, Modal, Field, Input, Textarea, IconBtn, EmptyState } from '../components/ui';
import { fmtShort } from '../lib/date';
import { Plus, Pencil, Trash2, Search, NotebookPen, ExternalLink, FolderOpen, HardDrive } from 'lucide-react';
import DriveStudies from '../components/DriveStudies';

export default function FreeStudies() {
  const notes = useStore((s) => s.notes);
  const addNote = useStore((s) => s.addNote);
  const updateNote = useStore((s) => s.updateNote);
  const deleteNote = useStore((s) => s.deleteNote);
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('all');
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('drive');

  const subjects = useMemo(() => ['all', ...new Set(notes.map((n) => n.subject).filter(Boolean))], [notes]);
  const filtered = notes.filter((n) => {
    const matchSubject = subject === 'all' || n.subject === subject;
    const q = query.toLowerCase();
    const matchQuery = !q || n.title.toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q) || (n.subject || '').toLowerCase().includes(q);
    return matchSubject && matchQuery;
  });

  return (
    <>
      <PageHeader eyebrow="Módulo 12 · Estudos livres" title="Estudos Livres">
        {tab === 'local' && (
          <button className="btn-ghost" onClick={() => setEditing({})}>
            <Plus size={14} /> Nova nota
          </button>
        )}
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 border border-line rounded-sharp p-0.5 mb-5 w-fit">
        {[['drive', 'Google Drive', HardDrive], ['local', 'Notas locais', NotebookPen]].map(([k, label, Icon]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.06em] rounded-sharp transition-colors ${
              tab === k ? 'bg-obsidiana text-washi' : 'text-ink-dim hover:text-obsidiana'
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {tab === 'drive' && <DriveStudies />}

      {tab === 'local' && (
      <>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
          <input
            className="input pl-9"
            placeholder="Pesquisar nas anotações..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className={`chip ${subject === s ? 'bg-obsidiana text-washi border-obsidiana' : 'text-ink-dim border-line hover:border-obsidiana'}`}
            >
              {s === 'all' ? 'Todos' : s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={NotebookPen} title="Nenhuma nota encontrada" hint="Crie notas, organize por assunto e vincule documentos do Drive." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n) => (
            <Card key={n.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0">
                  {n.subject && <span className="chip text-horizonte border-horizonte/40 bg-horizonte-soft mb-1">{n.subject}</span>}
                  <h3 className="font-heading font-bold text-base leading-tight">{n.title}</h3>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <IconBtn icon={Pencil} label="Editar" onClick={() => setEditing(n)} />
                  <IconBtn icon={Trash2} label="Excluir" onClick={() => deleteNote(n.id)} className="hover:text-danger" />
                </div>
              </div>
              <p className="text-sm text-ink-dim whitespace-pre-wrap line-clamp-5 flex-1">{n.body}</p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-line">
                <span className="text-[0.66rem] text-ink-dim font-mono">{fmtShort(n.updatedAt)}</span>
                {n.driveLink && (
                  <a href={n.driveLink} target="_blank" rel="noopener noreferrer" className="text-[0.66rem] text-aizome inline-flex items-center gap-1 hover:underline">
                    <FolderOpen size={11} /> Drive <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      </>
      )}

      {editing && (
        <NoteModal
          note={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (editing.id) updateNote(editing.id, data);
            else addNote(data);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function NoteModal({ note, onClose, onSave }) {
  const [f, setF] = useState({
    title: note?.title || '', subject: note?.subject || '', body: note?.body || '', driveLink: note?.driveLink || '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal open onClose={onClose} wide title={note ? 'Editar nota' : 'Nova nota'}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Título"><Input value={f.title} onChange={set('title')} autoFocus /></Field>
        <Field label="Assunto"><Input value={f.subject} onChange={set('subject')} placeholder="Finanças, EPI..." /></Field>
      </div>
      <Field label="Conteúdo"><Textarea value={f.body} onChange={set('body')} className="input min-h-[200px] resize-y" /></Field>
      <Field label="Link do Google Drive/Docs (opcional)"><Input value={f.driveLink} onChange={set('driveLink')} placeholder="https://drive.google.com/..." /></Field>
      <div className="flex justify-end gap-2 mt-2">
        <button className="btn-soft" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={() => f.title.trim() && onSave(f)}>Salvar</button>
      </div>
    </Modal>
  );
}
