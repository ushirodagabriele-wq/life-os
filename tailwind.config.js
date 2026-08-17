/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        washi: '#FAFAFA',
        'washi-soft': '#F2F1EC',
        obsidiana: '#0A0A0A',
        'ink-dim': '#5A5A60',
        line: 'rgba(10,10,10,.12)',
        aizome: '#2B5876',
        'aizome-soft': 'rgba(43,88,118,.06)',
        horizonte: '#4E9BB8',
        'horizonte-soft': 'rgba(78,155,184,.10)',
        // status accents
        success: '#2F7D5B',
        warn: '#B9822B',
        danger: '#A6432E',
        // recurring bills (faturas) — a distinct plum, set apart from event types
        fatura: '#7E5A86',
        'fatura-soft': 'rgba(126,90,134,.08)',
        // subject palette — one editorial tone per discipline, shared between the
        // Matérias schedule grid and the calendar (see data/schedule.js).
        'sub-indigo': '#2B5876', 'sub-indigo-soft': 'rgba(43,88,118,.10)',
        'sub-sky': '#3E8EA8', 'sub-sky-soft': 'rgba(62,142,168,.10)',
        'sub-green': '#2F7D5B', 'sub-green-soft': 'rgba(47,125,91,.10)',
        'sub-olive': '#77802E', 'sub-olive-soft': 'rgba(119,128,46,.12)',
        'sub-amber': '#B9822B', 'sub-amber-soft': 'rgba(185,130,43,.12)',
        'sub-terra': '#B5633F', 'sub-terra-soft': 'rgba(181,99,63,.12)',
        'sub-brick': '#A6432E', 'sub-brick-soft': 'rgba(166,67,46,.10)',
        'sub-rose': '#9E4B6B', 'sub-rose-soft': 'rgba(158,75,107,.10)',
        'sub-violet': '#6E4E8E', 'sub-violet-soft': 'rgba(110,78,142,.10)',
        'sub-slate': '#566270', 'sub-slate-soft': 'rgba(86,98,112,.10)',
      },
      fontFamily: {
        heading: ['Syne', 'Century Gothic', 'Futura', 'sans-serif'],
        body: ['DM Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['Space Mono', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        sharp: '2px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(10,10,10,.04)',
      },
    },
  },
  plugins: [],
}
