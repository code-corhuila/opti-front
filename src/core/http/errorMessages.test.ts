import { describe, expect, it } from 'vitest';
import { toApiErrorInfo, translateServerMessage, translateFieldMessage } from './errorMessages';

describe('Spanish API errors', () => {
  it.each(['frame', 'lens', 'accessory', 'liquid'])('translates duplicate SKU for %s', (product) => {
    expect(translateServerMessage(`${product === 'accessory' ? 'an' : 'a'} ${product} with this sku already exists`)).toContain('SKU');
    expect(translateServerMessage(`${product === 'accessory' ? 'an' : 'a'} ${product} with this sku already exists`)).not.toContain('already exists');
  });
  it('preserves diagnostic text and translates field messages', () => {
    const info = toApiErrorInfo(422, { message: 'the invoice is already paid', details: [{ field: 'amountCents', message: 'must be greater than zero' }] }, 'trace');
    expect(info.message).toBe('the invoice is already paid');
    expect(info.userMessage).toBe('La factura ya está pagada.');
    expect(info.details[0]?.message).toBe('Debe ser mayor que cero.');
  });
  it('uses safe Spanish fallbacks for new messages', () => {
    expect(translateServerMessage('unknown future business rule')).toMatch(/^La operación/);
    expect(translateFieldMessage('new validation rule')).toMatch(/^Revisa/);
  });
  it('translates numeric stock and field constraints', () => {
    expect(translateServerMessage('insufficient stock: 2 available, 4 requested')).toContain('2 unidades');
    expect(translateFieldMessage('must have between 1 and 80 characters')).toContain('1 y 80 caracteres');
  });
});
