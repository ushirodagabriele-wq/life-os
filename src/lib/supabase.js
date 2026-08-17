import { createClient } from '@supabase/supabase-js';

// Public, browser-safe config read from environment variables (see .env.example).
// The publishable key is meant to be public and is protected by Row Level
// Security policies on the database. Never commit your real .env file.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_KEY em um arquivo .env (veja .env.example). A sincronização na nuvem fica desativada até lá.',
  );
}

export const supabase = createClient(SUPABASE_URL || 'http://localhost', SUPABASE_KEY || 'public-anon-key', {
  auth: { persistSession: true, autoRefreshToken: true },
});
