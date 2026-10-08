import { Navigate, Route, Routes } from 'react-router-dom';
import { LeadSlideOver } from './components/LeadSlideOver';
import { NewLeadModal } from './components/NewLeadModal';
import { Sidebar } from './components/Sidebar';
import { Toasts } from './components/Toasts';
import { BoardView } from './views/BoardView';
import { ContactsView } from './views/ContactsView';
import { SettingsView } from './views/SettingsView';

export function App() {
  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <Routes>
          <Route path="/" element={<BoardView />} />
          <Route path="/contactos" element={<ContactsView />} />
          <Route path="/configuracion" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <LeadSlideOver />
      <NewLeadModal />
      <Toasts />
    </div>
  );
}
