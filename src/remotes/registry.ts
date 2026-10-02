import type { ComponentType } from 'react';
import type { PublicShellContext, Role, ShellContext } from '../shared/contract';

type PortalComponent = ComponentType<{ shell: ShellContext }>;
type LoginComponent = ComponentType<{ shell: PublicShellContext; onSignedIn?: () => void }>;

/**
 * Which portals exist and where they mount. Each loader downloads the portal when its route is
 * opened (the imports are resolved at runtime by Module Federation), so a portal that is down
 * only breaks its own area.
 */
export const portals = {
  auth: () => import('auth/Portal') as Promise<{ default: PortalComponent }>,
  customers: () => import('customers/Portal') as Promise<{ default: PortalComponent }>,
  products: () => import('products/Portal') as Promise<{ default: PortalComponent }>,
  sales: () => import('sales/Portal') as Promise<{ default: PortalComponent }>,
} as const;

export const summaries = {
  customers: () => import('customers/Summary') as Promise<{ default: PortalComponent }>,
  products: () => import('products/Summary') as Promise<{ default: PortalComponent }>,
  sales: () => import('sales/Summary') as Promise<{ default: PortalComponent }>,
} as const;

export const loginPage = () => import('auth/Login') as Promise<{ default: LoginComponent }>;

export type PortalId = keyof typeof portals;

export interface NavItem {
  label: string;
  to: string;
  roles: Role[];
}

/** The menu. A person sees only what their role can use. */
export const navigation: NavItem[] = [
  { label: 'Inicio', to: '/', roles: ['ADMIN', 'SELLER', 'OPTOMETRIST'] },
  { label: 'Pacientes', to: '/customers', roles: ['ADMIN', 'SELLER', 'OPTOMETRIST'] },
  { label: 'Inventario', to: '/products', roles: ['ADMIN', 'SELLER', 'OPTOMETRIST'] },
  { label: 'Ventas', to: '/sales', roles: ['ADMIN', 'SELLER'] },
  { label: 'Usuarios', to: '/auth/users', roles: ['ADMIN'] },
  { label: 'Mi cuenta', to: '/auth/account', roles: ['ADMIN', 'SELLER', 'OPTOMETRIST'] },
];
