import { useState, useEffect } from 'react';
import { Card, EmptyState, IconBtn } from './ui';
import { connect, getToken, isConnected, isRemembered, disconnect, SCOPE_DRIVE } from '../lib/google';
import { listDocs, createDoc, renameDoc, trashDoc, docEditUrl, docEmbedUrl, STUDIES_FOLDER } from '../lib/drive';
import { fmtShort } from '../lib/date';
import {
  FolderOpen, FileText, Plus, RefreshCw, ArrowLeft, ExternalLink, Pencil, Trash2,
  Search, AlertTriangle, X, HardDriveDownload, Check,
} from 'lucide-react';

export default function DriveStudies() {
  const [connected, setConnected] = useState(isConnected(SCOPE_DRIVE));
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [openDoc, setOpenDoc] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const load = async (interactive = false) => {
    setError(''); setBusy(true);
    try {
      const token = interactive ? await connect(SCOPE_DRIVE) : await getToken(SCOPE_DRIVE);
      setDocs(await listDocs(token));
      setConnected(true);
    } catch (e) {
      setError(traduz(e.message));
    } finally {
      setBusy(false);
    }
  };

  // Auto-load on mount when the Drive scope was granted before — silently
  // reconnects, no "Conectar" click needed on return visits.
  useEffect(() => {
    if (connected || isRemembered(SCOPE_DRIVE)) load(false);
    /* eslint-disable-next-line */
  }, []);

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true); setError('');
    try {
      const token = await getToken(SCOPE_DRIVE);
      const doc = await createDoc(token, name);
      setNewName(''); setCreating(false);
      await load(false);
      setOpenDoc(doc); // open the new doc for editing right away
    } catch (e) { setError(traduz(e.message)); } finally { setBusy(false); }
  };

  const doRename = async (id) => {
    const name = renameValue.trim();
    if (!name) { setRenameId(null); return; }
    setBusy(true);
    try {
      const token = await getToken(SCOPE_DRIVE);
      await renameDoc(token, id, name);
      setRenameId(null);
      await load(false);
    } catch (e) { setError(traduz(e.message)); } finally { setBusy(false); }
  };

  const doTrash = async (doc) => {
    if (!window.confirm(`Mover "${doc.name}" para a lixeira do Drive?`)) return;
    setBusy(true);
    try {
      const token = await getToken(SCOPE_DRIVE);
      await trashDoc(token, doc.id);
      await load(false);
    } catch (e) { setError(traduz(e.message)); } finally { setBusy(false); }
  };

  const disc = () => { disconnect(SCOPE_DRIVE); setConnected(false); setDocs([]); setOpenDoc(null); };

  // ---- Not connected ----
  if (!connected) {
    return (
      <Card className="border-aizome/30 bg-aizome-soft/30">
        <div className="flex items-start gap-3">
          <FolderOpen size={18} className="text-horizonte shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="font-heading font-bold text-base">Estudos no Google Drive</h2>
            <p className="text-[0.78rem] text-ink-dim mt-0.5 mb-2">
              Conecte o Drive para que cada estudo vire um <b>Google Docs</b> salvo na sua pasta “{STUDIES_FOLDER.name}”, com edição e salvamento automáticos.
            </p>
            <button className="btn-primary" onClick={() => load(true)} disabled={busy}>
              <HardDriveDownload size={14} /> {busy ? 'Conectando…' : 'Conectar Google Drive'}
            </button>
            {error && <p className="text-[0.7rem] text-danger mt-2 flex items-center gap-1"><AlertTriangle size={11} /> {error}</p>}
            <p className="text-[0.66rem] text-ink-dim mt-2">
              ⚠️ O Drive é uma permissão “restrita” do Google — o aviso de “app não verificado” é mais forte. É seguro (é o seu app): “Configurações avançadas” → “Acessar life-os”.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // ---- Open doc (embedded editor) ----
  if (openDoc) {
    return (
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => { setOpenDoc(null); load(false); }} className="btn-soft py-1.5 px-2.5"><ArrowLeft size={13} /> Voltar</button>
            <FileText size={15} className="text-aizome shrink-0" />
            <span className="font-heading font-bold text-sm truncate">{openDoc.name}</span>
          </div>
          <a href={docEditUrl(openDoc.id)} target="_blank" rel="noopener noreferrer" className="btn-soft py-1.5 px-2.5 shrink-0">
            <ExternalLink size={13} /> Abrir no Docs
          </a>
        </div>
        <iframe
          key={openDoc.id}
          title={openDoc.name}
          src={docEmbedUrl(openDoc.id)}
          className="w-full bg-washi"
          style={{ height: '72vh', border: 'none' }}
        />
        <div className="border-t border-line px-4 py-2.5">
          <p className="text-[0.68rem] text-ink-dim">
            Edição ao vivo no Google Docs — tudo é salvo automaticamente no Drive. Se a edição não carregar aqui, use “Abrir no Docs”.
          </p>
        </div>
      </Card>
    );
  }

  // ---- List ----
  const shown = docs.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="chip text-success border-success/40 bg-success/5"><Check size={11} /> Drive conectado</span>
          <a href={STUDIES_FOLDER.url} target="_blank" rel="noopener noreferrer" className="text-[0.68rem] font-mono uppercase tracking-[0.06em] text-aizome hover:underline inline-flex items-center gap-1">
            {STUDIES_FOLDER.name} <ExternalLink size={11} />
          </a>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="btn-ghost" onClick={() => { setCreating(true); setNewName(''); }}><Plus size={14} /> Novo estudo</button>
          <button className="btn-soft py-1.5 px-2.5" onClick={() => load(false)} disabled={busy} title="Sincronizar"><RefreshCw size={13} className={busy ? 'animate-spin' : ''} /></button>
          <button className="p-1.5 text-ink-dim hover:text-danger" onClick={disc} title="Desconectar"><X size={14} /></button>
        </div>
      </div>

      {creating && (
        <Card className="mb-4 border-aizome/40 bg-aizome-soft">
          <span className="label mb-1">Nome do novo estudo</span>
          <div className="flex gap-2">
            <input className="input" value={newName} autoFocus placeholder="Ex.: Governança do NDB"
              onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} />
            <button className="btn-primary shrink-0" onClick={create} disabled={busy || !newName.trim()}>Criar Doc</button>
            <button className="btn-soft shrink-0" onClick={() => setCreating(false)}>Cancelar</button>
          </div>
          <p className="text-[0.66rem] text-ink-dim mt-1.5">Um Google Docs será criado na pasta e aberto para você editar.</p>
        </Card>
      )}

      {error && <p className="text-[0.75rem] text-danger mb-3 flex items-center gap-1"><AlertTriangle size={12} /> {error}</p>}

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
        <input className="input pl-9" placeholder="Pesquisar estudos..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {shown.length === 0 ? (
        <Card><EmptyState icon={FileText} title={docs.length === 0 ? 'Nenhum estudo ainda' : 'Nada encontrado'} hint={docs.length === 0 ? 'Crie seu primeiro estudo — ele vira um Google Docs na pasta.' : 'Tente outro termo.'} /></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((d) => (
            <Card key={d.id} className="flex flex-col">
              {renameId === d.id ? (
                <div className="flex gap-1.5">
                  <input className="input py-1.5" value={renameValue} autoFocus
                    onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doRename(d.id)} />
                  <button className="btn-primary py-1.5 px-2" onClick={() => doRename(d.id)}>OK</button>
                </div>
              ) : (
                <>
                  <button onClick={() => setOpenDoc(d)} className="text-left flex-1">
                    <div className="flex items-start gap-2">
                      <FileText size={18} className="text-aizome shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <h3 className="font-heading font-bold text-sm leading-tight">{d.name}</h3>
                        <p className="text-[0.66rem] text-ink-dim font-mono mt-1">editado {fmtShort((d.modifiedTime || '').slice(0, 10))}</p>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-0.5 justify-end mt-2 pt-2 border-t border-line/60">
                    <a href={docEditUrl(d.id)} target="_blank" rel="noopener noreferrer" className="p-1.5 text-ink-dim hover:text-aizome" title="Abrir no Docs"><ExternalLink size={14} /></a>
                    <IconBtn icon={Pencil} label="Renomear" onClick={() => { setRenameId(d.id); setRenameValue(d.name); }} />
                    <IconBtn icon={Trash2} label="Excluir" onClick={() => doTrash(d)} className="hover:text-danger" />
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      <p className="text-[0.68rem] text-ink-dim mt-4 pt-3 border-t border-line">
        A lista reflete a pasta “{STUDIES_FOLDER.name}” do Drive em tempo real — novos documentos, renomeações e exclusões aparecem ao sincronizar. Nada é duplicado: os arquivos vivem só no Drive.
      </p>
    </div>
  );
}

function traduz(m) {
  const s = (m || '').toLowerCase();
  if (s.includes('popup') || s.includes('interaction')) return 'A janela do Google foi bloqueada — permita popups e tente de novo.';
  if (s.includes('access_denied') || s.includes('denied')) return 'Acesso não autorizado. Tente conectar novamente.';
  if (s.includes('401') || s.includes('403')) return 'Sessão do Drive expirou — clique em Conectar de novo.';
  return m;
}
