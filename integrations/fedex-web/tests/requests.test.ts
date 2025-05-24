import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWithRetry } from '../src/requests';

// 1️⃣ Stub fetch
global.fetch = vi.fn();

// 2️⃣ Stub setTimeout so that all backoffs fire immediately
vi.stubGlobal(
  'setTimeout',
  ((cb: (...args: any[]) => void, ms?: number, ...args: any[]) => {
    cb(...args);
    // return something compatible with NodeJS.Timeout
    return {} as NodeJS.Timeout;
  }) as typeof setTimeout
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetchWithRetry', () => {
  it('returns response on first try if successful', async () => {
    const okResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'application/json' },
      json: async () => ({}),
      text: async () => ''
    };
    (fetch as any).mockResolvedValueOnce(okResponse);

    const res = await fetchWithRetry('https://example.com', { method: 'GET' });
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 with Retry-After header and then succeeds', async () => {
    const rateLimited = {
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      headers: { get: (h: string) => (h === 'Retry-After' ? '1' : null) },
      json: async () => ({}),
      text: async () => ''
    };
    const okResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'application/json' },
      json: async () => ({}),
      text: async () => ''
    };

    (fetch as any)
      .mockResolvedValueOnce(rateLimited)
      .mockResolvedValueOnce(okResponse);

    const res = await fetchWithRetry('https://example.com', {}, 2, 100);
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('retries on network error and then succeeds', async () => {
    (fetch as any)
      .mockRejectedValueOnce(new Error('Network fail'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: () => 'application/json' },
        json: async () => ({}),
        text: async () => ''
      });

    const res = await fetchWithRetry('https://example.com', {}, 2, 100);
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('fails after max retries on repeated network errors', async () => {
    (fetch as any).mockRejectedValue(new Error('Network down'));

    await expect(fetchWithRetry('https://example.com', {}, 3, 10))
      .rejects.toThrow('Request failed after maximum retries');
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('fails on HTTP error (non-429) without hanging', async () => {
    // We override retries to 1 so we only do one iteration (no looping)
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: { get: () => 'text/plain' },
      text: async () => 'Bad request'
    });

    await expect(fetchWithRetry('https://example.com', {}, 1, 0))
      .rejects.toThrow('Request failed after maximum retries');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
