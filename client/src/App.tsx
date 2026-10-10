import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { RequireAdmin } from './auth/AuthContext';
import { LeadSlideOver } from './components/LeadSlideOver';
import { NewLeadModal } from './components/NewLeadModal';
import { Sidebar } from './components/Sidebar';
import { Toasts } from './components/Toasts';
import { AdminView } from './views/AdminView';
import { BoardView } from './views/BoardView';
import { ContactsView } from './views/ContactsView';
import { SettingsView } from './views/SettingsView';
import { TodayView } from './views/TodayView';
import { ease } from './components/motion';

// The integration guides are long and rarely opened: keep them out of the main app chunk.
const integrations = () => import('./views/integrations/IntegrationsView');
const IntegrationsView = lazy(() => integrations().then((m) => ({ default: m.IntegrationsView })));
const IntegrationGuide = lazy(() => integrations().then((m) => ({ default: m.IntegrationGuide })));

export function App() {
  const location = useLocation();
  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease }}
        className="flex min-w-0 flex-1 flex-col"
      >
        <Suspense fallback={<div className="flex-1" aria-busy="true" />}>
          <Routes location={location}>
            <Route index element={<BoardView />} />
            <Route path="hoy" element={<TodayView />} />
            <Route path="contactos" element={<ContactsView />} />
            <Route path="integraciones" element={<IntegrationsView />} />
            <Route path="integraciones/:id" element={<IntegrationGuide />} />
            <Route path="configuracion" element={<SettingsView />} />
            <Route
              path="admin"
              element={
                <RequireAdmin>
                  <AdminView />
                </RequireAdmin>
              }
            />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </Suspense>
      </motion.main>
      <LeadSlideOver />
      <NewLeadModal />
      <Toasts />
    </div>
  );
}
