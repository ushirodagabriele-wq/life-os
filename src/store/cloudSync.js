// Cloud sync: mirrors the local Life OS state to Supabase so it follows the
// user across devices. Local-first — the app works offline; signing in adds
// cloud persistence on top.

import { useStore } from './useStore';
import { supabase } from '../lib/supabase';

// Data slices we persist (everything except action functions).
const KEYS = [
  'tasks', 'events', 'courses', 'processes', 'academic', 'notes',
  'books', 'media', 'expenses', 'goals', 'biblePlan', 'meta',
  'savedEvents', 'viewedEvents', 'linkedEvents', 'eventsSeenAt', 'timeline',
];

function snapshot() {
  const s = useStore.getState();
  const out = {};
  for (const k of KEYS) out[k] = s[k];
  return out;
}

let unsub = null;
let timer = null;
let applyingRemote = false;

async function saveNow(userId) {
  const payload = { user_id: userId, data: snapshot(), updated_at: new Date().toISOString() };
  const { error } = await supabase.from('life_os_state').upsert(payload);
  if (error) throw error;
}

// On sign-in: if the cloud already has this user's state, pull it into the app;
// otherwise seed the cloud with what's currently local.
export async function pullOrSeed(userId) {
  const { data, error } = await supabase
    .from('life_os_state')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  if (data && data.data) {
    applyingRemote = true;
    try {
      useStore.getState().importData(data.data);
      // Cloud may still hold the old demo data — clean it here too (once).
      useStore.getState().clearDemoData();
    } finally {
      applyingRemote = false;
    }
    return 'pulled';
  }
  await saveNow(userId);
  return 'seeded';
}

// Start mirroring local changes up to the cloud (debounced).
export function startSync(userId) {
  stopSync();
  unsub = useStore.subscribe(() => {
    if (applyingRemote) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      saveNow(userId).catch((e) => console.warn('[Life OS] falha ao sincronizar:', e.message));
    }, 1500);
  });
}

export function stopSync() {
  if (unsub) { unsub(); unsub = null; }
  clearTimeout(timer);
}
