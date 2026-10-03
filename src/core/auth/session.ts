import { useSyncExternalStore } from 'react';
import type { Role, SessionUser } from '../../shared/contract';

/**
 * The session. The token lives only in this module (and in sessionStorage so a reload does not sign
 * the person out): the portals never see it. It expires by itself when the token does.
 */
interface StoredSession {
  token: string;
  user: SessionUser;
  expiresAt: number;
}

const STORAGE_KEY = 'opti.session';

let current: StoredSession | null = readStored();
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

scheduleExpiry();

function readStored(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

function persist(): void {
  try {
    if (current) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // storage may be blocked (private window): the session then lives only until the page is closed
  }
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function scheduleExpiry(): void {
  clearTimeout(expiryTimer);
  if (!current) {
    return;
  }
  const remaining = current.expiresAt - Date.now();
  // setTimeout cannot hold more than 2^31 ms
  expiryTimer = setTimeout(signOut, Math.min(Math.max(remaining, 0), 2_000_000_000));
}

/** Reads the expiry of a JWT (the signature is checked by every service, not here). */
export function expiryOf(token: string): number {
  try {
    const payload = token.split('.')[1] ?? '';
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = (JSON.parse(json) as { exp?: number }).exp;
    return typeof exp === 'number' ? exp * 1000 : Date.now() + 15 * 60_000;
  } catch {
    return Date.now() + 15 * 60_000;
  }
}

export function signIn(token: string, user: SessionUser): void {
  current = { token, user, expiresAt: expiryOf(token) };
  persist();
  scheduleExpiry();
  emit();
}

export function signOut(): void {
  current = null;
  persist();
  scheduleExpiry();
  emit();
}

export function currentToken(): string | null {
  return current?.token ?? null;
}

export function currentUser(): SessionUser | null {
  return current?.user ?? null;
}

export function hasRole(user: SessionUser | null, ...roles: Role[]): boolean {
  return user !== null && roles.includes(user.role);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The signed-in user, or null. Re-renders when the session changes. */
export function useSessionUser(): SessionUser | null {
  return useSyncExternalStore(subscribe, currentUser, currentUser);
}
