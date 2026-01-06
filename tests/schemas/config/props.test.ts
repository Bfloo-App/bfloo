// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import {
  Config_EnvFileProp,
  Config_LocalKeyProp,
  Config_EnvNameProp,
  Config_DirProp,
  Config_ApiKeyProp
} from '../../../src/schemas/config/props';
import { PATHS } from '../../../src/constants';

describe('[Unit] - Config_EnvFileProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid string path', () => {
      const result = Config_EnvFileProp.safeParse('.env');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('.env');
      }
    });

    it('should accept undefined (optional)', () => {
      const result = Config_EnvFileProp.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should accept various path formats', () => {
      const paths = ['.env.local', 'config/.env', '/absolute/path/.env'];
      for (const path of paths) {
        const result = Config_EnvFileProp.safeParse(path);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject non-string values', () => {
      const result = Config_EnvFileProp.safeParse(123);
      expect(result.success).toBe(false);
    });

    it('should accept empty string', () => {
      const result = Config_EnvFileProp.safeParse('');
      expect(result.success).toBe(true);
    });
  });
});

describe('[Unit] - Config_LocalKeyProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid lowercase alphanumeric keys', () => {
      const validKeys = ['my-database', 'db_main', 'schema.v1', 'test123'];
      for (const key of validKeys) {
        const result = Config_LocalKeyProp.safeParse(key);
        expect(result.success).toBe(true);
      }
    });

    it('should trim whitespace', () => {
      const result = Config_LocalKeyProp.safeParse('  my-db  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('my-db');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty string', () => {
      const result = Config_LocalKeyProp.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject strings longer than 64 characters', () => {
      const result = Config_LocalKeyProp.safeParse('a'.repeat(65));
      expect(result.success).toBe(false);
    });

    it('should accept string with exactly 64 characters', () => {
      const result = Config_LocalKeyProp.safeParse('a'.repeat(64));
      expect(result.success).toBe(true);
    });

    it('should reject uppercase characters', () => {
      const result = Config_LocalKeyProp.safeParse('MyDatabase');
      expect(result.success).toBe(false);
    });

    it('should reject special characters not in pattern', () => {
      const invalidKeys = ['my database', 'db@main', 'schema/v1', 'test!'];
      for (const key of invalidKeys) {
        const result = Config_LocalKeyProp.safeParse(key);
        expect(result.success).toBe(false);
      }
    });

    it('should accept all allowed special characters', () => {
      const result = Config_LocalKeyProp.safeParse('my.db-schema_v1');
      expect(result.success).toBe(true);
    });
  });
});

describe('[Unit] - Config_EnvNameProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid environment names', () => {
      const validNames = ['dev', 'staging', 'prod-1', 'test_env'];
      for (const name of validNames) {
        const result = Config_EnvNameProp.safeParse(name);
        expect(result.success).toBe(true);
      }
    });

    it('should trim whitespace', () => {
      const result = Config_EnvNameProp.safeParse('  dev  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('dev');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty string', () => {
      const result = Config_EnvNameProp.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject strings longer than 32 characters', () => {
      const result = Config_EnvNameProp.safeParse('a'.repeat(33));
      expect(result.success).toBe(false);
    });

    it('should accept string with exactly 32 characters', () => {
      const result = Config_EnvNameProp.safeParse('a'.repeat(32));
      expect(result.success).toBe(true);
    });

    it('should reject uppercase characters', () => {
      const result = Config_EnvNameProp.safeParse('Production');
      expect(result.success).toBe(false);
    });

    it('should reject dots (unlike LocalKeyProp)', () => {
      const result = Config_EnvNameProp.safeParse('env.local');
      expect(result.success).toBe(false);
    });

    it('should accept hyphens and underscores', () => {
      const result = Config_EnvNameProp.safeParse('prod-env_1');
      expect(result.success).toBe(true);
    });
  });
});

describe('[Unit] - Config_DirProp', () => {
  describe('Basic Functionality', () => {
    it('should accept custom directory path', () => {
      const result = Config_DirProp.safeParse('custom/path');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('custom/path');
      }
    });

    it('should use default value when undefined', () => {
      const result = Config_DirProp.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(PATHS.defaultSchemaDir);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should accept empty string (overrides default)', () => {
      const result = Config_DirProp.safeParse('');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('');
      }
    });

    it('should reject non-string values', () => {
      const result = Config_DirProp.safeParse(123);
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Config_ApiKeyProp', () => {
  const validUuid = 'c56a4180-65aa-42ec-a945-5fd21dec0538';
  const validSecret = 'a'.repeat(64);
  const validApiKey = `sk_${validUuid}_${validSecret}`;

  describe('Basic Functionality', () => {
    it('should accept valid direct API key', () => {
      const result = Config_ApiKeyProp.safeParse(validApiKey);
      expect(result.success).toBe(true);
    });

    it('should accept environment variable reference', () => {
      const validEnvRefs = ['${MY_API_KEY}', '${API_KEY_123}', '${_KEY}'];
      for (const ref of validEnvRefs) {
        const result = Config_ApiKeyProp.safeParse(ref);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid API key format', () => {
      const result = Config_ApiKeyProp.safeParse('invalid-key');
      expect(result.success).toBe(false);
    });

    it('should reject invalid environment variable reference', () => {
      const invalidRefs = [
        '$MY_KEY',
        '${123KEY}',
        '${MY KEY}',
        '${MY-KEY}',
        'MY_KEY'
      ];
      for (const ref of invalidRefs) {
        const result = Config_ApiKeyProp.safeParse(ref);
        expect(result.success).toBe(false);
      }
    });

    it('should reject empty string', () => {
      const result = Config_ApiKeyProp.safeParse('');
      expect(result.success).toBe(false);
    });
  });
});
