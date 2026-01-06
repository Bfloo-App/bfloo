// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import { Config_PostgresqlSchemaSchema } from '../../../../src/schemas/config/postgresql/schema';
import { PATHS } from '../../../../src/constants';

describe('[Unit] - Config_PostgresqlSchemaSchema', () => {
  const validUuid = 'c56a4180-65aa-42ec-a945-5fd21dec0538';
  const validSecret = 'a'.repeat(64);
  const validApiKey = `sk_${validUuid}_${validSecret}`;

  const validSchema = {
    key: validApiKey,
    engine: 'PostgreSQL' as const
  };

  describe('Basic Functionality', () => {
    it('should accept valid schema config with minimal fields', () => {
      const result = Config_PostgresqlSchemaSchema.safeParse(validSchema);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const result = Config_PostgresqlSchemaSchema.safeParse(validSchema);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dir).toBe(PATHS.defaultSchemaDir);
        expect(result.data.envs).toEqual({});
      }
    });

    it('should accept schema with custom directory', () => {
      const result = Config_PostgresqlSchemaSchema.safeParse({
        ...validSchema,
        dir: 'custom/schemas'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dir).toBe('custom/schemas');
      }
    });

    it('should accept schema with env-file', () => {
      const result = Config_PostgresqlSchemaSchema.safeParse({
        ...validSchema,
        'env-file': '.env.local'
      });
      expect(result.success).toBe(true);
    });

    it('should accept schema with environments', () => {
      const result = Config_PostgresqlSchemaSchema.safeParse({
        ...validSchema,
        envs: {
          dev: {
            host: 'localhost',
            port: 5432,
            'db-name': 'dev_db',
            user: 'dev_user',
            password: 'dev_pass'
          },
          prod: {
            host: 'prod.db.example.com',
            port: 5432,
            'db-name': 'prod_db',
            user: 'prod_user',
            password: 'prod_pass',
            'ssl-mode': 'require'
          }
        }
      });
      expect(result.success).toBe(true);
    });

    it('should accept API key from environment variable', () => {
      const result = Config_PostgresqlSchemaSchema.safeParse({
        ...validSchema,
        key: '${DB_API_KEY}'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject missing key', () => {
      const schemaWithoutKey = { ...validSchema };
      // @ts-expect-error - intentionally removing required field
      delete schemaWithoutKey.key;
      const result = Config_PostgresqlSchemaSchema.safeParse(schemaWithoutKey);
      expect(result.success).toBe(false);
    });

    it('should reject missing engine', () => {
      const schemaWithoutEngine = { ...validSchema };
      // @ts-expect-error - intentionally removing required field
      delete schemaWithoutEngine.engine;
      const result =
        Config_PostgresqlSchemaSchema.safeParse(schemaWithoutEngine);
      expect(result.success).toBe(false);
    });

    it('should reject invalid API key format', () => {
      const result = Config_PostgresqlSchemaSchema.safeParse({
        ...validSchema,
        key: 'invalid-key'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid environment name', () => {
      const result = Config_PostgresqlSchemaSchema.safeParse({
        ...validSchema,
        envs: {
          'Invalid Env': {
            host: 'localhost',
            port: 5432,
            'db-name': 'mydb',
            user: 'user',
            password: 'pass'
          }
        }
      });
      expect(result.success).toBe(false);
    });

    it('should reject environment with invalid port', () => {
      const result = Config_PostgresqlSchemaSchema.safeParse({
        ...validSchema,
        envs: {
          dev: {
            host: 'localhost',
            port: 99999,
            'db-name': 'mydb',
            user: 'user',
            password: 'pass'
          }
        }
      });
      expect(result.success).toBe(false);
    });
  });
});
