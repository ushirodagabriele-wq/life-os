import { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell as BarCell,
} from 'recharts';
import { useStore } from '../store/useStore';
import { PageHeader, Card, Modal, Field, Input, Select, currency, IconBtn, EmptyState } from '../components/ui';
import { CATEGORIES, parseExpense } from '../lib/finance';
import { expensesThisMonth, totalOf, byCategory, monthlyTotals } from '../store/selectors';
import { todayISO, addDays, fmtShort, monthKey, fmtMonthYear } from '../lib/date';
import { Send, Pencil, Trash2, Wallet, Sparkles, TrendingUp, TrendingDown, Receipt } from 'lucide-react';

const CHART_COLORS = ['#2B5876', '#4E9BB8', '#0A0A0A', '#2F7D5B', '#B9822B', '#A6432E', '#5A5A60', '#8AA5B8', '#C9A15E'];

export default function Finances() {
  const state = useStore();
  const addExpense = useStore((s) => s.addExpense);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);

  const thisMonth = expensesThisMonth(state);
  const total = totalOf(thisMonth);
  const cats = byCategory(thisMonth);
  const months = monthlyTotals(state, 6);
  const prevMonth = months.length >= 2 ? months[months.length - 2].total : 0;
  const delta = prevMonth ? Math.round(((total - prevMonth) / prevMonth) * 100) : null;

  const history = [...state.expenses].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const handleParse = (text) => {
    // parseDate uses todayISO as a *date string* (and feeds it to addDays), so
    // pass the value todayISO(), not the function — otherwise the parsed date
    // comes back as a function and is lost on save.
    const parsed = parseExpense(text, { todayISO: todayISO(), addDays });
    if (parsed) setDraft(parsed);
    return parsed;
  };

  return (
    <>
      <PageHeader eyebrow="Módulo 14 · Finanças" title="Central Financeira" />

      {/* Chat input */}
      <ChatBox onParse={handleParse} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        <Card className="p-3">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-dim">Gasto no mês</span>
          <div className="font-heading font-bold text-2xl leading-tight capitalize">{currency(total)}</div>
          <span className="text-[0.66rem] text-ink-dim capitalize">{fmtMonthYear(todayISO())}</span>
        </Card>
        <Card className="p-3">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-dim">vs. mês anterior</span>
          <div className={`font-heading font-bold text-2xl leading-tight flex items-center gap-1 ${delta > 0 ? 'text-danger' : 'text-success'}`}>
            {delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta}%`}
            {delta != null && (delta > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />)}
          </div>
          <span className="text-[0.66rem] text-ink-dim">{currency(prevMonth)} no mês anterior</span>
        </Card>
        <Card className="p-3">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-dim">Lançamentos</span>
          <div className="font-heading font-bold text-2xl leading-tight">{thisMonth.length}</div>
          <span className="text-[0.66rem] text-ink-dim">neste mês</span>
        </Card>
        <Card className="p-3">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-dim">Maior categoria</span>
          <div className="font-heading font-bold text-lg leading-tight">{cats[0]?.category || '—'}</div>
          <span className="text-[0.66rem] text-ink-dim">{cats[0] ? currency(cats[0].total) : ''}</span>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* By category */}
        <Card>
          <h2 className="font-heading font-bold text-base mb-3">Gastos por categoria</h2>
          {cats.length === 0 ? (
            <EmptyState icon={Wallet} title="Sem gastos neste mês" />
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-36 h-36 shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={cats} dataKey="total" nameKey="category" innerRadius={38} outerRadius={64} paddingAngle={2}>
                      {cats.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => currency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-1.5 text-sm">
                {cats.map((c, i) => (
                  <li key={c.category} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="flex-1 truncate">{c.category}</span>
                    <span className="font-mono text-[0.72rem]">{currency(c.total)}</span>
                    <span className="text-[0.66rem] text-ink-dim w-8 text-right">{Math.round((c.total / total) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Monthly comparison */}
        <Card>
          <h2 className="font-heading font-bold text-base mb-3">Comparativo mensal</h2>
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={months} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5A5A60' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#5A5A60' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => currency(v)} cursor={{ fill: 'rgba(43,88,118,.06)' }} />
                <Bar dataKey="total" radius={[2, 2, 0, 0]}>
                  {months.map((m, i) => (
                    <BarCell key={i} fill={i === months.length - 1 ? '#2B5876' : '#4E9BB8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* History */}
      <Card className="mt-4">
        <h2 className="font-heading font-bold text-base mb-3">Histórico</h2>
        {history.length === 0 ? (
          <EmptyState icon={Wallet} title="Nenhum lançamento" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[0.6rem] uppercase tracking-wider text-ink-dim">
                  <th className="py-2 pr-3">Data</th>
                  <th className="py-2 pr-3">Estabelecimento</th>
                  <th className="py-2 pr-3">Categoria</th>
                  <th className="py-2 pr-3 text-right">Valor</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 40).map((x) => (
                  <tr key={x.id} className="group border-b border-line/60 last:border-0 hover:bg-washi-soft">
                    <td className="py-2 pr-3 font-mono text-[0.72rem] text-ink-dim whitespace-nowrap">{fmtShort(x.date)}</td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1.5">
                        {x.place || <span className="text-ink-dim">—</span>}
                        {x.sourceEventId && (
                          <span className="chip text-fatura border-fatura/40 bg-fatura-soft" title="Lançada automaticamente ao pagar a fatura no calendário">
                            <Receipt size={10} /> Fatura
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2 pr-3"><span className="chip text-ink-dim border-line">{x.category}</span></td>
                    <td className="py-2 pr-3 text-right font-mono">{currency(x.amount)}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <span className="opacity-0 group-hover:opacity-100">
                        <IconBtn icon={Pencil} label="Editar" onClick={() => setEditing(x)} />
                        <IconBtn icon={Trash2} label="Excluir" onClick={() => deleteExpense(x.id)} className="hover:text-danger" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {(editing || draft) && (
        <ExpenseModal
          expense={editing}
          draft={draft}
          onClose={() => { setEditing(null); setDraft(null); }}
          onSave={(data) => {
            if (editing) useStore.getState().updateExpense(editing.id, data);
            else addExpense(data);
            setEditing(null);
            setDraft(null);
          }}
        />
      )}
    </>
  );
}

function ChatBox({ onParse }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!text.trim()) return;
    const parsed = onParse(text);
    if (!parsed) {
      setError('Não consegui identificar um valor. Tente algo como "gastei R$ 30 na cafeteria".');
      return;
    }
    setError('');
    setText('');
  };

  return (
    <Card className="border-aizome/30 bg-aizome-soft/40">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={15} className="text-horizonte" />
        <h2 className="font-heading font-bold text-base">Registrar gasto por chat</h2>
      </div>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder='Ex.: "Hoje gastei R$ 30 na cafeteria" ou "Paguei 80 de Uber ontem"'
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button className="btn-primary shrink-0" onClick={submit}><Send size={14} /> Registrar</button>
      </div>
      {error && <p className="text-[0.72rem] text-danger mt-2">{error}</p>}
      <p className="text-[0.68rem] text-ink-dim mt-2">
        O Life OS interpreta o valor, a categoria, o estabelecimento e a data automaticamente — você confirma antes de salvar.
      </p>
    </Card>
  );
}

function ExpenseModal({ expense, draft, onClose, onSave }) {
  const init = expense || draft || {};
  const [f, setF] = useState({
    amount: init.amount || '', category: init.category || 'Outros', place: init.place || '',
    date: init.date || todayISO(), note: init.note || '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal open onClose={onClose} title={expense ? 'Editar lançamento' : 'Confirmar gasto'}>
      {draft && !expense && (
        <p className="text-[0.72rem] text-aizome mb-3 flex items-start gap-1.5">
          <Sparkles size={13} className="mt-0.5 shrink-0" /> Interpretei sua mensagem. Ajuste se precisar e confirme.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor (R$)"><Input type="number" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value === '' ? '' : Number(e.target.value) })} autoFocus /></Field>
        <Field label="Data"><Input type="date" value={f.date} onChange={set('date')} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoria"><Select value={f.category} onChange={set('category')} options={CATEGORIES} /></Field>
        <Field label="Estabelecimento"><Input value={f.place} onChange={set('place')} /></Field>
      </div>
      <Field label="Observação"><Input value={f.note} onChange={set('note')} /></Field>
      <div className="flex justify-end gap-2 mt-2">
        <button className="btn-soft" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={() => f.amount && onSave({ ...f, amount: Number(f.amount) })}>Salvar</button>
      </div>
    </Modal>
  );
}
