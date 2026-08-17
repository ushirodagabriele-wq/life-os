import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  PageHeader, Card, Modal, Field, Input, Select, Textarea, ProgressBar,
  StatusBadge, IconBtn, EmptyState,
} from '../components/ui';
import { bookProgress } from '../store/selectors';
import { Plus, Pencil, Trash2, Library, Star, BookMarked } from 'lucide-react';
import BiblePlan from '../components/BiblePlan';

const STATUS = ['Quero ler', 'Lendo', 'Concluído', 'Abandonado'];

export default function LibraryPage() {
  const books = useStore((s) => s.books);
  const addBook = useStore((s) => s.addBook);
  const updateBook = useStore((s) => s.updateBook);
  const deleteBook = useStore((s) => s.deleteBook);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('estante');

  const reading = books.filter((b) => b.status === 'Lendo');
  const doneThisYear = books.filter((b) => b.status === 'Concluído').length;

  return (
    <>
      <PageHeader eyebrow="Módulo 10 · Biblioteca" title="Biblioteca">
        {tab === 'estante' && (
          <button className="btn-ghost" onClick={() => setEditing({})}>
            <Plus size={14} /> Novo livro
          </button>
        )}
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 border border-line rounded-sharp p-0.5 mb-5 w-fit">
        {[['estante', 'Estante', Library], ['plano', 'Plano de Leitura Bíblica', BookMarked]].map(([k, label, Icon]) => (
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

      {tab === 'plano' && <BiblePlan />}

      {tab === 'estante' && (
      <>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-3"><Stat label="Lendo agora" value={reading.length} /></Card>
        <Card className="p-3"><Stat label="Concluídos" value={doneThisYear} /></Card>
        <Card className="p-3"><Stat label="Na estante" value={books.length} /></Card>
      </div>

      {books.length === 0 ? (
        <Card><EmptyState icon={Library} title="Estante vazia" hint="Adicione livros para acompanhar seu progresso de leitura." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => (
            <BookCard
              key={b.id}
              book={b}
              onEdit={() => setEditing(b)}
              onDelete={() => deleteBook(b.id)}
              onLog={(p) => updateBook(b.id, { pagesRead: Math.min(Math.max((b.pagesRead || 0) + p, 0), b.pages), status: (b.pagesRead || 0) + p >= b.pages ? 'Concluído' : 'Lendo' })}
            />
          ))}
        </div>
      )}
      </>
      )}

      {editing && (
        <BookModal
          book={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (editing.id) updateBook(editing.id, data);
            else addBook(data);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function Stat({ label, value }) {
  return (
    <>
      <div className="font-heading font-bold text-2xl leading-none">{value}</div>
      <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-dim">{label}</span>
    </>
  );
}

function BookCard({ book: b, onEdit, onDelete, onLog }) {
  const progress = bookProgress(b);
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <h3 className="font-heading font-bold text-base leading-tight">{b.title}</h3>
          <p className="text-[0.72rem] text-ink-dim">{b.author}</p>
        </div>
        <div className="flex gap-0.5 shrink-0">
          <IconBtn icon={Pencil} label="Editar" onClick={onEdit} />
          <IconBtn icon={Trash2} label="Excluir" onClick={onDelete} className="hover:text-danger" />
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <StatusBadge status={b.status} />
        {b.category && <span className="chip text-ink-dim border-line">{b.category}</span>}
      </div>
      {b.rating > 0 && (
        <div className="flex gap-0.5 mb-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={13} className={n <= b.rating ? 'fill-warn text-warn' : 'text-line'} />
          ))}
        </div>
      )}
      <div className="mt-auto">
        <div className="flex justify-between text-[0.72rem] text-ink-dim mb-1">
          <span>{b.pagesRead || 0} / {b.pages || 0} págs</span>
          <span className="font-mono">{progress}%</span>
        </div>
        <ProgressBar value={progress} color="horizonte" />
        {b.status !== 'Concluído' && (
          <div className="flex gap-1.5 mt-2">
            {[10, 25, 50].map((p) => (
              <button key={p} className="btn-soft py-1 px-2" onClick={() => onLog(p)}>+{p}p</button>
            ))}
          </div>
        )}
      </div>
      {b.note && <p className="text-[0.72rem] text-ink-dim mt-2">{b.note}</p>}
    </Card>
  );
}

function BookModal({ book, onClose, onSave }) {
  const [f, setF] = useState({
    title: book?.title || '', author: book?.author || '', category: book?.category || '',
    pages: book?.pages || '', pagesRead: book?.pagesRead || 0, status: book?.status || 'Quero ler',
    rating: book?.rating || 0, note: book?.note || '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const num = (k) => (e) => setF({ ...f, [k]: e.target.value === '' ? '' : Number(e.target.value) });
  return (
    <Modal open onClose={onClose} title={book ? 'Editar livro' : 'Novo livro'}>
      <Field label="Título"><Input value={f.title} onChange={set('title')} autoFocus /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Autor"><Input value={f.author} onChange={set('author')} /></Field>
        <Field label="Categoria"><Input value={f.category} onChange={set('category')} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Páginas"><Input type="number" value={f.pages} onChange={num('pages')} /></Field>
        <Field label="Lidas"><Input type="number" value={f.pagesRead} onChange={num('pagesRead')} /></Field>
        <Field label="Status"><Select value={f.status} onChange={set('status')} options={STATUS} /></Field>
      </div>
      <Field label="Avaliação (0-5)">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setF({ ...f, rating: n === f.rating ? 0 : n })}>
              <Star size={22} className={n <= f.rating ? 'fill-warn text-warn' : 'text-line hover:text-warn'} />
            </button>
          ))}
        </div>
      </Field>
      <Field label="Observações"><Textarea value={f.note} onChange={set('note')} /></Field>
      <div className="flex justify-end gap-2 mt-2">
        <button className="btn-soft" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={() => f.title.trim() && onSave(f)}>Salvar</button>
      </div>
    </Modal>
  );
}
