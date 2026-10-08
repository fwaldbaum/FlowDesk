import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { App } from './App';
import { AuthProvider, RequireAuth } from './auth/AuthContext';
import { AppStoreProvider } from './store/AppStore';
import { LandingPage } from './views/LandingPage';
import { LoginPage, RegisterPage } from './views/AuthPages';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route
            path="/app/*"
            element={
              <RequireAuth>
                <AppStoreProvider>
                  <App />
                </AppStoreProvider>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
