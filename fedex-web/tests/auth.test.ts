import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCookie } from '../src/auth';
import type { auth } from '../src/interface';

vi.mock('node:timers/promises', () => {
  return {
    setTimeout: vi.fn().mockResolvedValue(undefined)
  };
});


vi.mock('puppeteer-core', () => {
  const pageMock = {
    setUserAgent: vi.fn().mockResolvedValue(undefined),
    setViewport: vi.fn().mockResolvedValue(undefined),
    goto: vi.fn().mockResolvedValue(undefined),
    type: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockResolvedValue(undefined),
    waitForNavigation: vi.fn().mockResolvedValue(undefined)
  };
  
  const browserMock = {
    pages: vi.fn().mockResolvedValue([pageMock]),
    newPage: vi.fn().mockResolvedValue(pageMock),
    cookies: vi.fn().mockResolvedValue([
      { name: 'foo', value: 'bar' },
      { name: 'baz', value: 'qux' }
    ]),
    close: vi.fn().mockResolvedValue(undefined)
  };

  const launch = vi.fn().mockResolvedValue(browserMock);

  return {
    __esModule: true,
    default: {
      launch
    }
  };
});


vi.mock('@sparticuz/chromium', () => {
  return {
    __esModule: true,
    default: {
      executablePath: vi.fn().mockResolvedValue('/usr/bin/chromium'),
      args: ['--no-sandbox'],
      defaultViewport: { width: 1200, height: 720 },
      headless: true
    }
  };
});

describe('getCookie', () => {
  it('should return AUTH with cookies', async () => {
    const AUTH: auth = {
      api_bearer_token: '',
      web_bearer_token: '',
      api_client_id: '',
      api_client_secret: '',
      web_client_id: '',
      web_client_username: 'user',
      web_client_password: 'pass',
      web_client_cookie: '',
      web_account_number: '',
      api_bearer_token_expires_at: 0,
      web_transaction_id: ''
    };

    const result = await getCookie(AUTH);

    expect(result.web_client_cookie).toBe('foo=bar; baz=qux');
  });
});