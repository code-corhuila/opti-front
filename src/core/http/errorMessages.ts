import type { ApiErrorInfo, ApiFieldError } from '../../shared/contract';

/**
 * The ONE place that decides which message a person reads for each HTTP state. Business refusals
 * (422) carry a message written for humans by the service; everything technical gets a neutral
 * sentence plus the reference (traceId) that leads to the log line.
 */
export function userMessageFor(status: number, serverMessage: string, traceId: string | null): string {
  const reference = traceId ? ` Referencia: ${traceId}.` : '';
  switch (true) {
    case status === -1:
      return `La solicitud tardó demasiado y se canceló. Intenta de nuevo.${reference}`;
    case status === 0:
      return 'No hay conexión con el servidor. Revisa tu red e intenta de nuevo.';
    case status === 400:
      return 'Revisa los campos marcados: hay datos que no son válidos.';
    case status === 401:
      return 'Tu sesión terminó o no es válida. Ingresa de nuevo.';
    case status === 403:
      return 'No tienes permiso para hacer esto.';
    case status === 404:
      return 'No encontramos lo que buscabas.';
    case status === 422:
      return serverMessage || 'La operación no está permitida en el estado actual.';
    case status === 429:
      return 'Demasiadas solicitudes seguidas. Espera un momento e intenta de nuevo.';
    case status === 503:
      return `Este servicio no está disponible por ahora. Intenta en unos minutos.${reference}`;
    default:
      return `Ocurrió un error inesperado.${reference}`;
  }
}

/** Builds the normalized error from whatever the API answered (the common envelope, or nothing useful). */
export function toApiErrorInfo(status: number, body: unknown, correlationId: string): ApiErrorInfo {
  const envelope = isRecord(body) ? body : {};
  const code = typeof envelope.error === 'string' ? envelope.error : status > 0 ? `HTTP_${status}` : 'NETWORK';
  const message = typeof envelope.message === 'string' ? envelope.message : '';
  const traceId = typeof envelope.traceId === 'string' ? envelope.traceId : correlationId;
  return {
    status,
    code,
    message,
    details: parseDetails(envelope.details),
    traceId,
    userMessage: userMessageFor(status, message, traceId),
  };
}

function parseDetails(details: unknown): ApiFieldError[] {
  if (!Array.isArray(details)) {
    return [];
  }
  return details
    .filter(isRecord)
    .filter((d) => typeof d.field === 'string' && typeof d.message === 'string')
    .map((d) => ({ field: String(d.field), message: String(d.message) }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
