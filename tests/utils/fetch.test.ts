// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import { fetchWithTimeout } from '../../src/utils/fetch';
import { CliError, ErrorCode } from '../../src/error';

describe('[Unit] - fetchWithTimeout', () => {
  describe('Basic Functionality', () => {
    it('should return response for successful request', async () => {
      const response = await fetchWithTimeout('https://httpbin.org/get');
      expect(response).toBeInstanceOf(Response);
      expect(response.ok).toBe(true);
    });

    it('should pass through fetch options', async () => {
      const response = await fetchWithTimeout('https://httpbin.org/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });
      expect(response.ok).toBe(true);
    });

    it('should accept URL object', async () => {
      const url = new URL('https://httpbin.org/get');
      const response = await fetchWithTimeout(url);
      expect(response).toBeInstanceOf(Response);
    });
  });

  describe('Timeout Handling', () => {
    it('should throw CliError on timeout', async () => {
      // Use a very short timeout with a slow endpoint
      try {
        await fetchWithTimeout('https://httpbin.org/delay/10', {
          timeoutMs: 100
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(CliError);
        expect((error as CliError).title).toBe('Request Timed Out');
      }
    });

    it('should include timeout duration in error message', async () => {
      try {
        await fetchWithTimeout('https://httpbin.org/delay/10', {
          timeoutMs: 500
        });
        expect(true).toBe(false);
      } catch (error) {
        expect((error as CliError).message).toContain('0.5');
      }
    });

    it('should use default timeout if not specified', async () => {
      // This test verifies default timeout is used (should not timeout for fast endpoints)
      const response = await fetchWithTimeout('https://httpbin.org/get');
      expect(response.ok).toBe(true);
    });
  });

  describe('Network Error Handling', () => {
    it('should throw CliError for invalid URL', async () => {
      try {
        await fetchWithTimeout('http://invalid.invalid.invalid');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(CliError);
        expect((error as CliError).title).toBe('Network Error');
      }
    });

    it('should include suggestions in network error', async () => {
      try {
        await fetchWithTimeout('http://invalid.invalid.invalid');
        expect(true).toBe(false);
      } catch (error) {
        expect((error as CliError).suggestions).toBeDefined();
        expect((error as CliError).suggestions?.length).toBeGreaterThan(0);
      }
    });

    it('should include NETWORK_ERROR code in network error', async () => {
      try {
        await fetchWithTimeout('http://invalid.invalid.invalid');
        expect(true).toBe(false);
      } catch (error) {
        expect((error as CliError).code).toBe(ErrorCode.NETWORK_ERROR);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options object', async () => {
      const response = await fetchWithTimeout('https://httpbin.org/get', {});
      expect(response.ok).toBe(true);
    });

    it('should handle custom headers', async () => {
      const response = await fetchWithTimeout('https://httpbin.org/headers', {
        headers: {
          'X-Custom-Header': 'test-value'
        }
      });
      expect(response.ok).toBe(true);
      const data = (await response.json()) as {
        headers: Record<string, string>;
      };
      expect(data.headers['X-Custom-Header']).toBe('test-value');
    });

    it('should handle HTTP error responses without throwing', async () => {
      // fetchWithTimeout should return the response even for 4xx/5xx
      const response = await fetchWithTimeout('https://httpbin.org/status/404');
      expect(response.status).toBe(404);
      expect(response.ok).toBe(false);
    });

    it('should handle redirect responses', async () => {
      const response = await fetchWithTimeout('https://httpbin.org/redirect/1');
      expect(response.ok).toBe(true);
    });
  });
});
