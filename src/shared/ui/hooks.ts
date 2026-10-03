import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isApiError } from '../../core/http/apiClient';
import { toApiErrorInfo } from '../../core/http/errorMessages';
import type { ApiErrorInfo, LoadState, SubmitResult } from '../contract';

function toInfo(error: unknown): ApiErrorInfo {
  return isApiError(error) ? error.info : toApiErrorInfo(0, null, crypto.randomUUID());
}

/**
 * Loads data. Whenever the dependencies change the previous request is aborted, so a slow answer
 * can never replace a newer one (the table would show the wrong filter).
 */
export function useLoad<T>(loader: (signal: AbortSignal) => Promise<T>, deps: readonly unknown[]): {
  state: LoadState<T>;
  reload: () => void;
} {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });
  const [version, setVersion] = useState(0);
  const latest = useRef(loader);
  latest.current = loader;

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    latest.current(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          setState({ status: 'ready', data });
        }
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ status: 'error', error: toInfo(error) });
        }
      },
    );
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { state, reload };
}

export function useDebounced<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}

/**
 * Runs a creation. The Idempotency-Key is created for the first attempt and reused while the same
 * data is retried, and renewed after a success or when the data changes. A second click while a
 * request is pending is ignored.
 */
export function useSubmit<T>(action: (idempotencyKey: string) => Promise<T>, fingerprint: string): SubmitResult<T> {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const inFlight = useRef(false);
  const key = useRef<{ value: string; fingerprint: string } | null>(null);
  const latest = useRef(action);
  latest.current = action;

  const submit = useCallback(async (): Promise<T | undefined> => {
    if (inFlight.current) {
      return undefined;
    }
    if (!key.current || key.current.fingerprint !== fingerprint) {
      key.current = { value: crypto.randomUUID(), fingerprint };
    }
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await latest.current(key.current.value);
      key.current = null;
      return result;
    } catch (failure) {
      setError(toInfo(failure));
      return undefined;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, [fingerprint]);

  const fieldErrors = useMemo(() => {
    const byField: Record<string, string> = {};
    for (const detail of error?.details ?? []) {
      byField[detail.field] ??= detail.message;
    }
    return byField;
  }, [error]);

  const clearError = useCallback(() => setError(null), []);
  return { submit, pending, error, fieldErrors, clearError };
}
