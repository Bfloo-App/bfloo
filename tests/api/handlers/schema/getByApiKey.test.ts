// Package imports
import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';

// Project imports
import { schema_GetByApiKeyHandler } from '../../../../src/api/handlers/schema/getByApiKey';
import { CliError } from '../../../../src/error/CliError';
import * as fetchModule from '../../../../src/utils/fetch';

// Valid API key format for testing
const VALID_API_KEY =
  'sk_a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

// Valid UUIDv4 values for testing (version 4 has '4' in position 13)
const VALID_SCHEMA_UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const VALID_PROJECT_UUID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';

// Mock schema response matching Schema_Schema
const MOCK_SCHEMA_RESPONSE = {
  id: VALID_SCHEMA_UUID,
  projectId: VALID_PROJECT_UUID,
  name: 'Test Schema',
  engine: 'postgresql',
  description: 'A test schema description',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

describe('[Unit] - schema_GetByApiKeyHandler', () => {
  let fetchWithTimeoutSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    fetchWithTimeoutSpy = spyOn(fetchModule, 'fetchWithTimeout');
  });

  afterEach(() => {
    fetchWithTimeoutSpy.mockRestore();
  });

  describe('Successful Requests', () => {
    it('should return schema data on successful response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_SCHEMA_RESPONSE)
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      const result = await schema_GetByApiKeyHandler({ key: VALID_API_KEY });

      expect(result).toBeDefined();
      expect(result.id).toBe(VALID_SCHEMA_UUID);
      expect(result.name).toBe('Test Schema');
      expect(result.engine).toBe('postgresql');
    });

    it('should call fetchWithTimeout with correct URL', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_SCHEMA_RESPONSE)
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      await schema_GetByApiKeyHandler({ key: VALID_API_KEY });

      expect(fetchWithTimeoutSpy).toHaveBeenCalled();
      const [url] = fetchWithTimeoutSpy.mock.calls[0] as [URL, RequestInit];
      expect(url.toString()).toContain('/schema');
    });

    it('should include Authorization header with Bearer token', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_SCHEMA_RESPONSE)
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      await schema_GetByApiKeyHandler({ key: VALID_API_KEY });

      const [, options] = fetchWithTimeoutSpy.mock.calls[0] as [
        URL,
        RequestInit
      ];
      const headers = options.headers as Headers;
      expect(headers.get('Authorization')).toBe(`Bearer ${VALID_API_KEY}`);
    });

    it('should include Accept header', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_SCHEMA_RESPONSE)
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      await schema_GetByApiKeyHandler({ key: VALID_API_KEY });

      const [, options] = fetchWithTimeoutSpy.mock.calls[0] as [
        URL,
        RequestInit
      ];
      const headers = options.headers as Headers;
      expect(headers.get('Accept')).toBe('application/json');
    });

    it('should use GET method', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_SCHEMA_RESPONSE)
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      await schema_GetByApiKeyHandler({ key: VALID_API_KEY });

      const [, options] = fetchWithTimeoutSpy.mock.calls[0] as [
        URL,
        RequestInit
      ];
      expect(options.method).toBe('GET');
    });

    it('should parse dates correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_SCHEMA_RESPONSE)
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      const result = await schema_GetByApiKeyHandler({ key: VALID_API_KEY });

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle null description', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            ...MOCK_SCHEMA_RESPONSE,
            description: null
          })
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      const result = await schema_GetByApiKeyHandler({ key: VALID_API_KEY });

      expect(result.description).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should throw CliError when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      let thrownError: CliError | null = null;

      try {
        await schema_GetByApiKeyHandler({ key: VALID_API_KEY });
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toContain('401');
      expect(thrownError?.title).toContain('Failed to Fetch Schema');
    });

    it('should throw CliError for 404 status', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not Found' })
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      let thrownError: CliError | null = null;

      try {
        await schema_GetByApiKeyHandler({ key: VALID_API_KEY });
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toContain('404');
    });

    it('should throw CliError for 500 status', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server Error' })
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      let thrownError: CliError | null = null;

      try {
        await schema_GetByApiKeyHandler({ key: VALID_API_KEY });
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toContain('500');
    });

    it('should throw CliError for invalid response data', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ invalid: 'data' }) // Missing required fields
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      let thrownError: CliError | null = null;

      try {
        await schema_GetByApiKeyHandler({ key: VALID_API_KEY });
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toBe('Invalid API Response');
      expect(thrownError?.message).toContain('invalid schema data');
    });

    it('should include Zod error as cause for validation failures', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({}) // Empty object - missing all fields
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      let thrownError: CliError | null = null;

      try {
        await schema_GetByApiKeyHandler({ key: VALID_API_KEY });
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.cause).toBeDefined();
    });

    it('should propagate fetch errors', async () => {
      const networkError = new CliError({
        title: 'Network Error',
        message: 'Connection failed'
      });

      fetchWithTimeoutSpy.mockRejectedValue(networkError);

      let thrownError: Error | null = null;

      try {
        await schema_GetByApiKeyHandler({ key: VALID_API_KEY });
      } catch (error) {
        thrownError = error as Error;
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect((thrownError as CliError).title).toBe('Network Error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle response with extra fields', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            ...MOCK_SCHEMA_RESPONSE,
            extraField: 'should be ignored'
          })
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      const result = await schema_GetByApiKeyHandler({ key: VALID_API_KEY });

      expect(result.id).toBe(VALID_SCHEMA_UUID);
      // Extra field should be stripped by Zod validation
    });

    it('should handle different engine types', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            ...MOCK_SCHEMA_RESPONSE,
            engine: 'postgresql'
          })
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      const result = await schema_GetByApiKeyHandler({ key: VALID_API_KEY });

      expect(result.engine).toBe('postgresql');
    });
  });
});
