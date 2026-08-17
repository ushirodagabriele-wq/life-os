// Google Calendar REST calls + mapping between Life OS events and Google events.
import { addDays } from './date';

const BASE = 'https://www.googleapis.com/calendar/v3';
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';

// Recognized video-meeting URL hosts (Meet, Teams, Zoom, Whereby, Webex, Jitsi…).
const MEET_URL =
  /(https?:\/\/[^\s<>"']*(?:meet\.google\.com|teams\.microsoft\.com|teams\.live\.com|zoom\.us|whereby\.com|webex\.com|meet\.jit\.si|hangouts\.google\.com)[^\s<>"']*)/i;

function firstMeetingUrl(str) {
  const m = (str || '').match(MEET_URL);
  return m ? m[1] : '';
}

function looksLikeLink(str) {
  return /^(https?:\/\/|www\.)/i.test((str || '').trim());
}

// Life OS event -> Google event body.
export function toGoogleEvent(ev) {
  // Keep the physical address in `location`; if the event is online-only, put
  // the meeting link there so Google shows something. When both exist, the link
  // rides along in the description so neither is lost on push.
  const location = ev.location || ev.meetingLink || undefined;
  let description = ev.note || undefined;
  if (ev.meetingLink && ev.location) {
    description = `${ev.meetingLink}${description ? `\n${description}` : ''}`;
  }
  const g = {
    summary: ev.title || '(sem título)',
    location,
    description,
  };
  if (ev.time) {
    const end = ev.endTime || ev.time;
    g.start = { dateTime: `${ev.date}T${ev.time}:00`, timeZone: TZ };
    g.end = { dateTime: `${ev.date}T${end}:00`, timeZone: TZ };
  } else {
    // All-day: Google's end.date is exclusive (next day).
    g.start = { date: ev.date };
    g.end = { date: addDays(ev.date, 1) };
  }
  // Ask Google to spin up a real Meet room for this event.
  if (ev.wantsMeet && !ev.meetingLink) {
    g.conferenceData = {
      createRequest: {
        requestId: `lifeos-${ev.id || Math.random().toString(36).slice(2)}-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }
  return g;
}

// Pull the video-conference link (Google Meet, or any conferencing solution)
// out of a Google event. Meet links live in hangoutLink / conferenceData —
// NOT in the location field.
export function meetingLinkFromGoogle(g) {
  // 1) Native Google Meet link.
  if (g.hangoutLink) return g.hangoutLink;
  // 2) Any conferencing solution attached to the event (video entry point).
  const eps = g.conferenceData?.entryPoints || [];
  const video = eps.find((e) => e.entryPointType === 'video' && e.uri);
  if (video) return video.uri;
  // 3) Fallback: a meeting URL pasted into the location or the description
  //    (older Meet events, or Teams/Zoom links added by hand).
  return firstMeetingUrl(g.location) || firstMeetingUrl(g.description) || '';
}

// Google event -> Life OS event fields (for pulling into the app).
export function fromGoogleEvent(g) {
  const timed = !!g.start?.dateTime;
  const startRaw = g.start?.dateTime || g.start?.date || '';
  const endRaw = g.end?.dateTime || '';
  const meetingLink = meetingLinkFromGoogle(g);
  // `location` holds the PHYSICAL address only. If Google's location field is
  // itself the meeting URL (online-only event), don't repeat it as an address.
  const physical =
    g.location && g.location !== meetingLink && !looksLikeLink(g.location) ? g.location : '';

  return {
    title: g.summary || '(sem título)',
    date: startRaw.slice(0, 10),
    time: timed ? startRaw.slice(11, 16) : '',
    endTime: timed && endRaw ? endRaw.slice(11, 16) : '',
    location: physical,
    meetingLink,
    note: g.description || '',
    type: 'pessoal',
    category: 'compromisso',
    recurrence: 'none',
    doneDates: [],
    gcalId: g.id,
    fromGoogle: true,
  };
}

export async function listEvents(token, timeMin, timeMax) {
  const params = new URLSearchParams({
    timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: '250',
  });
  const r = await fetch(`${BASE}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Google Agenda respondeu ${r.status}`);
  const data = await r.json();
  return (data.items || []).filter((e) => e.status !== 'cancelled' && (e.start?.dateTime || e.start?.date));
}

export async function createEvent(token, ev) {
  const body = toGoogleEvent(ev);
  // conferenceDataVersion=1 is required whenever we send conferenceData.
  const qs = body.conferenceData ? '?conferenceDataVersion=1' : '';
  const r = await fetch(`${BASE}/calendars/primary/events${qs}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Falha ao criar no Google (${r.status})`);
  return r.json();
}
