// Live Gmail reading (browser, gmail.readonly). Fetches recent inbox messages
// and categorizes them with simple client-side rules (no AI — the AI analysis
// stays in the snapshot modules).

const BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

const KW = {
  'Processos Seletivos': ['processo seletivo', 'vaga', 'estágio', 'estagio', 'recrutamento', 'recruiting', 'entrevista', 'candidatura', 'programa de', 'trainee', 'btg', 'mckinsey', 'nubank', 'bain', 'criteria', 'assessment', 'conferência de carreira'],
  Oportunidade: ['fully funded', 'scholarship', 'fellowship', 'delegation', 'opportunity', 'opportunities', 'bolsa', 'edital', 'summit', 'forum'],
  Financeiro: ['nota fiscal', 'nfe', 'nf-e', 'nfs-e', 'fatura', 'boleto', 'pagamento', 'cobrança', 'invoice', 'recibo'],
  Brain: ['empresa júnior', 'empresa junior', 'newsletter interna'],
};

function categorize(email, subject, snippet) {
  const hay = `${email} ${subject} ${snippet}`.toLowerCase();
  for (const cat of ['Processos Seletivos', 'Oportunidade', 'Financeiro', 'Brain']) {
    if (KW[cat].some((k) => hay.includes(k))) return cat;
  }
  const e = (email || '').toLowerCase();
  if (/no-?reply|noreply|newsletter|marketing|news@|mailer|substack|wordpress/.test(e)) return 'Newsletter';
  return 'Pessoal';
}

// Rough "needs reply" heuristic: unread, from a real person (not no-reply),
// and not a newsletter/promo.
function needsReply(email, unread, category) {
  const e = (email || '').toLowerCase();
  if (/no-?reply|noreply|do-not-reply|donotreply|mailer|newsletter/.test(e)) return false;
  return unread && (category === 'Pessoal' || category === 'Processos Seletivos');
}

function decode(s) {
  return (s || '')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
}

function parseFrom(raw) {
  const m = (raw || '').match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: (m[1] || '').trim() || m[2], email: m[2] };
  return { name: (raw || '').replace(/[<>]/g, '').trim(), email: (raw || '').trim() };
}

async function getMeta(token, id) {
  const url = `${BASE}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const m = await r.json();
  const headers = {};
  for (const h of m.payload?.headers || []) headers[h.name.toLowerCase()] = h.value;
  const from = parseFrom(headers.from);
  const labelIds = m.labelIds || [];
  const unread = labelIds.includes('UNREAD');
  const subject = headers.subject || '(sem assunto)';
  const snippet = decode(m.snippet || '');
  const category = categorize(from.email, subject, snippet);
  return {
    id: m.id,
    threadId: m.threadId,
    from,
    subject,
    snippet,
    date: new Date(Number(m.internalDate || Date.now())).toISOString().slice(0, 10),
    unread,
    starred: labelIds.includes('STARRED'),
    important: labelIds.includes('IMPORTANT'),
    category,
    needsReply: needsReply(from.email, unread, category),
  };
}

export async function fetchInbox(token, max = 25) {
  const r = await fetch(`${BASE}/messages?q=in:inbox&maxResults=${max}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Gmail respondeu ${r.status}`);
  const list = await r.json();
  const ids = (list.messages || []).map((m) => m.id);
  const msgs = await Promise.all(ids.map((id) => getMeta(token, id)));
  return msgs.filter(Boolean);
}
