import type { ApiClient, ApiErrorInfo, RequestOptions } from '../../shared/contract';
import { toApiErrorInfo } from './errorMessages';

/** Maximum time a request may take before it is cancelled: 10 seconds. */
export const REQUEST_TIMEOUT_MS = 10_000;

/** The normalized failure of a call. Thrown by the client; the portals show `info.userMessage`. */
export class ApiError extends Error {
  readonly info: ApiErrorInfo;

  constructor(info: ApiErrorInfo) {
    super(info.userMessage);
    this.name = 'ApiError';
    this.info = info;
  }
}

interface ClientDependencies {
  baseUrl: string;
  token: () => string | null;
  onUnauthorized: () => void;
  fetcher?: typeof fetch;
  newId?: () => string;
}

/**
 * The only HTTP client of the whole interface. It adds the credential, a new correlation id per
 * request, a time limit, and turns every failure into an {@link ApiError}. A 401 closes the session.
 */
export function createApiClient({
  baseUrl,
  token,
  onUnauthorized,
  fetcher = (...args) => fetch(...args),
  newId = () => crypto.randomUUID(),
}: ClientDependencies): ApiClient {
  async function request<T>(method: string, path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    const correlationId = newId();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Correlation-Id': correlationId,
    };
    const credential = token();
    if (credential) {
      headers.Authorization = `Bearer ${credential}`;
    }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
    const cancelled = options.signal ? anySignal([timeout.signal, options.signal]) : timeout.signal;

    let response: Response;
    try {
      response = await fetcher(baseUrl + withQuery(path, options.query), {
        method,
        headers,
        body: body === undefined ? null : JSON.stringify(body),
        signal: cancelled,
      });
    } catch (error) {
      if (options.signal?.aborted) {
        throw error; // the caller cancelled on purpose (a newer request replaced this one)
      }
      const status = timeout.signal.aborted ? -1 : 0;
      throw new ApiError(toApiErrorInfo(status, null, correlationId));
    } finally {
      clearTimeout(timer);
    }

    const payload = await readBody(response);
    if (response.ok) {
      return payload as T;
    }
    if (response.status === 401 && token()) {
      onUnauthorized();
    }
    throw new ApiError(toApiErrorInfo(response.status, payload, response.headers.get('X-Correlation-Id') ?? correlationId));
  }

  return {
    get: (path, options) => request('GET', path, undefined, options),
    post: (path, body, options) => request('POST', path, body ?? {}, options),
    put: (path, body, options) => request('PUT', path, body ?? {}, options),
  };
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function withQuery(path: string, query: RequestOptions['query']): string {
  if (!query) {
    return path;
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return controller.signal;
}
