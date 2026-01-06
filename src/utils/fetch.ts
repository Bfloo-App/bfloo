// Project imports
import { CliError } from '$error';
import { DEFAULT_TIMEOUT_MS } from '$constants';

/**
 * ### FetchOptions
 *
 * Options for fetch requests with timeout support.
 *
 * Fields:
 * - `timeoutMs` - Request timeout in milliseconds (optional)
 * - See inherited fields from {@link RequestInit}
 */
export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * ### fetchWithTimeout
 *
 * Performs a fetch request with configurable timeout.
 *
 * Parameters:
 * - `url` - URL to fetch
 * - `options` - Fetch options including timeout (optional) - see {@link FetchOptions}
 *
 * @returns `Promise<Response>` - Fetch response
 *
 * @throws `CliError` - When request times out or network error occurs
 */
export async function fetchWithTimeout(
  url: string | URL,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    return response;
  } catch (err: unknown) {
    // Handle abort (timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new CliError({
        title: 'Request Timed Out',
        message: `Request timed out after ${String(timeoutMs / 1000)} seconds`,
        suggestions: ['Check your network connection or try again later.'],
        cause: err
      });
    }

    // Handle other fetch errors (network failures, DNS, etc.)
    if (err instanceof TypeError) {
      throw new CliError({
        title: 'Network Error',
        message: 'Could not connect to the API',
        suggestions: ['Check your internet connection.'],
        cause: err
      });
    }

    // Re-throw unknown errors
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
