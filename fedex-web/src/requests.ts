// import * as ife from './interface';


/**
 * Performs a fetch request with retry logic, including exponential backoff
 * and handling of rate limiting (HTTP 429 status).
 *
 * @param url - The URL to fetch. Can be a string, URL object, or Request object.
 * @param options - The fetch options, such as method, headers, etc.
 * @param retries - The maximum number of retries before failing. Defaults to 5.
 * @param backoff - The initial backoff time in milliseconds for retry delays. Defaults to 3000 ms.
 * @returns {Promise<Response>} - A promise that resolves to the fetch response if successful,
 *                                or rejects with an error after all retries have been exhausted.
 * @throws {Error} - Throws an error if the request fails after the maximum number of retries.
 */

export async function fetchWithRetry(
    url: string | URL | Request,
    options: RequestInit | undefined,
    retries: number = 5,
    backoff: number = 3000
  ): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return response;
        }
  
        if (response.status === 429) {
          // Handle rate limiting
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter
            ? parseInt(retryAfter) * 1000
            : backoff * Math.pow(2, i); // Exponential backoff
          console.warn(`Rate limited. Retrying after ${waitTime} ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          const errorText = await response.text();
          console.error(`Request failed with status ${response.status}: ${errorText} at URL: ${url} and options: ${JSON.stringify(options)}`);
          throw new Error(`Request failed: ${response.statusText}`);
        }
      } catch (error: any) {
        if (i === retries - 1) {
          console.error("Max retries reached:", error);
          throw new Error("Request failed after maximum retries");
        }
        console.warn(`Attempt ${i + 1} failed with error: ${error.message}. Retrying...`);
        await new Promise((resolve) => setTimeout(resolve, backoff * Math.pow(2, i))); // Exponential backoff
      }
    }
    console.error('Max retries reached. Request failed.');
    throw new Error('Max retries reached. Request failed.');
  }