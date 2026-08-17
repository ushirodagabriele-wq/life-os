// Background Google sync manager. Once the user has connected (even in a past
// session), this re-establishes the token silently on boot and keeps the
// calendar in sync automatically — on load, on a smart interval, when the tab
// regains focus, and shortly after any local event change. No manual button,
// no reconnect. Tokens are renewed silently before they expire.

import { useSyncExternalStore } from 'react';
import { useStore } from './useStore';
import { autoConnect, getTokenSilent, isRemembered, SCOPE_CALENDAR } from '../lib/google';
import { listEvents, createEvent, fromGoogleEvent, meetingLinkFromGoogle } from '../lib/gcal';

// ---- reactive status (no extra store; a tiny external store) ---------------

let status = { connected: false, syncing: false, lastSync: null, error: null };
const listeners = new Set();

function setStatus(patch) {
  status = { ...status, ...patch };
  for (const l of listeners) l();
}

export function getGoogleStatus() {
  return status;
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// React hook for components that want to reflect the live status.
export function useGoogleStatus() {
  return useSyncExternalStore(subscribe, getGoogleStatus, getGoogleStatus);
}

// ---- sync core -------------------------------------------------------------

const S = () => useStore.getState();

// Fields we mirror from Google; used both to apply and to detect real changes.
const MIRROR = ['title', 'date', 'time', 'endTime', 'location', 'meetingLink', 'note'];

function differs(local, incoming) {
  return MIRROR.some((k) => (local[k] || '') !== (incoming[k] || ''));
}

let running = false; // guards against overlap + sync-triggers-sync loops
let queued = false;

// Push local, non-recurring compromissos to Google (creating a Meet room when
// the event asked for one), then pull Google events back in.
async function doSync({ pull = true } = {}) {
  if (!isRemembered(SCOPE_CALENDAR)) return;
  if (running) { queued = true; return; }
  running = true;
  setStatus({ syncing: true, error: null });
  try {
    const token = await getTokenSilent(SCOPE_CALENDAR);
    setStatus({ connected: true });

    // PUSH: local compromissos without a gcalId → create in Google.
    for (const e of S().events) {
      if (e.fromGoogle || e.gcalId || !e.date) continue;
      if (e.category === 'fatura') continue;
      if (e.recurrence && e.recurrence !== 'none') continue;
      try {
        const g = await createEvent(token, e);
        const patch = { gcalId: g.id };
        const link = meetingLinkFromGoogle(g);
        if (link && !e.meetingLink) patch.meetingLink = link;
        if (e.wantsMeet) patch.wantsMeet = false;
        S().updateEvent(e.id, patch);
      } catch { /* keep going; a bad event shouldn't block the batch */ }
    }

    if (pull) {
      const timeMin = new Date(Date.now() - 30 * 864e5).toISOString();
      const timeMax = new Date(Date.now() + 120 * 864e5).toISOString();
      const gEvents = await listEvents(token, timeMin, timeMax);
      const byGcal = {};
      for (const e of S().events) if (e.gcalId) byGcal[e.gcalId] = e;
      for (const g of gEvents) {
        const f = fromGoogleEvent(g);
        const existing = byGcal[g.id];
        if (existing) {
          if (differs(existing, f)) {
            S().updateEvent(existing.id, {
              title: f.title, date: f.date, time: f.time, endTime: f.endTime,
              location: f.location, meetingLink: f.meetingLink, note: f.note,
            });
          }
        } else {
          S().addEvent(f);
        }
      }
    }
    setStatus({ syncing: false, lastSync: Date.now(), error: null });
  } catch (e) {
    setStatus({ syncing: false, error: e?.message || 'sync_failed' });
  } finally {
    running = false;
    if (queued) { queued = false; doSync({ pull: false }); }
  }
}

// Public: force a sync now (used by the optional manual button + after connect).
export function syncNow() {
  return doSync({ pull: true });
}

// ---- scheduler -------------------------------------------------------------

let started = false;
let intervalId = null;
let unsubStore = null;
let debounceId = null;
let lastVisibilitySync = 0;

const INTERVAL_MS = 3 * 60 * 1000; // periodic pull
const VISIBILITY_THROTTLE_MS = 60 * 1000; // don't spam on rapid tab switches
const CHANGE_DEBOUNCE_MS = 5000; // push local edits shortly after they settle

function onVisible() {
  if (document.visibilityState !== 'visible') return;
  if (Date.now() - lastVisibilitySync < VISIBILITY_THROTTLE_MS) return;
  lastVisibilitySync = Date.now();
  doSync({ pull: true });
}

// Start the whole automatic machinery. Safe to call once on app boot.
export async function startGoogleAuto() {
  if (started) return;
  started = true;

  // Re-establish remembered connections silently, then do a first sync.
  const ok = await autoConnect();
  if (ok.includes(SCOPE_CALENDAR)) {
    setStatus({ connected: true });
    doSync({ pull: true });
  }

  intervalId = setInterval(() => {
    if (document.visibilityState === 'visible') doSync({ pull: true });
  }, INTERVAL_MS);

  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', onVisible);

  // Push local event changes automatically (debounced). The `running` guard
  // means writes made BY the pull don't retrigger a sync.
  unsubStore = useStore.subscribe((s, prev) => {
    if (running) return;
    if (s.events === prev.events) return; // only react to event changes
    if (!isRemembered(SCOPE_CALENDAR)) return;
    clearTimeout(debounceId);
    debounceId = setTimeout(() => doSync({ pull: false }), CHANGE_DEBOUNCE_MS);
  });
}

export function stopGoogleAuto() {
  started = false;
  if (intervalId) clearInterval(intervalId);
  if (unsubStore) unsubStore();
  clearTimeout(debounceId);
  document.removeEventListener('visibilitychange', onVisible);
  window.removeEventListener('focus', onVisible);
}
