import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { RequireAuth } from '../core/auth/RequireAuth';
import { useSessionUser } from '../core/auth/session';
import { RemoteView } from '../core/errors/RemoteBoundary';
import { usePublicContext, useShellContext } from '../core/shellContext';
import { HomePage } from '../layout/HomePage';
import { NotFound } from '../layout/NotFound';
import { Shell } from '../layout/Shell';
import { loginPage, portals, type PortalId } from '../remotes/registry';

/** Only paths inside the application are accepted after signing in (no open redirect). */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/login') ? raw : '/';
}

/** The sign-in page belongs to the identity portal; the container only mounts it and keeps the session. */
function LoginRoute(): ReactNode {
  const user = useSessionUser();
  const shell = usePublicContext();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  if (user) {
    return <Navigate to={next} replace />;
  }
  return (
    <main className="login-page">
      <RemoteView label="Inicio de sesión" load={loginPage} props={{ shell, onSignedIn: () => navigate(next, { replace: true }) }} />
    </main>
  );
}

function PortalRoute({ id, label }: { id: PortalId; label: string }): ReactNode {
  const shell = useShellContext();
  if (!shell) {
    return null;
  }
  return <RemoteView label={label} load={portals[id]} props={{ shell }} />;
}

export function App(): ReactNode {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="customers/*" element={<PortalRoute id="customers" label="Pacientes" />} />
        <Route path="products/*" element={<PortalRoute id="products" label="Inventario" />} />
        <Route path="sales/*" element={<PortalRoute id="sales" label="Ventas" />} />
        <Route path="auth/*" element={<PortalRoute id="auth" label="Usuarios y cuenta" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
