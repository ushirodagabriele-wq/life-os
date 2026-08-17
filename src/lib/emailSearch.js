// Lightweight natural-language search over the email snapshot.
// Strips command/filler words ("encontre o e-mail sobre...") and scores each
// email by how many meaningful terms it matches across sender, subject,
// summary, category and tags.

const STOPWORDS = new Set([
  'encontre', 'encontrar', 'ache', 'achar', 'procure', 'procura', 'procurar', 'busque', 'buscar',
  'mostra', 'mostre', 'mostrar', 'quero', 'ver', 'me', 'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
  'e', 'de', 'da', 'do', 'das', 'dos', 'no', 'na', 'nos', 'nas', 'em', 'para', 'pra', 'por',
  'sobre', 'que', 'fala', 'falam', 'falando', 'com', 'meu', 'minha', 'meus', 'minhas', 'seu', 'sua',
  'email', 'emails', 'e-mail', 'e-mails', 'mensagem', 'mensagens', 'ao', 'aos', 'à', 'às', 'the', 'of',
]);

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^\w\s@.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function haystack(email) {
  return normalize(
    [
      email.from?.name,
      email.from?.email,
      email.subject,
      email.snippet,
      email.summary,
      email.category,
      (email.tags || []).join(' '),
    ].join(' ')
  );
}

export function tokenizeQuery(query) {
  return normalize(query)
    .split(' ')
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

export function searchEmails(emails, query) {
  const tokens = tokenizeQuery(query);
  if (!tokens.length) return [];
  return emails
    .map((email) => {
      const hay = haystack(email);
      const tagSet = normalize((email.tags || []).join(' ')).split(' ');
      let score = 0;
      for (const tk of tokens) {
        if (hay.includes(tk)) score += 1;
        if (tagSet.includes(tk)) score += 1; // exact tag match boosts
        if (normalize(email.subject).includes(tk)) score += 1; // subject boost
      }
      return { email, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || b.email.date.localeCompare(a.email.date))
    .map((r) => r.email);
}
