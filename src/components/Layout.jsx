import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import CloudSync from './CloudSync';
import {
  LayoutDashboard, Calendar, CheckSquare, GraduationCap, Briefcase,
  BookOpen, NotebookPen, Library, Film, Wallet, Target, Menu, X, Sparkles, Mail, FolderKanban, Radar, Ticket, Clock,
} from 'lucide-react';

export const NAV = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/checklist', label: 'Checklist', icon: CheckSquare },
  { to: '/calendario', label: 'Calendário', icon: Calendar },
  { to: '/cronograma', label: 'Cronograma', icon: Clock },
  { to: '/emails', label: 'Emails', icon: Mail },
  { to: '/radar', label: 'Radar de Notícias', icon: Radar },
  { to: '/metas', label: 'Metas & OKRs', icon: Target },
  { to: '/materias', label: 'Matérias da Faculdade', icon: FolderKanban },
  { to: '/processos', label: 'Processos Seletivos', icon: Briefcase },
  { to: '/academico', label: 'Central Acadêmica', icon: BookOpen },
  { to: '/biblioteca', label: 'Biblioteca', icon: Library },
  { to: '/cursos', label: 'Cursos', icon: GraduationCap },
  { to: '/estudos', label: 'Estudos Livres', icon: NotebookPen },
  { to: '/midia', label: 'Filmes & Séries', icon: Film },
  { to: '/financas', label: 'Finanças', icon: Wallet },
  { to: '/eventos', label: 'Eventos', icon: Ticket },
];

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 px-3 py-2 rounded-sharp font-mono text-[0.72rem] uppercase tracking-[0.06em] transition-colors ${
              isActive
                ? 'bg-obsidiana text-washi'
                : 'text-ink-dim hover:text-obsidiana hover:bg-washi-soft'
            }`
          }
        >
          <Icon size={16} className="shrink-0" />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-full md:flex bg-washi-soft">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col border-r border-line bg-washi h-screen sticky top-0">
        <Brand />
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavItems />
        </div>
        <CloudSync />
        <Footer />
      </aside>

      {/* Topbar — mobile */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-line bg-washi px-4 h-14">
        <div className="flex items-center gap-2">
          <span className="font-heading font-extrabold text-lg">Life<span className="text-horizonte">OS</span></span>
        </div>
        <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="p-2">
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-obsidiana/40" onClick={() => setOpen(false)} />
          <aside className="relative w-72 max-w-[85%] bg-washi h-full flex flex-col animate-rise">
            <div className="flex items-center justify-between px-4 h-14 border-b border-line">
              <Brand small />
              <button onClick={() => setOpen(false)} aria-label="Fechar menu" className="p-2">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavItems onNavigate={() => setOpen(false)} />
            </div>
            <CloudSync />
            <Footer />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0">
        <div key={location.pathname} className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 animate-rise">
          {children}
        </div>
      </main>
    </div>
  );
}

function Brand({ small }) {
  return (
    <div className={`flex items-center gap-2 px-4 ${small ? '' : 'h-16 border-b border-line'}`}>
      <div className="w-7 h-7 bg-obsidiana rounded-sharp flex items-center justify-center">
        <span className="font-heading font-extrabold text-horizonte text-sm">L</span>
      </div>
      <div className="leading-none">
        <span className="font-heading font-extrabold text-lg">Life<span className="text-horizonte">OS</span></span>
        <p className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-ink-dim mt-0.5">Personal Command Center</p>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="px-4 py-3 border-t border-line">
      <NavLink to="/checklist" className="flex items-center gap-2 text-[0.62rem] font-mono uppercase tracking-[0.1em] text-horizonte hover:text-aizome">
        <Sparkles size={13} />
        Sugestões do dia
      </NavLink>
    </div>
  );
}
