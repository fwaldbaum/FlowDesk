import { lazy, StrictMode, Suspense, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { AuthProvider, RequireAuth } from './auth/AuthContext';
import './index.css';

/** Route-level code splitting: each page downloads only what it needs. */
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));

const LandingPage = page(() => import('./views/LandingPage'), 'LandingPage');
const LoginPage = page(() => import('./views/AuthPages'), 'LoginPage');
const RegisterPage = page(() => import('./views/AuthPages'), 'RegisterPage');
const ForgotPasswordPage = page(() => import('./views/AuthPages'), 'ForgotPasswordPage');
const ResetPasswordPage = page(() => import('./views/AuthPages'), 'ResetPasswordPage');
const VerifyEmailPage = page(() => import('./views/AuthPages'), 'VerifyEmailPage');
const VerifyEmailGate = page(() => import('./views/AuthPages'), 'VerifyEmailGate');
const OnboardingPage = page(() => import('./views/OnboardingPage'), 'OnboardingPage');
const AppRoot = page(() => import('./AppRoot'), 'AppRoot');
// Embedded on customers' websites: kept out of the auth/app bundles on purpose.
const PublicFormPage = page(() => import('./views/PublicFormPage'), 'PublicFormPage');

const blank = <div className="h-full bg-canvas" aria-busy="true" />;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Suspense fallback={blank}>
          <Routes>
            <Route path="/f/:key" element={<PublicFormPage />} />
            <Route
              path="*"
              element={
                <AuthProvider>
                  <Suspense fallback={blank}>
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/registro" element={<RegisterPage />} />
                      <Route path="/olvide" element={<ForgotPasswordPage />} />
                      <Route path="/restablecer" element={<ResetPasswordPage />} />
                      <Route path="/verificar" element={<VerifyEmailPage />} />
                      <Route
                        path="/verifica-tu-correo"
                        element={
                          <RequireAuth step="verify">
                            <VerifyEmailGate />
                          </RequireAuth>
                        }
                      />
                      <Route
                        path="/bienvenida"
                        element={
                          <RequireAuth step="onboarding">
                            <OnboardingPage />
                          </RequireAuth>
                        }
                      />
                      <Route
                        path="/app/*"
                        element={
                          <RequireAuth>
                            <AppRoot />
                          </RequireAuth>
                        }
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </AuthProvider>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
);
