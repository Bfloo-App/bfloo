// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import { SchemaApiKey_Schema } from '../../../src/schemas/schemaApiKey/schema';
import {
  SCHEMAS_API_KEY_PREFIX,
  API_KEY_SECTIONS_SEPARATOR
} from '../../../src/constants';

describe('[Unit] - SchemaApiKey_Schema', () => {
  const validUuid = 'c56a4180-65aa-42ec-a945-5fd21dec0538';
  const validSecret = 'a'.repeat(64);
  const validApiKey = `${SCHEMAS_API_KEY_PREFIX}${API_KEY_SECTIONS_SEPARATOR}${validUuid}${API_KEY_SECTIONS_SEPARATOR}${validSecret}`;

  describe('Basic Functionality', () => {
    it('should accept valid API key', () => {
      const result = SchemaApiKey_Schema.safeParse(validApiKey);
      expect(result.success).toBe(true);
    });

    it('should accept API key with different valid UUID', () => {
      const key = `${SCHEMAS_API_KEY_PREFIX}_550e8400-e29b-41d4-a716-446655440000_${'b'.repeat(64)}`;
      const result = SchemaApiKey_Schema.safeParse(key);
      expect(result.success).toBe(true);
    });
  });

  describe('Format Validation', () => {
    it('should reject key without underscore separators', () => {
      const key = `${SCHEMAS_API_KEY_PREFIX}${validUuid}${validSecret}`;
      const result = SchemaApiKey_Schema.safeParse(key);
      expect(result.success).toBe(false);
    });

    it('should reject key with only 2 parts', () => {
      const key = `${SCHEMAS_API_KEY_PREFIX}_${validUuid}`;
      const result = SchemaApiKey_Schema.safeParse(key);
      expect(result.success).toBe(false);
    });

    it('should reject key with 4 parts', () => {
      const key = `${SCHEMAS_API_KEY_PREFIX}_${validUuid}_${validSecret}_extra`;
      const result = SchemaApiKey_Schema.safeParse(key);
      expect(result.success).toBe(false);
    });
  });

  describe('Prefix Validation', () => {
    it('should reject invalid prefix', () => {
      const key = `pk_${validUuid}_${validSecret}`;
      const result = SchemaApiKey_Schema.safeParse(key);
      expect(result.success).toBe(false);
    });

    it('should reject uppercase prefix', () => {
      const key = `SK_${validUuid}_${validSecret}`;
      const result = SchemaApiKey_Schema.safeParse(key);
      expect(result.success).toBe(false);
    });
  });

  describe('UUID Validation', () => {
    it('should reject invalid UUID', () => {
      const key = `${SCHEMAS_API_KEY_PREFIX}_invalid-uuid_${validSecret}`;
      const result = SchemaApiKey_Schema.safeParse(key);
      expect(result.success).toBe(false);
    });

    it('should reject UUID without hyphens', () => {
      const key = `${SCHEMAS_API_KEY_PREFIX}_123e4567e89b12d3a456426614174000_${validSecret}`;
      const result = SchemaApiKey_Schema.safeParse(key);
      expect(result.success).toBe(false);
    });
  });

  describe('Secret Validation', () => {
    it('should reject secret too short', () => {
      const key = `${SCHEMAS_API_KEY_PREFIX}_${validUuid}_${'a'.repeat(63)}`;
      const result = SchemaApiKey_Schema.safeParse(key);
      expect(result.success).toBe(false);
    });

    it('should reject secret too long', () => {
      const key = `${SCHEMAS_API_KEY_PREFIX}_${validUuid}_${'a'.repeat(65)}`;
      const result = SchemaApiKey_Schema.safeParse(key);
      expect(result.success).toBe(false);
    });

    it('should reject secret with uppercase', () => {
      const key = `${SCHEMAS_API_KEY_PREFIX}_${validUuid}_${'A'.repeat(64)}`;
      const result = SchemaApiKey_Schema.safeParse(key);
      expect(result.success).toBe(false);
    });

    it('should reject secret with non-hex characters', () => {
      const key = `${SCHEMAS_API_KEY_PREFIX}_${validUuid}_${'g'.repeat(64)}`;
      const result = SchemaApiKey_Schema.safeParse(key);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty string', () => {
      const result = SchemaApiKey_Schema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject non-string values', () => {
      const result = SchemaApiKey_Schema.safeParse(123);
      expect(result.success).toBe(false);
    });
  });
});
