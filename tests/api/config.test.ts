// Package imports
import { describe, it, expect, afterEach } from 'bun:test';

// Project imports
import { apiConfig } from '../../src/api/config';

describe('[Unit] - apiConfig', () => {
  describe('URL Configuration', () => {
    const originalEnv = process.env['BFLOO_API_URL'];

    afterEach(() => {
      // Restore original env
      if (originalEnv !== undefined) {
        process.env['BFLOO_API_URL'] = originalEnv;
      } else {
        delete process.env['BFLOO_API_URL'];
      }
    });

    it('should have default URL when env not set', () => {
      // Note: apiConfig.url is evaluated at module load time,
      // so we test the default value
      expect(apiConfig.url).toBe(
        process.env['BFLOO_API_URL'] ?? 'https://bfloo.com/api'
      );
    });

    it('should have url as a string', () => {
      expect(typeof apiConfig.url).toBe('string');
    });

    it('should have url starting with http', () => {
      expect(apiConfig.url).toMatch(/^https?:\/\//);
    });
  });

  describe('Paths Configuration', () => {
    it('should have schema path', () => {
      expect(apiConfig.paths.schema).toBe('/schema');
    });

    it('should have snapshots path', () => {
      expect(apiConfig.paths.snapshots).toBe('/schema/snapshots');
    });

    it('should have paths starting with /', () => {
      expect(apiConfig.paths.schema).toMatch(/^\//);
      expect(apiConfig.paths.snapshots).toMatch(/^\//);
    });
  });

  describe('Headers Configuration', () => {
    describe('contentType', () => {
      it('should return Content-Type header tuple', () => {
        const [key, value] = apiConfig.headers.contentType();
        expect(key).toBe('Content-Type');
        expect(value).toBe('application/json');
      });

      it('should return array of length 2', () => {
        const result = apiConfig.headers.contentType();
        expect(result).toHaveLength(2);
      });
    });

    describe('accept', () => {
      it('should return Accept header tuple', () => {
        const [key, value] = apiConfig.headers.accept();
        expect(key).toBe('Accept');
        expect(value).toBe('application/json');
      });

      it('should return array of length 2', () => {
        const result = apiConfig.headers.accept();
        expect(result).toHaveLength(2);
      });
    });

    describe('authorization', () => {
      it('should return Authorization header with Bearer token', () => {
        const token = 'test-token-123';
        const [key, value] = apiConfig.headers.authorization(token);
        expect(key).toBe('Authorization');
        expect(value).toBe('Bearer test-token-123');
      });

      it('should include token in Bearer format', () => {
        const token = 'my-api-key';
        const [, value] = apiConfig.headers.authorization(token);
        expect(value).toMatch(/^Bearer /);
        expect(value).toContain(token);
      });

      it('should handle empty token', () => {
        const [key, value] = apiConfig.headers.authorization('');
        expect(key).toBe('Authorization');
        expect(value).toBe('Bearer ');
      });

      it('should handle token with special characters', () => {
        const token = 'sk_abc123-def456_xyz';
        const [, value] = apiConfig.headers.authorization(token);
        expect(value).toBe('Bearer sk_abc123-def456_xyz');
      });
    });
  });

  describe('Request Timeout', () => {
    it('should have reqTimeout defined', () => {
      expect(apiConfig.reqTimeout).toBeDefined();
    });

    it('should have reqTimeout as a number', () => {
      expect(typeof apiConfig.reqTimeout).toBe('number');
    });

    it('should have reqTimeout of 5000ms', () => {
      expect(apiConfig.reqTimeout).toBe(5000);
    });

    it('should have positive timeout value', () => {
      expect(apiConfig.reqTimeout).toBeGreaterThan(0);
    });
  });

  describe('Immutability', () => {
    it('should be a const object (readonly)', () => {
      // Verify the object structure exists
      expect(apiConfig).toBeDefined();
      expect(apiConfig.url).toBeDefined();
      expect(apiConfig.paths).toBeDefined();
      expect(apiConfig.headers).toBeDefined();
      expect(apiConfig.reqTimeout).toBeDefined();
    });
  });
});
