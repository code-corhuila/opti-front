import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/** Where the container finds each portal. The container's own web server proxies these paths. */
const portal = (name: string) => ({
  type: 'module' as const,
  name,
  entry: `/remotes/${name}/remoteEntry.js`,
});

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        auth: portal('auth'),
        customers: portal('customers'),
        products: portal('products'),
        sales: portal('sales'),
      },
      // One React for the container and every portal, or hooks break across bundles.
      shared: {
        react: { singleton: true, requiredVersion: '^19.0.0' },
        'react/': { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom/': { singleton: true, requiredVersion: '^19.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^7.0.0' },
        'react-router': { singleton: true, requiredVersion: '^7.0.0' },
      },
      // A portal is downloaded when its route opens: a portal that is down cannot blank the whole app.
      shareStrategy: 'loaded-first',
      dts: false,
    }),
  ],
  build: {
    target: 'esnext',
  },
  server: {
    port: 3000,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});
