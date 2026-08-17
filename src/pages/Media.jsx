import { useState } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader, Card, Modal, Field, Input, Select, Textarea, StatusBadge, IconBtn, EmptyState } from '../components/ui';
import { Plus, Pencil, Trash2, Film, Star } from 'lucide-react';

const STATUS = ['Quero assistir', 'Assistindo', 'Concluído', 'Abandonado'];

export default function Media() {
  const media = useStore((s) => s.media);
  const addMedia = useStore((s) => s.addMedia);
  const updateMedia = useStore((s) => s.updateMedia);
  const deleteMedia = useStore((s) => s.deleteMedia);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? media : media.filter((m) => m.status === filter);

  return (
    <>
      <PageHeader eyebrow="Módulo 13 · Entretenimento" title="Filmes & Séries">
        <button className="btn-ghost" onClick={() => setEditing({})}>
          <Plus size={14} /> Novo título
        </button>
      </PageHeader>

      <div className="flex gap-1 flex-wrap mb-4">
        {['all', ...STATUS].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`chip ${filter === s ? 'bg-obsidiana text-washi border-obsidiana' : 'text-ink-dim border-line hover:border-obsidiana'}`}
          >
            {s === 'all' ? 'Todos' : s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Film} title="Nada por aqui" hint="Adicione filmes e séries para acompanhar o que quer assistir." /></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <Card key={m.id}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-heading font-bold text-base leading-tight">{m.title}</h3>
                <div className="flex gap-0.5 shrink-0">
                  <IconBtn icon={Pencil} label="Editar" onClick={() => setEditing(m)} />
                  <IconBtn icon={Trash2} label="Excluir" onClick={() => deleteMedia(m.id)} className="hover:text-danger" />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <StatusBadge status={m.status} />
                {m.platform && <span className="chip text-ink-dim border-line">{m.platform}</span>}
                {m.genre && <span className="chip text-ink-dim border-line">{m.genre}</span>}
              </div>
              {m.rating > 0 && (
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={13} className={n <= m.rating ? 'fill-warn text-warn' : 'text-line'} />
                  ))}
                </div>
              )}
              {m.note && <p className="text-[0.72rem] text-ink-dim mt-2">{m.note}</p>}
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <MediaModal
          item={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (editing.id) updateMedia(editing.id, data);
            else addMedia(data);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function MediaModal({ item, onClose, onSave }) {
  const [f, setF] = useState({
    title: item?.title || '', platform: item?.platform || '', genre: item?.genre || '',
    status: item?.status || 'Quero assistir', rating: item?.rating || 0, note: item?.note || '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal open onClose={onClose} title={item ? 'Editar título' : 'Novo título'}>
      <Field label="Título"><Input value={f.title} onChange={set('title')} autoFocus /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Plataforma"><Input value={f.platform} onChange={set('platform')} placeholder="Netflix, Max..." /></Field>
        <Field label="Gênero"><Input value={f.genre} onChange={set('genre')} /></Field>
      </div>
      <Field label="Status"><Select value={f.status} onChange={set('status')} options={STATUS} /></Field>
      <Field label="Avaliação">
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
