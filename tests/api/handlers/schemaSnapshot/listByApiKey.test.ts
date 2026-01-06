// Package imports
import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';

// Project imports
import { schemaSnapshot_ListByApiKeyHandler } from '../../../../src/api/handlers/schemaSnapshot/listByApiKey';
import { CliError } from '../../../../src/error/CliError';
import * as fetchModule from '../../../../src/utils/fetch';

// Valid API key format for testing
const VALID_API_KEY =
  'sk_a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

// Valid UUIDv4 values for testing (version 4 has '4' at position 13, variant '8/9/a/b' at position 17)
const VALID_SNAPSHOT_UUID_1 = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const VALID_SNAPSHOT_UUID_2 = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
const VALID_SCHEMA_UUID = 'c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f';

// Valid SHA256 hash format: sha256:<64 hex chars>
const VALID_CONTENT_HASH_1 =
  'sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const VALID_CONTENT_HASH_2 =
  'sha256:fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

// Mock snapshot response matching SchemaSnapshot_Schema
const MOCK_SNAPSHOT_RESPONSE = {
  id: VALID_SNAPSHOT_UUID_1,
  schemaId: VALID_SCHEMA_UUID,
  parentId: null,
  label: 'v1.0.0',
  description: 'Initial snapshot',
  engine: 'postgresql',
  engineVersion: 'v15.0',
  engineKey: 'postgresql:v15.0',
  status: 'done',
  contentHash: VALID_CONTENT_HASH_1,
  data: { tables: [] },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

// Second mock snapshot for array testing
const MOCK_SNAPSHOT_RESPONSE_2 = {
  id: VALID_SNAPSHOT_UUID_2,
  schemaId: VALID_SCHEMA_UUID,
  parentId: VALID_SNAPSHOT_UUID_1,
  label: 'v1.1.0',
  description: 'Second snapshot',
  engine: 'postgresql',
  engineVersion: 'v15.0',
  engineKey: 'postgresql:v15.0',
  status: 'done',
  contentHash: VALID_CONTENT_HASH_2,
  data: { tables: [] },
  createdAt: '2024-01-02T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z'
};

describe('[Unit] - schemaSnapshot_ListByApiKeyHandler', () => {
  let fetchWithTimeoutSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    fetchWithTimeoutSpy = spyOn(fetchModule, 'fetchWithTimeout');
  });

  afterEach(() => {
    fetchWithTimeoutSpy.mockRestore();
  });

  describe('Successful Requests', () => {
    it('should return array of snapshots on successful response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve([MOCK_SNAPSHOT_RESPONSE])
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      const result = await schemaSnapshot_ListByApiKeyHandler({
        key: VALID_API_KEY
      });

      expect(result).toBeArray();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(VALID_SNAPSHOT_UUID_1);
      expect(result[0].label).toBe('v1.0.0');
    });

    it('should return empty array when no snapshots exist', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve([])
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      const result = await schemaSnapshot_ListByApiKeyHandler({
        key: VALID_API_KEY
      });

      expect(result).toBeArray();
      expect(result).toHaveLength(0);
    });

    it('should return multiple snapshots', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([MOCK_SNAPSHOT_RESPONSE, MOCK_SNAPSHOT_RESPONSE_2])
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      const result = await schemaSnapshot_ListByApiKeyHandler({
        key: VALID_API_KEY
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(VALID_SNAPSHOT_UUID_1);
      expect(result[1].id).toBe(VALID_SNAPSHOT_UUID_2);
      expect(result[1].parentId).toBe(VALID_SNAPSHOT_UUID_1);
    });

    it('should call fetchWithTimeout with correct URL', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve([MOCK_SNAPSHOT_RESPONSE])
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      await schemaSnapshot_ListByApiKeyHandler({ key: VALID_API_KEY });

      expect(fetchWithTimeoutSpy).toHaveBeenCalled();
      const [url] = fetchWithTimeoutSpy.mock.calls[0] as [URL, RequestInit];
      expect(url.toString()).toContain('/schema/snapshots');
    });

    it('should include Authorization header with Bearer token', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve([MOCK_SNAPSHOT_RESPONSE])
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      await schemaSnapshot_ListByApiKeyHandler({ key: VALID_API_KEY });

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
        json: () => Promise.resolve([MOCK_SNAPSHOT_RESPONSE])
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      await schemaSnapshot_ListByApiKeyHandler({ key: VALID_API_KEY });

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
        json: () => Promise.resolve([MOCK_SNAPSHOT_RESPONSE])
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      await schemaSnapshot_ListByApiKeyHandler({ key: VALID_API_KEY });

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
        json: () => Promise.resolve([MOCK_SNAPSHOT_RESPONSE])
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      const result = await schemaSnapshot_ListByApiKeyHandler({
        key: VALID_API_KEY
      });

      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should handle null description and parentId', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([
            {
              ...MOCK_SNAPSHOT_RESPONSE,
              description: null,
              parentId: null
            }
          ])
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      const result = await schemaSnapshot_ListByApiKeyHandler({
        key: VALID_API_KEY
      });

      expect(result[0].description).toBeNull();
      expect(result[0].parentId).toBeNull();
    });

    it('should handle null data', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([
            {
              ...MOCK_SNAPSHOT_RESPONSE,
              data: null
            }
          ])
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      const result = await schemaSnapshot_ListByApiKeyHandler({
        key: VALID_API_KEY
      });

      expect(result[0].data).toBeNull();
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
        await schemaSnapshot_ListByApiKeyHandler({ key: VALID_API_KEY });
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toContain('401');
      expect(thrownError?.title).toContain('Failed to Fetch Snapshots');
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
        await schemaSnapshot_ListByApiKeyHandler({ key: VALID_API_KEY });
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
        await schemaSnapshot_ListByApiKeyHandler({ key: VALID_API_KEY });
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
        json: () => Promise.resolve([{ invalid: 'data' }]) // Missing required fields
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      let thrownError: CliError | null = null;

      try {
        await schemaSnapshot_ListByApiKeyHandler({ key: VALID_API_KEY });
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toBe('Invalid API Response');
      expect(thrownError?.message).toContain('invalid snapshot data');
    });

    it('should throw CliError when response is not an array', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_SNAPSHOT_RESPONSE) // Object instead of array
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      let thrownError: CliError | null = null;

      try {
        await schemaSnapshot_ListByApiKeyHandler({ key: VALID_API_KEY });
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toBe('Invalid API Response');
    });

    it('should include Zod error as cause for validation failures', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve([{}]) // Empty object - missing all fields
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      let thrownError: CliError | null = null;

      try {
        await schemaSnapshot_ListByApiKeyHandler({ key: VALID_API_KEY });
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
        await schemaSnapshot_ListByApiKeyHandler({ key: VALID_API_KEY });
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
          Promise.resolve([
            {
              ...MOCK_SNAPSHOT_RESPONSE,
              extraField: 'should be ignored'
            }
          ])
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      const result = await schemaSnapshot_ListByApiKeyHandler({
        key: VALID_API_KEY
      });

      expect(result[0].id).toBe(VALID_SNAPSHOT_UUID_1);
      // Extra field should be stripped by Zod validation
    });

    it('should handle different status values', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([
            {
              ...MOCK_SNAPSHOT_RESPONSE,
              status: 'draft'
            }
          ])
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      const result = await schemaSnapshot_ListByApiKeyHandler({
        key: VALID_API_KEY
      });

      expect(result[0].status).toBe('draft');
    });

    it('should handle snapshots with parentId reference', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve([MOCK_SNAPSHOT_RESPONSE_2])
      } as Response;

      fetchWithTimeoutSpy.mockResolvedValue(mockResponse);

      const result = await schemaSnapshot_ListByApiKeyHandler({
        key: VALID_API_KEY
      });

      expect(result[0].parentId).toBe(VALID_SNAPSHOT_UUID_1);
    });
  });
});
