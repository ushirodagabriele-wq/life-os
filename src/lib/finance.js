// Natural-language expense parser (pt-BR).
// Turns "Hoje gastei R$ 30 na cafeteria" into { amount, category, place, date }.

export const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Educação',
  'Lazer',
  'Saúde',
  'Compras',
  'Assinaturas',
  'Outros',
];

// keyword -> category. Matched against the whole lowercased message.
const KEYWORDS = {
  Alimentação: ['cafeteria', 'café', 'cafe', 'restaurante', 'almoço', 'almoco', 'jantar', 'lanche', 'padaria', 'mercado', 'supermercado', 'ifood', 'comida', 'pizza', 'bar', 'açaí', 'acai', 'sorvete', 'feira'],
  Transporte: ['uber', '99', 'taxi', 'táxi', 'combustível', 'combustivel', 'gasolina', 'etanol', 'ônibus', 'onibus', 'metrô', 'metro', 'passagem', 'estacionamento', 'pedágio', 'pedagio', 'bilhete'],
  Moradia: ['aluguel', 'condomínio', 'condominio', 'luz', 'energia', 'água', 'agua', 'internet', 'gás', 'gas', 'iptu'],
  Educação: ['curso', 'livro', 'faculdade', 'mensalidade', 'material', 'apostila', 'workshop'],
  Lazer: ['cinema', 'show', 'viagem', 'festa', 'jogo', 'streaming', 'ingresso', 'passeio'],
  Saúde: ['farmácia', 'farmacia', 'remédio', 'remedio', 'médico', 'medico', 'academia', 'dentista', 'consulta', 'exame'],
  Compras: ['roupa', 'tênis', 'tenis', 'sapato', 'presente', 'amazon', 'shopping', 'loja', 'eletrônico', 'eletronico'],
  Assinaturas: ['netflix', 'spotify', 'assinatura', 'plano', 'prime', 'youtube', 'disney', 'hbo', 'max', 'chatgpt', 'claude'],
};

function guessCategory(text) {
  const t = text.toLowerCase();
  for (const cat of CATEGORIES) {
    const words = KEYWORDS[cat];
    if (words && words.some((w) => t.includes(w))) return cat;
  }
  return 'Outros';
}

// Extract the establishment after "na/no/em/de/com" prepositions.
function guessPlace(text) {
  const m = text.match(/\b(?:n[ao]s?|em|d[eo]s?|com)\s+([a-zà-ú][\wà-ú&'\- ]{1,40}?)(?:\s+(?:hoje|ontem|amanhã|amanha|por|de|no dia)\b|[.,!?]|$)/i);
  if (m) {
    let place = m[1].trim();
    // strip trailing filler
    place = place.replace(/\s+(hoje|ontem|reais|conta)$/i, '').trim();
    if (place.length > 1) return capitalize(place);
  }
  return '';
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Normalize a BR-formatted number string into a JS float.
// "1.234,56" -> 1234.56 · "1.234" -> 1234 · "49,90" -> 49.9 · "30" -> 30
function normalizeBR(raw) {
  if (raw.includes(',')) {
    // comma is the decimal separator; dots are thousands groupings
    raw = raw.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(raw)) {
    // e.g. "1.234" or "1.234.567" -> thousands groupings, no decimals
    raw = raw.replace(/\./g, '');
  }
  // otherwise a lone dot is treated as a decimal point ("1.5")
  const val = parseFloat(raw);
  return isNaN(val) ? null : val;
}

// Parse a BR currency amount: "R$ 1.234,56", "30", "1200,50", "80 reais".
function parseAmount(text) {
  // A full BR number: optional thousands groups, optional 2-decimal comma part.
  const NUM = '(\\d{1,3}(?:\\.\\d{3})+,\\d{2}|\\d{1,3}(?:\\.\\d{3})+|\\d+,\\d{2}|\\d+(?:\\.\\d+)?)';
  // Prefer a value marked by R$ / reais, then fall back to any number.
  const patterns = [
    new RegExp('r\\$\\s*' + NUM, 'i'),
    new RegExp(NUM + '\\s*(?:reais|conto|pila|r\\$)', 'i'),
    new RegExp('\\b' + NUM + '\\b'),
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const val = normalizeBR(m[1]);
      if (val != null && val > 0) return val;
    }
  }
  return null;
}

function parseDate(text, todayISO, addDays) {
  const t = text.toLowerCase();
  if (/\bontem\b/.test(t)) return addDays(todayISO, -1);
  if (/\banteontem\b/.test(t)) return addDays(todayISO, -2);
  if (/\bamanh[ãa]\b/.test(t)) return addDays(todayISO, 1);
  // dd/mm
  const m = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (m) {
    const now = new Date();
    const day = String(m[1]).padStart(2, '0');
    const mon = String(m[2]).padStart(2, '0');
    let year = m[3] ? m[3] : now.getFullYear();
    if (String(year).length === 2) year = '20' + year;
    return `${year}-${mon}-${day}`;
  }
  return todayISO;
}

export function parseExpense(text, ctx) {
  const { todayISO, addDays } = ctx;
  const amount = parseAmount(text);
  if (amount == null) return null;
  return {
    amount,
    category: guessCategory(text),
    place: guessPlace(text),
    date: parseDate(text, todayISO, addDays),
    note: text.trim(),
  };
}
