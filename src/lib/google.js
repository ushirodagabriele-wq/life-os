// Browser-only Google OAuth via Google Identity Services (GIS) token flow.
// No backend, no client secret — the Client ID is public and the app runs on
// the registered origin (http://localhost:5173).
//
// Persistence without a backend: access tokens are short-lived (~1h) and live
// in memory, BUT once the user grants consent we remember the scope and can
// mint fresh tokens SILENTLY (prompt: '') on every load/refresh — no popup —
// as long as the Google session cookie is alive. That gives a transparent,
// "never click reconnect" experience. The only unavoidable interaction is the
// very first consent, and a rare re-consent if the Google session is lost.

// Set your own OAuth Client ID via .env (see .env.example). Public by design.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const SCOPE_CALENDAR = 'https://www.googleapis.com/auth/calendar.events';
export const SCOPE_GMAIL = 'https://www.googleapis.com/auth/gmail.readonly';
export const SCOPE_DRIVE = 'https://www.googleapis.com/auth/drive';

const REMEMBER_KEY = 'life_os_google_scopes';
// Renew a bit before the token actually expires so in-flight calls never 401.
const EXPIRY_MARGIN_MS = 120 * 1000;

const clients = {}; // scope -> tokenClient
const tokens = {}; // scope -> { token, expiry }
const pending = {}; // scope -> in-flight Promise (dedupes concurrent requests)

// ---- remembered scopes (localStorage) -------------------------------------

function readRemembered() {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeRemembered(list) {
  try {
    localStorage.setItem(REMEMBER_KEY, JSON.stringify([...new Set(list)]));
  } catch { /* ignore quota/private-mode errors */ }
}

export function rememberedScopes() {
  return readRemembered();
}

export function isRemembered(scope) {
  return readRemembered().includes(scope);
}

function remember(scope) {
  const list = readRemembered();
  if (!list.includes(scope)) writeRemembered([...list, scope]);
}

function forget(scope) {
  writeRemembered(readRemembered().filter((s) => s !== scope));
}

// ---- GIS bootstrapping -----------------------------------------------------

function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar o Google.')));
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Falha ao carregar o Google.'));
    document.head.appendChild(s);
  });
}

async function ensureClient(scope) {
  await loadGis();
  if (!clients[scope]) {
    clients[scope] = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope,
      callback: () => {},
    });
  }
  return clients[scope];
}

// ---- token state -----------------------------------------------------------

function tokenValid(scope) {
  const t = tokens[scope];
  return !!t && Date.now() < t.expiry - EXPIRY_MARGIN_MS;
}

export function isConnected(scope) {
  return tokenValid(scope);
}

// A single low-level request. `interactive` decides whether Google may show UI.
function requestOnce(scope, interactive) {
  if (pending[scope]) return pending[scope];
  const p = (async () => {
    const client = await ensureClient(scope);
    return new Promise((resolve, reject) => {
      client.callback = (resp) => {
        if (resp.error) return reject(new Error(resp.error));
        tokens[scope] = { token: resp.access_token, expiry: Date.now() + resp.expires_in * 1000 };
        remember(scope);
        resolve(resp.access_token);
      };
      client.error_callback = (err) => reject(new Error(err?.type || 'popup_failed'));
      try {
        // prompt '' = silent (no UI); 'consent' = show account/consent screen.
        client.requestAccessToken({ prompt: interactive ? 'consent' : '' });
      } catch (e) {
        reject(e);
      }
    });
  })().finally(() => { delete pending[scope]; });
  pending[scope] = p;
  return p;
}

// Interactive connect — used only by the explicit "Conectar" button (first
// consent). Remembers the scope so future loads renew silently.
export async function connect(scope) {
  const token = await requestOnce(scope, true);
  return token;
}

// Silent-only token: returns a valid token without ever showing UI, or throws.
// Used by background sync — must never pop a window on its own.
export async function getTokenSilent(scope) {
  if (tokenValid(scope)) return tokens[scope].token;
  return requestOnce(scope, false);
}

// User-initiated token: silent first, falls back to interactive (safe because
// it runs from a click — loading the inbox, creating a Doc, etc.).
export async function getToken(scope) {
  if (tokenValid(scope)) return tokens[scope].token;
  try {
    return await requestOnce(scope, false);
  } catch {
    return requestOnce(scope, true);
  }
}

// Try to silently re-establish every remembered scope (called on boot). Returns
// the list of scopes that came back connected. Never shows UI, never throws.
export async function autoConnect() {
  const scopes = readRemembered();
  const ok = [];
  await Promise.all(
    scopes.map((scope) =>
      getTokenSilent(scope).then(
        () => { ok.push(scope); },
        () => { /* session lost — will need a one-click reconnect */ },
      ),
    ),
  );
  return ok;
}

export function disconnect(scope) {
  const t = tokens[scope];
  if (t?.token && window.google?.accounts?.oauth2) {
    try { window.google.accounts.oauth2.revoke(t.token, () => {}); } catch { /* ignore */ }
  }
  delete tokens[scope];
  forget(scope);
}
