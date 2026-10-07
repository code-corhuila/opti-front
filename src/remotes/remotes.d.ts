/**
 * What each portal exposes to the container. The portals are loaded at runtime, so their modules are
 * declared here. (No top-level import: this file must stay an ambient declaration.)
 */
declare module 'auth/Login' {
  const Login: import('react').ComponentType<{
    shell: import('../shared/contract').PublicShellContext;
    onSignedIn?: () => void;
  }>;
  export default Login;
}

declare module 'auth/Portal' {
  const Portal: import('react').ComponentType<{ shell: import('../shared/contract').ShellContext }>;
  export default Portal;
}

declare module 'customers/Portal' {
  const Portal: import('react').ComponentType<{ shell: import('../shared/contract').ShellContext }>;
  export default Portal;
}

declare module 'customers/Summary' {
  const Summary: import('react').ComponentType<{ shell: import('../shared/contract').ShellContext }>;
  export default Summary;
}

declare module 'products/Portal' {
  const Portal: import('react').ComponentType<{ shell: import('../shared/contract').ShellContext }>;
  export default Portal;
}

declare module 'products/Summary' {
  const Summary: import('react').ComponentType<{ shell: import('../shared/contract').ShellContext }>;
  export default Summary;
}

declare module 'sales/Portal' {
  const Portal: import('react').ComponentType<{ shell: import('../shared/contract').ShellContext }>;
  export default Portal;
}

declare module 'sales/Summary' {
  const Summary: import('react').ComponentType<{ shell: import('../shared/contract').ShellContext }>;
  export default Summary;
}
