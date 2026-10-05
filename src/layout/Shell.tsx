import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { hasRole, signOut, useSessionUser } from '../core/auth/session';
import { NavIcon } from './NavIcons';
import { navigation } from '../remotes/registry';
import { useLoad } from '../shared/ui/hooks';
import { listNotifications, markNotificationRead, type NotificationItem } from './notificationsApi';

type Theme = 'light' | 'dark';

/** How often the badge refreshes itself while the shell stays open. */
const NOTIFICATIONS_POLL_MS = 45_000;

function currentTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'light' || explicit === 'dark') {
    return explicit;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  SELLER: 'Vendedor',
  OPTOMETRIST: 'Optómetra',
};

/** Navigation and layout shared by every portal: a navy sidebar plus a topbar for the session. */
export function Shell(): ReactNode {
  const user = useSessionUser();
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const [bellOpen, setBellOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const bellRef = useRef<HTMLDivElement>(null);

  const { state, reload } = useLoad((signal) => listNotifications(signal), []);

  useEffect(() => {
    if (state.status === 'ready') {
      setItems(state.data.data);
    }
  }, [state]);

  useEffect(() => {
    const timer = setInterval(reload, NOTIFICATIONS_POLL_MS);
    return () => clearInterval(timer);
  }, [reload]);

  useEffect(() => {
    if (!bellOpen) {
      return;
    }
    function onOutsideClick(event: MouseEvent): void {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [bellOpen]);

  const unreadCount = items.filter((n) => !n.read).length;

  function toggleBell(): void {
    setBellOpen((open) => {
      const next = !open;
      if (next) {
        reload();
      }
      return next;
    });
  }

  async function handleNotificationClick(notification: NotificationItem): Promise<void> {
    if (notification.read) {
      return;
    }
    try {
      const updated = await markNotificationRead(notification.id);
      setItems((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch {
      // the next poll reconciles it; staying unread locally is harmless
    }
  }

  function toggleTheme(): void {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('opti.theme', next);
    } catch {
      // the preference just is not remembered
    }
    setTheme(next);
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <aside className="sidebar">
        <span className="brand">OptiView</span>
        <nav aria-label="Principal" className="menu">
          {navigation
            .filter((item) => hasRole(user, ...item.roles))
            .map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
                <NavIcon to={item.to} />
                {item.label}
              </NavLink>
            ))}
        </nav>
      </aside>
      <header className="topbar">
        <div className="session">
          <div className="bell" ref={bellRef}>
            <button
              type="button"
              className="btn btn-quiet bell-trigger"
              onClick={toggleBell}
              aria-haspopup="true"
              aria-expanded={bellOpen}
              aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 8a5 5 0 0 1 10 0v3.5l1.3 2.2a.9.9 0 0 1-.8 1.3H4.5a.9.9 0 0 1-.8-1.3L5 11.5V8Z" />
                <path d="M8 15.5a2 2 0 0 0 4 0" />
              </svg>
              {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {bellOpen && (
              <div className="notif-dropdown" role="menu" aria-label="Notificaciones">
                <div className="notif-dropdown-header">Notificaciones</div>
                {state.status === 'loading' && items.length === 0 ? (
                  <p className="notif-dropdown-empty">Cargando...</p>
                ) : items.length === 0 ? (
                  <p className="notif-dropdown-empty">No hay notificaciones</p>
                ) : (
                  <ul className="notif-dropdown-list">
                    {items.map((notification) => (
                      <li key={notification.id}>
                        <button
                          type="button"
                          className={`notif-item${notification.read ? '' : ' notif-item-unread'}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <span className="notif-item-dot" aria-hidden="true" />
                          <span className="notif-item-message">{notification.message}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <a
                  className="notif-dropdown-footer"
                  href="#"
                  onClick={(event) => event.preventDefault()}
                >
                  Ver todas
                </a>
              </div>
            )}
          </div>
          <span className="who">
            {user?.fullName}
            <small>{user ? ROLE_LABEL[user.role] ?? user.role : ''}</small>
          </span>
          <button type="button" className="btn btn-quiet" onClick={toggleTheme} aria-label="Cambiar entre tema claro y oscuro">
            {theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
          </button>
          <button type="button" className="btn btn-quiet" onClick={signOut}>
            Salir
          </button>
        </div>
      </header>
      <main id="main" className="content">
        <Outlet />
      </main>
    </div>
  );
}
