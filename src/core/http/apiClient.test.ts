import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from './apiClient';

describe('authenticated document downloads', () => {
  it('returns binary content and retains authentication and correlation headers', async () => {
    const fetcher = vi.fn(async () => new Response('%PDF-1.4\n% PRUEBA', { headers: { 'Content-Type': 'application/pdf' } }));
    const client = createApiClient({ baseUrl: 'https://test.invalid', token: () => 'FICTITIOUS_TEST_TOKEN', onUnauthorized: vi.fn(), fetcher, newId: () => 'test-correlation' });
    const blob = await client.get<Blob>('/api/v1/invoices/test/pdf', { responseType: 'blob' });
    expect(blob.type).toBe('application/pdf');
    expect(await blob.text()).toContain('%PDF-1.4');
    expect(fetcher).toHaveBeenCalledWith('https://test.invalid/api/v1/invoices/test/pdf', expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer FICTITIOUS_TEST_TOKEN', 'X-Correlation-Id': 'test-correlation' }) }));
  });
  it('keeps JSON validation details for a failed binary request', async () => {
    const client = createApiClient({ baseUrl: '', token: () => null, onUnauthorized: vi.fn(), fetcher: async () => new Response(JSON.stringify({ error: 'VALIDATION_ERROR', details: [{ field: 'receipt', message: 'Adjunta un comprobante de prueba.' }] }), { status: 400 }), newId: () => 'test' });
    await expect(client.get('/test', { responseType: 'blob' })).rejects.toMatchObject({ info: { status: 400, details: [{ field: 'receipt', message: 'Adjunta un comprobante de prueba.' }] } });
  });
  it('expires the session on a rejected document request', async () => {
    const onUnauthorized = vi.fn();
    const client = createApiClient({ baseUrl: '', token: () => 'FICTITIOUS_TEST_TOKEN', onUnauthorized, fetcher: async () => new Response('{}', { status: 401 }), newId: () => 'test' });
    await expect(client.get('/test', { responseType: 'blob' })).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
