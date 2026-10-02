import { Component, lazy, Suspense, useMemo, useState, type ComponentType, type ErrorInfo, type ReactNode } from 'react';

interface BoundaryProps {
  label: string;
  onRetry: () => void;
  children: ReactNode;
}

/**
 * Contains the failure of one portal: its area shows an error with a retry, and the rest of the
 * application (menu, other portals) keeps working.
 */
class Boundary extends Component<BoundaryProps, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`portal "${this.props.label}" failed`, error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.failed) {
      return this.props.children;
    }
    return (
      <div className="state state-error" role="alert">
        <p className="state-title">{this.props.label} no está disponible</p>
        <p>No pudimos cargar esta sección. El resto de la aplicación sigue funcionando.</p>
        <button
          type="button"
          className="btn"
          onClick={() => {
            this.setState({ failed: false });
            this.props.onRetry();
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }
}

interface RemoteViewProps<P extends object> {
  label: string;
  load: () => Promise<{ default: ComponentType<P> }>;
  props: P;
}

/** Loads a portal on demand inside its own boundary. Retrying downloads it again. */
export function RemoteView<P extends object>({ label, load, props }: RemoteViewProps<P>): ReactNode {
  const [attempt, setAttempt] = useState(0);
  // A new lazy component per attempt: React caches a failed import, so a retry needs a fresh one.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const Remote = useMemo(() => lazy(load), [attempt]);
  return (
    <Boundary key={attempt} label={label} onRetry={() => setAttempt((n) => n + 1)}>
      <Suspense
        fallback={
          <div className="state" role="status" aria-busy="true">
            <div className="spinner" aria-hidden="true" />
            <p>Cargando {label}…</p>
          </div>
        }
      >
        <Remote {...props} />
      </Suspense>
    </Boundary>
  );
}
