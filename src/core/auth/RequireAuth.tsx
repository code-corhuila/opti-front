import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSessionUser } from './session';

/** Sends a person without a session to sign in, and brings them back to the page they asked for. */
export function RequireAuth({ children }: { children: ReactNode }): ReactNode {
  const user = useSessionUser();
  const location = useLocation();
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}

/** Only the given roles may see the children; the others get a clear explanation, not a blank page. */
export function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }): ReactNode {
  const user = useSessionUser();
  if (user && roles.includes(user.role)) {
    return children;
  }
  return (
    <div className="state state-error" role="alert">
      <p className="state-title">Sin permiso</p>
      <p>Tu rol no puede ver esta sección.</p>
    </div>
  );
}
