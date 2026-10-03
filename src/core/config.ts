/**
 * Runtime configuration. The container image writes `/config.js` when it starts, so the same build
 * runs in every environment. Only the container knows where the gateway is.
 */
interface RuntimeConfig {
  gatewayUrl: string;
}

declare global {
  interface Window {
    __OPTI_CONFIG__?: Partial<RuntimeConfig>;
  }
}

const DEFAULT_GATEWAY_URL = 'http://localhost:8000';

export function gatewayUrl(): string {
  const configured = window.__OPTI_CONFIG__?.gatewayUrl?.trim();
  return (configured && configured.length > 0 ? configured : DEFAULT_GATEWAY_URL).replace(/\/+$/, '');
}
