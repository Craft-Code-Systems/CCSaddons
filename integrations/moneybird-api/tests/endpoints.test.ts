// tests/endpoints.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as endpoints from '../src/endpoints';          // ← match your filename exactly
import {
    getApiData,
    postApiData,
    patchApiData,
    makeMoneybirdFunction,
    moneybirdRequest
} from '../src/endpoints';                              // ← same here
import * as ife from '../src/interface';

const dummyId = 'admin123';
const dummyToken = 'tokenABC';
const dummyAuthFields: ife.AuthFields = { administration_id: dummyId, token: dummyToken };

// Reset fetch stubs between each test
beforeEach(() => {
    global.fetch = vi.fn();
});
afterEach(() => {
    vi.resetAllMocks();
});

// Helper to fabricate a Response-like object
function mockResponse(
    status: number,
    statusText: string,
    headers: Record<string, string>,
    body: any
) {
    return {
        ok: status >= 200 && status < 300,
        status,
        statusText,
        headers: {
            get: (name: string) => headers[name.toLowerCase()] || null
        },
        json: () => Promise.resolve(body),
        arrayBuffer: () => Promise.resolve(body),
    } as unknown as Response;
}

describe('getApiData', () => {
    it('returns JSON data when response is ok and isJson=true', async () => {
        const payload = { foo: 'bar' };
        (global.fetch as any).mockResolvedValue(
            mockResponse(200, 'OK', { 'content-type': 'application/json' }, payload)
        );

        const result = await getApiData('endpoint.json', 'a=1', dummyAuthFields, true);
        expect(result).toEqual<ife.funcResponse>({ status: 'OK', data: payload });
        expect(global.fetch).toHaveBeenCalledWith(
            `https://moneybird.com/api/v2/${dummyId}/endpoint.json?a=1`,
            expect.any(Object)
        );
    });

    it('returns arrayBuffer when response is pdf and isJson=false', async () => {
        const buf = new ArrayBuffer(4);
        (global.fetch as any).mockResolvedValue(
            mockResponse(200, 'OK', { 'content-type': 'application/pdf' }, buf)
        );
        const result = await getApiData('file.pdf', '', dummyAuthFields, false);
        expect(result).toEqual<ife.funcResponse>({ status: 'OK', data: buf });
    });

    it('returns error for unexpected content type', async () => {
        (global.fetch as any).mockResolvedValue(
            mockResponse(200, 'OK', { 'content-type': 'text/plain' }, 'xyz')
        );
        const result = await getApiData('file', '', dummyAuthFields, false);
        expect(result.status).toBe('ERROR');
        expect(result.error).toMatch(/Unexpected Content-Type/);
    });

    it('returns error when response not ok', async () => {
        (global.fetch as any).mockResolvedValue(
            mockResponse(404, 'Not Found', { 'content-type': 'application/json' }, {})
        );
        const result = await getApiData('missing.json', '', dummyAuthFields, true);
        expect(result).toEqual<ife.funcResponse>({ status: 'ERROR', error: '404 - Not Found' });
    });

    it('returns error on fetch throw', async () => {
        (global.fetch as any).mockRejectedValue(new Error('network'));
        const result = await getApiData('x', '', dummyAuthFields, true);
        expect(result.status).toBe('ERROR');
        expect(result.error).toContain('network');
    });
});

describe('postApiData', () => {
    it('returns OK with data on 200', async () => {
        const body = { ok: true };
        (global.fetch as any).mockResolvedValue(
            mockResponse(200, 'OK', { 'content-type': 'application/json' }, body)
        );
        const result = await postApiData('ep', { x: 1 }, dummyAuthFields);
        expect(result).toEqual<ife.funcResponse>({ status: 'OK', data: body });
    });

    it('returns ERROR on non-2xx status', async () => {
        (global.fetch as any).mockResolvedValue(
            mockResponse(500, 'Err', {}, {})
        );
        const result = await postApiData('ep', {}, dummyAuthFields);
        expect(result.status).toBe('ERROR');
        expect(result.error).toBe('500 - Err');
    });

    it('returns ERROR on fetch throw', async () => {
        (global.fetch as any).mockRejectedValue('fail');
        const result = await postApiData('ep', {}, dummyAuthFields);
        expect(result.status).toBe('ERROR');
    });
});

describe('patchApiData', () => {
    it('converts bigint and returns OK', async () => {
        const body = { id: 1 };
        (global.fetch as any).mockResolvedValue(
            mockResponse(201, 'Created', { 'content-type': 'application/json' }, body)
        );
        const result = await patchApiData('ep', { foo: BigInt(123) }, dummyAuthFields);
        expect(global.fetch).toHaveBeenCalledWith(
            `https://moneybird.com/api/v2/${dummyId}/ep`,
            expect.objectContaining({
                method: 'PATCH',
                body: JSON.stringify({ foo: '123' })
            })
        );
        expect(result).toEqual<ife.funcResponse>({ status: 'OK', data: body });
    });

    it('returns ERROR on bad status', async () => {
        (global.fetch as any).mockResolvedValue(
            mockResponse(400, 'Bad', {}, {})
        );
        const result = await patchApiData('ep', {}, dummyAuthFields);
        expect(result.status).toBe('ERROR');
    });
});

describe('makeMoneybirdFunction', () => {
    it('routes through moneybirdRequest for GET', async () => {
        const spy = vi.spyOn(endpoints, 'moneybirdRequest')
            .mockResolvedValue({ status: 'OK', data: ['x'] });
        const fn = makeMoneybirdFunction<void, string[]>('get', 'endpoint', true);
        const res = await fn(undefined, dummyAuthFields);
        expect(spy).toHaveBeenCalledWith(
            'get', 'endpoint', dummyAuthFields, { genericFlag: true }
        );
        expect(res).toEqual({ status: 'OK', data: ['x'] });
    });

    it('routes through moneybirdRequest for POST', async () => {
        const spy = vi.spyOn(endpoints, 'moneybirdRequest')
            .mockResolvedValue({ status: 'OK', data: { ok: true } });
        const fn = makeMoneybirdFunction<{ a: number }, { ok: boolean }>('post', 'ep');
        const res = await fn({ a: 5 }, dummyAuthFields);
        expect(spy).toHaveBeenCalledWith(
            'post', 'ep', dummyAuthFields, expect.objectContaining({ body: { a: 5 } })
        );
        expect(res).toEqual({ status: 'OK', data: { ok: true } });
    });

    it('routes through moneybirdRequest for PATCH', async () => {
        const spy = vi.spyOn(endpoints, 'moneybirdRequest')
            .mockResolvedValue({ status: 'OK', data: { patched: true } });
        const fn = makeMoneybirdFunction<{ id: string }, { patched: boolean }>(
            'patch', 'ep/:id'
        );
        const res = await fn({ id: '123' }, dummyAuthFields);
        expect(spy).toHaveBeenCalledWith(
            'patch', 'ep/123', dummyAuthFields,
            expect.objectContaining({ body: { id: '123' }, genericFlag: false })
        );
        expect(res).toEqual({ status: 'OK', data: { patched: true } });
    });
});
