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

/**
 * Loads a portal on demand inside its own boundary. Retrying downloads it again.
 *
 * `load` must be in both the memo's deps and the boundary's key: `PortalRoute` renders this same
 * component at the same position in the tree for every portal (only `label`/`load`/`props`
 * change), so switching portals directly - Pacientes to Ventas, no stop at Inicio in between -
 * never unmounts it. Without `load` here the memo kept the previous portal's lazy component
 * forever; without it in the key, a Boundary that had already failed for one portal stayed
 * failed for the next one too.
 */
export function RemoteView<P extends object>({ label, load, props }: RemoteViewProps<P>): ReactNode {
  const [attempt, setAttempt] = useState(0);
  const Remote = useMemo(() => lazy(load), [load, attempt]);
  return (
    <Boundary key={`${label}:${attempt}`} label={label} onRetry={() => setAttempt((n) => n + 1)}>
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
