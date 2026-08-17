import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { useStore } from './store/useStore';
import { startGoogleAuto, stopGoogleAuto } from './store/googleSync';

import Home from './pages/Home';
import CalendarPage from './pages/CalendarPage';
import Checklist from './pages/Checklist';
import Goals from './pages/Goals';
import Courses from './pages/Courses';
import Processes from './pages/Processes';
import Academic from './pages/Academic';
import FreeStudies from './pages/FreeStudies';
import LibraryPage from './pages/LibraryPage';
import Media from './pages/Media';
import Finances from './pages/Finances';
import Emails from './pages/Emails';
import Subjects from './pages/Subjects';
import Radar from './pages/Radar';
import Events from './pages/Events';
import Timeline from './pages/Timeline';

export default function App() {
  const runDailyMaintenance = useStore((s) => s.runDailyMaintenance);
  const healData = useStore((s) => s.healData);
  const clearDemoData = useStore((s) => s.clearDemoData);

  // On boot: remove leftover demo data (once), heal legacy rows, then run the
  // intelligence pass: rollover + regenerate suggestions.
  useEffect(() => {
    clearDemoData();
    healData();
    runDailyMaintenance();
    // Re-establish Google connections silently and keep them syncing in the
    // background — no manual reconnect/sync on return visits.
    startGoogleAuto();
    const onFocus = () => runDailyMaintenance();
    window.addEventListener('focus', onFocus);
    return () => { window.removeEventListener('focus', onFocus); stopGoogleAuto(); };
  }, [runDailyMaintenance, healData, clearDemoData]);

  const location = useLocation();

  return (
    <Layout>
      <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/emails" element={<Emails />} />
        <Route path="/radar" element={<Radar />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/cronograma" element={<Timeline />} />
        <Route path="/checklist" element={<Checklist />} />
        <Route path="/metas" element={<Goals />} />
        <Route path="/cursos" element={<Courses />} />
        <Route path="/processos" element={<Processes />} />
        <Route path="/academico" element={<Academic />} />
        <Route path="/materias" element={<Subjects />} />
        <Route path="/estudos" element={<FreeStudies />} />
        <Route path="/biblioteca" element={<LibraryPage />} />
        <Route path="/midia" element={<Media />} />
        <Route path="/financas" element={<Finances />} />
        <Route path="/eventos" element={<Events />} />
      </Routes>
      </ErrorBoundary>
    </Layout>
  );
}
