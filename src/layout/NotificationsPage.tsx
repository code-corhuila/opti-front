import { useState, type ReactNode } from 'react';
import { useShellContext } from '../core/shellContext';
import { listNotifications, markNotificationRead } from './notificationsApi';
import { sharedUi as ui } from '../shared/ui';

/** Paginated inbox over the existing identity-domain notification endpoints. */
export function NotificationsPage(): ReactNode {
  const shell = useShellContext();
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<string | null>(null);
  const { state, reload } = ui.useLoad((signal) => listNotifications(signal, page), [page]);

  async function markRead(id: string): Promise<void> {
    if (pending) return;
    setPending(id);
    try {
      await markNotificationRead(id);
      reload();
      window.dispatchEvent(new Event('opti:notifications-changed'));
    } catch {
      shell?.notify('No se pudo marcar la notificación como leída.', 'error');
    } finally { setPending(null); }
  }

  return <>
    <ui.PageHeader title="Notificaciones" subtitle="Centro de alertas operativas y comerciales."
      actions={<button type="button" className="btn btn-quiet" onClick={reload}>Actualizar</button>} />
    <ui.DataState state={state} onRetry={reload} isEmpty={(result) => result.data.length === 0}
      emptyTitle="No hay notificaciones" emptyHint="Las alertas del sistema aparecerán aquí.">
      {(result) => <>
        <section className="card notification-list" aria-label="Alertas">
          {result.data.map((item) => <article className="notification-row" key={item.id}>
            <span className="notification-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 8a5 5 0 0 1 10 0v4l2 3H3l2-3V8ZM8 17h4" /></svg></span>
            <div><h2>{item.message}</h2><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</time></div>
            {item.read ? <ui.Badge tone="neutral">Leída</ui.Badge> : <button className="btn btn-quiet" type="button" disabled={pending !== null} onClick={() => void markRead(item.id)}>{pending === item.id ? 'Guardando…' : 'Marcar como leída'}</button>}
          </article>)}
        </section>
        <ui.Pager meta={result.meta} onPage={setPage} />
      </>}
    </ui.DataState>
  </>;
}
