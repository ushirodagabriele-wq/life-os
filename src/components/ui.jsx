import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function PageHeader({ eyebrow, title, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="font-heading font-bold text-2xl md:text-3xl tracking-tight text-obsidiana mt-1">
          {title}
        </h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({ children, className = '', as: Tag = 'div', ...rest }) {
  return (
    <Tag className={`card p-4 ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function SectionTitle({ children, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-heading font-bold text-lg text-obsidiana">{children}</h2>
      {right}
    </div>
  );
}

export function ProgressBar({ value, color = 'aizome', className = '' }) {
  const colors = {
    aizome: 'bg-aizome',
    horizonte: 'bg-horizonte',
    success: 'bg-success',
    warn: 'bg-warn',
    danger: 'bg-danger',
    obsidiana: 'bg-obsidiana',
  };
  return (
    <div className={`h-1.5 w-full bg-line rounded-sharp overflow-hidden ${className}`}>
      <div
        className={`h-full ${colors[color] || colors.aizome} transition-all duration-500`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

const STATUS_STYLES = {
  // generic
  'Em andamento': 'text-aizome border-aizome/40 bg-aizome-soft',
  'Concluído': 'text-success border-success/40 bg-success/5',
  'Concluída': 'text-success border-success/40 bg-success/5',
  'Pausado': 'text-ink-dim border-line',
  'Não iniciada': 'text-ink-dim border-line',
  'Pendente': 'text-warn border-warn/40 bg-warn/5',
  'Reagendada': 'text-aizome border-aizome/40 bg-aizome-soft',
  'Cancelada': 'text-danger border-danger/40 bg-danger/5 line-through',
  'Interesse': 'text-ink-dim border-line',
  'Inscrito': 'text-aizome border-aizome/40 bg-aizome-soft',
  'Descartado': 'text-ink-dim border-line line-through',
  'Lendo': 'text-aizome border-aizome/40 bg-aizome-soft',
  'Quero ler': 'text-ink-dim border-line',
  'Assistindo': 'text-aizome border-aizome/40 bg-aizome-soft',
  'Quero assistir': 'text-ink-dim border-line',
};

export function StatusBadge({ status }) {
  return (
    <span className={`chip ${STATUS_STYLES[status] || 'text-ink-dim border-line'}`}>{status}</span>
  );
}

const PRIORITY_STYLES = {
  alta: 'text-danger border-danger/40 bg-danger/5',
  media: 'text-warn border-warn/40 bg-warn/5',
  baixa: 'text-ink-dim border-line',
};
const PRIORITY_LABEL = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

export function PriorityBadge({ priority }) {
  return <span className={`chip ${PRIORITY_STYLES[priority] || ''}`}>{PRIORITY_LABEL[priority] || priority}</span>;
}

export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  // Portal to <body> so the overlay escapes any parent stacking context
  // (e.g. the sticky sidebar) and always covers the whole viewport.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-8 bg-obsidiana/40 backdrop-blur-sm overflow-y-auto"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`card w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} my-8 animate-rise`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="font-heading font-bold text-lg">{title}</h3>
          <button className="p-1.5 hover:text-aizome" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Input(props) {
  return <input className="input" {...props} />;
}

export function Textarea(props) {
  return <textarea className="input min-h-[80px] resize-y" {...props} />;
}

export function Select({ options, ...props }) {
  return (
    <select className="input" {...props}>
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  );
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="text-center py-12 text-ink-dim">
      {Icon && <Icon size={28} className="mx-auto mb-3 opacity-50" />}
      <p className="font-heading text-base text-obsidiana mb-1">{title}</p>
      {hint && <p className="text-sm">{hint}</p>}
    </div>
  );
}

export function OriginTag({ origin }) {
  if (!origin) return null;
  return <span className="chip text-horizonte border-horizonte/40 bg-horizonte-soft">{origin.label}</span>;
}

export function IconBtn({ icon: Icon, onClick, label, className = '' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-1.5 rounded-sharp text-ink-dim hover:text-obsidiana hover:bg-washi-soft transition-colors ${className}`}
    >
      <Icon size={16} />
    </button>
  );
}

export function currency(v) {
  return (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
