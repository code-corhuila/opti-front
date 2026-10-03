import type { ReactNode } from 'react';
import { RemoteView } from '../core/errors/RemoteBoundary';
import { useShellContext } from '../core/shellContext';
import { summaries } from '../remotes/registry';

/**
 * The daily dashboard (HU-12). The container does not know any domain contract: each portal
 * contributes its own summary card, inside its own boundary, so one that is down only blanks its card.
 */
export function HomePage(): ReactNode {
  const shell = useShellContext();
  if (!shell) {
    return null;
  }
  const props = { shell };
  return (
    <>
      <header className="page-header">
        <div>
          <h1>Hola, {shell.user.fullName.split(' ')[0]}</h1>
          <p className="subtitle">Esto es lo que necesita atención hoy.</p>
        </div>
      </header>
      <section className="summary-grid" aria-label="Resumen del día">
        <RemoteView label="Pacientes" load={summaries.customers} props={props} />
        <RemoteView label="Inventario" load={summaries.products} props={props} />
        {shell.can('ADMIN', 'SELLER') ? <RemoteView label="Ventas" load={summaries.sales} props={props} /> : null}
      </section>
    </>
  );
}
