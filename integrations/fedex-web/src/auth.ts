import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { setTimeout as sleep } from 'node:timers/promises';
import * as ife from './interface';
  
/**
 * Logs in to FedEx using the provided credentials, and returns the original
 * AUTH plus a `web_client_cookie` property containing the cookies for the
 * current session.
 *
 * @param {ife.auth} AUTH The AUTH object containing the web client credentials
 * @returns {Promise<ife.auth>} The original AUTH object with the added cookies
 */
  export async function getCookie(
    AUTH: ife.auth
  ): Promise<ife.auth> {
    try{
    // detect platform
    const isVercel = !!process.env.VERCEL;
    const platform = process.platform; // 'win32' | 'darwin' | 'linux'
  
    // decide executablePath & args per platform
    let launchOpts: Parameters<typeof puppeteer.launch>[0];
    if (isVercel || platform === 'linux') {
      // Vercel / Linux → use @sparticuz/chromium
      launchOpts = {
        executablePath: await chromium.executablePath(),
        args:           chromium.args,
        defaultViewport: chromium.defaultViewport,
        headless:       chromium.headless
      };
    } else if (platform === 'win32') {
      // Windows dev → point to your installed Chrome
      launchOpts = {
        executablePath:
          process.env.CHROME_PATH_WIN ||
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: ['--no-sandbox','--disable-setuid-sandbox']
      };
    } else if (platform === 'darwin') {
      // macOS dev → point to your installed Chrome
      launchOpts = {
        executablePath:
          process.env.CHROME_PATH_MAC ||
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: true,
        args: ['--no-sandbox','--disable-setuid-sandbox']
      };
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
      // launch browser
  const browser = await puppeteer.launch(launchOpts);

  // grab or open a page
  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  // …the rest of your FedEx login flow stays the same…
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'
  );
  await page.setViewport({ width: 1200, height: 720 });
  await page.goto(
    'https://www.fedex.com/secure-login/nl-nl/#/credentials',
    { waitUntil: 'networkidle2', timeout: 60_000 }
  );
  await sleep(2000);
  await page.type('#username', AUTH.web_client_username);
  await sleep(1000);
  await page.type('#password', AUTH.web_client_password);
  await sleep(2000);
  await Promise.all([
    page.click('#login_button'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  await sleep(1000);
  await page.goto('https://www.fedex.com/online/billing/cbs/summary');
  await sleep(8000);
  try {
    await page.click('text=CONTINUE');
  } catch {
    console.warn('No continue button found');
  }

  // extract cookies
  const cookies = await browser.cookies();
  const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ') || '';

  await browser.close();
  return { ...AUTH, web_client_cookie: cookieString };
}
  catch(e){
    console.error(e);
    throw new Error('Request failed: ' + e);
  }
  }
