import { useState, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { hasRole, signOut, useSessionUser } from '../core/auth/session';
import { navigation } from '../remotes/registry';

type Theme = 'light' | 'dark';

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

/** Navigation and layout shared by every portal. */
export function Shell(): ReactNode {
  const user = useSessionUser();
  const [theme, setTheme] = useState<Theme>(currentTheme);

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
      <header className="topbar">
        <span className="brand">OptiView</span>
        <nav aria-label="Principal" className="menu">
          {navigation
            .filter((item) => hasRole(user, ...item.roles))
            .map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="session">
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
