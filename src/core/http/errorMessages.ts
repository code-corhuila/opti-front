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
    case status === 409:
    case status === 422:
      return translateServerMessage(serverMessage);
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
    .map((d) => ({ field: String(d.field), message: translateFieldMessage(String(d.message)) }));
}

/** Keep the original English message in ApiErrorInfo.message for diagnostics, never in the UI. */
export function translateServerMessage(message: string): string {
  const sku = /^(?:a|an) (frame|lens|accessory|liquid) with this sku already exists$/i.exec(message);
  if (sku) {
    const product = { frame: 'una montura', lens: 'un lente', accessory: 'un accesorio', liquid: 'un líquido' }[sku[1]!.toLowerCase()];
    return `Ya existe ${product} con este SKU. Usa un código diferente.`;
  }
  const stock = /^insufficient stock: (\d+) available, (\d+) requested$/.exec(message);
  if (stock) return `Stock insuficiente: hay ${stock[1]} unidades disponibles y solicitaste ${stock[2]}.`;
  const balance = /^the payment exceeds the balance of (\d+) cents$/.exec(message);
  if (balance) return 'El pago supera el saldo pendiente de la factura.';
  const limit = /^stock cannot exceed (\d+) units$/.exec(message);
  if (limit) return `El stock no puede superar ${limit[1]} unidades.`;
  if (/^the (frame|lens|accessory|liquid) is not active$/.test(message)) return 'Este producto está inactivo.';
  if (/^the payment gateway declined the charge:/.test(message)) return 'El servicio de pagos rechazó la operación. No se registró el pago; revisa el medio y sus datos.';
  const known: Record<string, string> = {
    'a patient with this document already exists': 'Ya existe un paciente con este documento.',
    'the username is already taken': 'Este nombre de usuario ya está en uso.',
    'you cannot deactivate your own user': 'No puedes desactivar tu propio usuario.',
    'the invoice is void: its order was cancelled': 'La factura está anulada porque su orden fue cancelada.',
    'the invoice is already paid': 'La factura ya está pagada.',
    'an order with payments cannot be cancelled: refund the payments first': 'Esta orden tiene pagos. Debes resolver la devolución antes de cancelarla.',
    'the order cannot be delivered until its invoice is fully paid': 'No puedes entregar la orden hasta que la factura esté completamente pagada.',
    'the order has no invoice': 'La orden no tiene una factura disponible.',
  };
  return known[message] ?? 'La operación no está permitida en el estado actual. Revisa los datos y el estado del registro.';
}

export function translateFieldMessage(message: string): string {
  const between = /^must (?:have |be )between (\d+) and (\d+)( characters)?$/.exec(message);
  if (between) return between[3] ? `Debe tener entre ${between[1]} y ${between[2]} caracteres.` : `Debe estar entre ${between[1]} y ${between[2]}.`;
  const maximum = /^must have at most (\d+) characters$/.exec(message);
  if (maximum) return `Debe tener como máximo ${maximum[1]} caracteres.`;
  const known: Record<string, string> = {
    'is required': 'Este campo es obligatorio.',
    'must be greater than zero': 'Debe ser mayor que cero.',
    'must not be negative': 'No puede ser negativo.',
    'must be a valid email address': 'Ingresa un correo electrónico válido.',
    'must not be in the future': 'La fecha no puede estar en el futuro.',
    'has an invalid value or type': 'El valor o su formato no es válido.',
    'unknown field': 'Este campo no está permitido.',
    'header required, 8 to 128 characters': 'Se requiere una referencia de solicitud de entre 8 y 128 caracteres.',
  };
  return known[message] ?? 'Revisa este valor: no cumple las condiciones del campo.';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
