import { useMemo } from 'react';
import { createApiClient } from './http/apiClient';
import { currentToken, hasRole, signIn, signOut, useSessionUser } from './auth/session';
import { gatewayUrl } from './config';
import { useNotify } from './toast';
import type { PublicShellContext, Role, ShellContext } from '../shared/contract';
import { sharedUi } from '../shared/ui';

/** The one API client of the application: created once, it reads the token from the session. */
export const apiClient = createApiClient({
  baseUrl: gatewayUrl(),
  token: currentToken,
  onUnauthorized: signOut,
});

/** What the identity portal receives before there is a session. */
export function usePublicContext(): PublicShellContext {
  const notify = useNotify();
  return useMemo(() => ({ api: apiClient, ui: sharedUi, notify, signIn }), [notify]);
}

/** What every portal receives once the person is signed in. */
export function useShellContext(): ShellContext | null {
  const user = useSessionUser();
  const publicContext = usePublicContext();
  return useMemo(
    () =>
      user
        ? { ...publicContext, user, can: (...roles: Role[]) => hasRole(user, ...roles), signOut }
        : null,
    [publicContext, user],
  );
}
