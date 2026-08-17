import { useState } from 'react';
import { PageHeader, Card } from '../components/ui';
import { SUBJECTS, SUBJECTS_ROOT, embeddedFolderUrl, driveFolderUrl } from '../data/subjects';
import {
  SLOTS, DAYS, SESSIONS_RESOLVED, SUBJECTS_META, SUBJECT_STYLE, SEMESTER, slotSpan,
} from '../data/schedule';
import {
  Folder, FolderOpen, ChevronRight, ExternalLink, RefreshCw, ArrowLeft,
  LayoutGrid, List, FileText, Home, CalendarClock, Grid3x3, MapPin, FolderSymlink,
} from 'lucide-react';

// Cycle a subtle accent so the folder wall has visual rhythm.
const ACCENTS = ['text-aizome', 'text-horizonte', 'text-success', 'text-warn', 'text-obsidiana'];

export default function Subjects() {
  const [tab, setTab] = useState('grade'); // grade | materiais
  const [openId, setOpenId] = useState(null);
  const [view, setView] = useState('grid'); // grid | list (Drive embed mode)
  const [reloadKey, setReloadKey] = useState(0);

  const open = SUBJECTS.find((s) => s.id === openId) || null;

  // Open a discipline's Drive folder from the schedule grid/legend.
  const openSubjectFolder = (driveId) => {
    if (!driveId) return;
    setTab('materiais');
    setOpenId(driveId);
    setReloadKey((k) => k + 1);
  };

  return (
    <>
      <PageHeader eyebrow="Módulo 07 · Repositório acadêmico" title="Matérias da Faculdade" />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line mb-4">
        {[
          { key: 'grade', label: 'Grade horária', icon: Grid3x3 },
          { key: 'materiais', label: 'Materiais (Drive)', icon: Folder },
        ].map((t) => (
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

      {tab === 'grade' ? (
        <ScheduleTab onOpen={openSubjectFolder} />
      ) : (
        <MaterialsTab
          open={open}
          openId={openId}
          setOpenId={setOpenId}
          view={view}
          setView={setView}
          reloadKey={reloadKey}
          setReloadKey={setReloadKey}
        />
      )}
    </>
  );
}

/* ============================ Grade horária ============================ */

function ScheduleTab({ onOpen }) {
  return (
    <>
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarClock size={16} className="text-aizome" />
            <h2 className="font-heading font-bold text-base">6º Semestre — RI</h2>
          </div>
          <span className="chip text-ink-dim border-line">{SEMESTER.label}</span>
        </div>
        <ScheduleGrid onOpen={onOpen} />
        <p className="text-[0.68rem] text-ink-dim mt-3 pt-3 border-t border-line flex items-start gap-1.5">
          <CalendarClock size={12} className="mt-0.5 shrink-0" />
          Cada aula aparece automaticamente no <b className="font-medium">Calendário</b> ao longo do semestre,
          com a mesma cor da matéria aqui. Clique numa aula para abrir a pasta dela no Drive.
        </p>
      </Card>

      <SubjectLegend onOpen={onOpen} />
    </>
  );
}

function ScheduleGrid({ onOpen }) {
  // Track which (day, slotIndex) cells are already occupied by a spanning class.
  const covered = {};
  DAYS.forEach((d) => { covered[d.n] = new Set(); });

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full border-separate border-spacing-1 min-w-[760px]">
        <thead>
          <tr>
            <th className="w-14" />
            {DAYS.map((d) => (
              <th key={d.n} className="font-mono text-[0.6rem] uppercase tracking-wider text-ink-dim py-1 font-medium">
                {d.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SLOTS.map((sl, i) => {
            if (sl.lunch) {
              return (
                <tr key={i}>
                  <td className="align-middle text-right pr-1 font-mono text-[0.55rem] text-ink-dim/70 whitespace-nowrap">
                    {sl.start}
                  </td>
                  <td colSpan={DAYS.length} className="text-center py-1.5 rounded-sharp bg-washi-soft/60 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-ink-dim/70">
                    Almoço
                  </td>
                </tr>
              );
            }
            return (
              <tr key={i}>
                <td className="align-top pr-1 pt-1 font-mono text-[0.55rem] leading-tight text-ink-dim whitespace-nowrap text-right">
                  {sl.start}<br />{sl.end}
                </td>
                {DAYS.map((d) => {
                  if (covered[d.n].has(i)) return null;
                  const s = SESSIONS_RESOLVED.find((x) => x.day === d.n && x.start === sl.start);
                  if (!s) {
                    return <td key={d.n} className="rounded-sharp border border-dashed border-line/50 min-w-[128px]" />;
                  }
                  const span = slotSpan(s);
                  for (let k = 1; k < span; k++) covered[d.n].add(i + k);
                  const st = SUBJECT_STYLE[s.color] || {};
                  return (
                    <td key={d.n} rowSpan={span} className="p-0 align-top min-w-[128px]">
                      <button
                        type="button"
                        onClick={() => onOpen(s.driveId)}
                        disabled={!s.driveId}
                        title={s.driveId ? `Abrir pasta de ${s.name}` : s.name}
                        className={`w-full h-full text-left p-2 rounded-sharp border-l-[3px] ${st.cell} transition-shadow ${
                          s.driveId ? 'hover:shadow-card cursor-pointer' : 'cursor-default'
                        }`}
                      >
                        <p className={`font-heading font-bold text-[0.72rem] leading-tight ${st.text}`}>{s.short}</p>
                        <p className="text-[0.58rem] text-ink-dim mt-0.5 leading-snug">{s.professor}</p>
                        {s.room && (
                          <p className="text-[0.56rem] text-ink-dim/80 mt-0.5 flex items-center gap-0.5">
                            <MapPin size={9} className="shrink-0" /> {s.room}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {s.shared && (
                            <span className="inline-block font-mono text-[0.5rem] uppercase tracking-wider text-ink-dim/80 bg-washi/70 border border-line rounded-sharp px-1 py-px">
                              Tronco c/Eco
                            </span>
                          )}
                          {s.driveId && (
                            <FolderSymlink size={11} className={`${st.text} opacity-70`} />
                          )}
                        </div>
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SubjectLegend({ onOpen }) {
  return (
    <Card className="mt-4">
      <h3 className="font-mono text-[0.6rem] uppercase tracking-wider text-ink-dim mb-3">Disciplinas do semestre</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {Object.entries(SUBJECTS_META).map(([key, s]) => {
          const st = SUBJECT_STYLE[s.color] || {};
          return (
            <button
              key={key}
              type="button"
              onClick={() => onOpen(s.driveId)}
              disabled={!s.driveId}
              className={`flex items-start gap-2 text-left rounded-sharp px-1 -mx-1 py-0.5 ${
                s.driveId ? 'hover:bg-obsidiana/5 cursor-pointer' : 'cursor-default'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${st.dot}`} />
              <span className="min-w-0">
                <span className="text-sm font-medium leading-tight">{s.name}</span>
                <span className="block text-[0.66rem] text-ink-dim">{s.professor}</span>
              </span>
              {s.driveId && <FolderSymlink size={12} className="text-ink-dim shrink-0 mt-1 ml-auto" />}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ============================ Materiais (Drive) ============================ */

function MaterialsTab({ open, openId, setOpenId, view, setView, reloadKey, setReloadKey }) {
  return !open ? (
    /* ---------- Folder wall (native look) ---------- */
    <>
      <div className="flex items-center gap-1.5 text-[0.72rem] font-mono uppercase tracking-[0.06em] text-ink-dim mb-4">
        <span className="inline-flex items-center gap-1 text-obsidiana"><Home size={12} /> {SUBJECTS_ROOT.title}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {SUBJECTS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setOpenId(s.id); setReloadKey((k) => k + 1); }}
            className="group text-left card p-4 hover:border-obsidiana/40 hover:shadow-card transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <Folder size={30} className={`${ACCENTS[i % ACCENTS.length]} group-hover:hidden`} strokeWidth={1.5} />
              <FolderOpen size={30} className={`${ACCENTS[i % ACCENTS.length]} hidden group-hover:block`} strokeWidth={1.5} />
              <ChevronRight size={16} className="text-ink-dim opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
            </div>
            <p className="font-heading font-bold text-sm leading-tight">{s.label}</p>
            <p className="text-[0.66rem] text-ink-dim font-mono mt-1">Pasta · disciplina</p>
          </button>
        ))}
      </div>

      <p className="text-[0.68rem] text-ink-dim mt-6 pt-4 border-t border-line flex items-start gap-1.5">
        <RefreshCw size={12} className="mt-0.5 shrink-0" />
        Cada pasta abre o conteúdo real armazenado no seu Drive e sincroniza sozinha — arquivos novos, editados
        ou removidos aparecem automaticamente, sem cópias. A estrutura vem da pasta “{SUBJECTS_ROOT.title}”.
      </p>
    </>
  ) : (
    /* ---------- Live Drive folder contents ---------- */
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => setOpenId(null)} className="btn-soft py-1.5 px-2.5">
            <ArrowLeft size={13} /> Voltar
          </button>
          <span className="font-heading font-bold text-sm truncate ml-1">{open.label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-0.5 border border-line rounded-sharp p-0.5 mr-1">
            <button
              onClick={() => { setView('grid'); setReloadKey((k) => k + 1); }}
              className={`p-1 rounded-sharp ${view === 'grid' ? 'bg-obsidiana text-washi' : 'text-ink-dim hover:text-obsidiana'}`}
              title="Grade" aria-label="Grade"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => { setView('list'); setReloadKey((k) => k + 1); }}
              className={`p-1 rounded-sharp ${view === 'list' ? 'bg-obsidiana text-washi' : 'text-ink-dim hover:text-obsidiana'}`}
              title="Lista" aria-label="Lista"
            >
              <List size={14} />
            </button>
          </div>
          <button onClick={() => setReloadKey((k) => k + 1)} className="btn-soft py-1.5 px-2.5" title="Atualizar">
            <RefreshCw size={13} />
          </button>
          <a href={driveFolderUrl(open.id)} target="_blank" rel="noopener noreferrer" className="btn-soft py-1.5 px-2.5">
            <ExternalLink size={13} /> Abrir
          </a>
        </div>
      </div>

      <iframe
        key={`${open.id}-${view}-${reloadKey}`}
        title={`Conteúdo de ${open.label}`}
        src={embeddedFolderUrl(open.id, view)}
        className="w-full bg-washi"
        style={{ height: '68vh', border: 'none' }}
        loading="lazy"
      />

      <div className="border-t border-line px-4 py-2.5 flex items-start gap-1.5">
        <FileText size={12} className="mt-0.5 shrink-0 text-ink-dim" />
        <p className="text-[0.68rem] text-ink-dim">
          Conteúdo ao vivo da disciplina. Se a pré-visualização não carregar (pasta muito restrita ou sem sessão do Google
          neste navegador),{' '}
          <a href={driveFolderUrl(open.id)} target="_blank" rel="noopener noreferrer" className="text-aizome hover:underline">
            abra a pasta no Drive
          </a>
          . Clique em qualquer arquivo para abri-lo.
        </p>
      </div>
    </Card>
  );
}
