// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import {
  Config_SchemaSchema,
  BflooConfig_Schema
} from '../../../src/schemas/config/schema';

describe('[Unit] - Config_SchemaSchema', () => {
  const validUuid = 'c56a4180-65aa-42ec-a945-5fd21dec0538';
  const validSecret = 'a'.repeat(64);
  const validApiKey = `sk_${validUuid}_${validSecret}`;

  const validPostgresqlSchema = {
    dir: 'schemas',
    key: validApiKey,
    engine: 'PostgreSQL' as const,
    envs: {}
  };

  describe('Basic Functionality', () => {
    it('should accept valid PostgreSQL schema config', () => {
      const result = Config_SchemaSchema.safeParse(validPostgresqlSchema);
      expect(result.success).toBe(true);
    });

    it('should accept schema with env-file', () => {
      const result = Config_SchemaSchema.safeParse({
        ...validPostgresqlSchema,
        'env-file': '.env'
      });
      expect(result.success).toBe(true);
    });

    it('should accept schema with environments', () => {
      const result = Config_SchemaSchema.safeParse({
        ...validPostgresqlSchema,
        envs: {
          dev: {
            host: 'localhost',
            port: 5432,
            'db-name': 'mydb',
            user: 'admin',
            password: 'secret'
          }
        }
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject unknown engine', () => {
      const result = Config_SchemaSchema.safeParse({
        ...validPostgresqlSchema,
        engine: 'MySQL'
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const result = Config_SchemaSchema.safeParse({
        engine: 'PostgreSQL'
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - BflooConfig_Schema', () => {
  const validUuid = 'c56a4180-65aa-42ec-a945-5fd21dec0538';
  const validSecret = 'a'.repeat(64);
  const validApiKey = `sk_${validUuid}_${validSecret}`;

  const validConfig = {
    schemas: {
      'my-database': {
        dir: 'schemas',
        key: validApiKey,
        engine: 'PostgreSQL' as const,
        envs: {}
      }
    }
  };

  describe('Basic Functionality', () => {
    it('should accept valid config with single schema', () => {
      const result = BflooConfig_Schema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should accept config with multiple schemas', () => {
      const result = BflooConfig_Schema.safeParse({
        schemas: {
          'db-1': {
            dir: 'schemas/db1',
            key: validApiKey,
            engine: 'PostgreSQL' as const,
            envs: {}
          },
          'db-2': {
            dir: 'schemas/db2',
            key: '${DB2_API_KEY}',
            engine: 'PostgreSQL' as const,
            envs: {}
          }
        }
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty schemas object', () => {
      const result = BflooConfig_Schema.safeParse({ schemas: {} });
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid local key format', () => {
      const result = BflooConfig_Schema.safeParse({
        schemas: {
          'Invalid Key': {
            dir: 'schemas',
            key: validApiKey,
            engine: 'PostgreSQL' as const,
            envs: {}
          }
        }
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing schemas field', () => {
      const result = BflooConfig_Schema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject non-object schemas value', () => {
      const result = BflooConfig_Schema.safeParse({ schemas: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});
