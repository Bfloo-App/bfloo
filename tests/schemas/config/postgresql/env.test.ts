// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import { Config_PostgresqlEnvSchema } from '../../../../src/schemas/config/postgresql/env';

describe('[Unit] - Config_PostgresqlEnvSchema', () => {
  const validEnv = {
    host: 'localhost',
    port: 5432,
    'db-name': 'mydb',
    user: 'postgres',
    password: 'secret'
  };

  describe('Basic Functionality', () => {
    it('should accept valid environment config with required fields', () => {
      const result = Config_PostgresqlEnvSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
    });

    it('should accept environment config with all optional fields', () => {
      const result = Config_PostgresqlEnvSchema.safeParse({
        ...validEnv,
        'env-file': '.env.local',
        'target-schema': 'app_schema',
        'ssl-mode': 'require',
        'connect-timeout': 30
      });
      expect(result.success).toBe(true);
    });

    it('should apply default values for optional fields', () => {
      const result = Config_PostgresqlEnvSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data['target-schema']).toBe('public');
        expect(result.data['ssl-mode']).toBe('prefer');
        expect(result.data['connect-timeout']).toBe(10);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject missing host', () => {
      const { host: _, ...envWithoutHost } = validEnv;
      const result = Config_PostgresqlEnvSchema.safeParse(envWithoutHost);
      expect(result.success).toBe(false);
    });

    it('should reject missing port', () => {
      const { port: _, ...envWithoutPort } = validEnv;
      const result = Config_PostgresqlEnvSchema.safeParse(envWithoutPort);
      expect(result.success).toBe(false);
    });

    it('should reject missing db-name', () => {
      const { 'db-name': _, ...envWithoutDbName } = validEnv;
      const result = Config_PostgresqlEnvSchema.safeParse(envWithoutDbName);
      expect(result.success).toBe(false);
    });

    it('should reject missing user', () => {
      const { user: _, ...envWithoutUser } = validEnv;
      const result = Config_PostgresqlEnvSchema.safeParse(envWithoutUser);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const { password: _, ...envWithoutPassword } = validEnv;
      const result = Config_PostgresqlEnvSchema.safeParse(envWithoutPassword);
      expect(result.success).toBe(false);
    });

    it('should reject invalid port', () => {
      const result = Config_PostgresqlEnvSchema.safeParse({
        ...validEnv,
        port: 70000
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid ssl-mode', () => {
      const result = Config_PostgresqlEnvSchema.safeParse({
        ...validEnv,
        'ssl-mode': 'invalid'
      });
      expect(result.success).toBe(false);
    });
  });
});
