import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type Kind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  kind: Kind;
}

type Notify = (message: string, kind?: Kind) => void;

const NotifyContext = createContext<Notify>(() => undefined);

const VISIBLE_MS = 5000;

/** Short messages that confirm an action. They are announced to screen readers and disappear by themselves. */
export function ToastProvider({ children }: { children: ReactNode }): ReactNode {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);

  const notify = useCallback<Notify>((message, kind = 'info') => {
    const id = next.current++;
    setToasts((all) => [...all.slice(-3), { id, message, kind }]);
    setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), VISIBLE_MS);
  }, []);

  const value = useMemo(() => notify, [notify]);
  return (
    <NotifyContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.kind}`} role="status">
            {toast.message}
          </div>
        ))}
      </div>
    </NotifyContext.Provider>
  );
}

export function useNotify(): Notify {
  return useContext(NotifyContext);
}
