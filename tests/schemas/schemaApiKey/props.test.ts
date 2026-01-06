// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import {
  SchemaApiKey_PrefixProp,
  SchemaApiKey_IdProp,
  SchemaApiKey_SecretProp
} from '../../../src/schemas/schemaApiKey/props';
import {
  SCHEMAS_API_KEY_PREFIX,
  SCHEMA_API_KEY_SECRET_LENGTH
} from '../../../src/constants';

describe('[Unit] - SchemaApiKey_PrefixProp', () => {
  describe('Basic Functionality', () => {
    it('should accept the schema API key prefix', () => {
      const result = SchemaApiKey_PrefixProp.safeParse(SCHEMAS_API_KEY_PREFIX);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject different prefix', () => {
      const result = SchemaApiKey_PrefixProp.safeParse('pk');
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = SchemaApiKey_PrefixProp.safeParse('');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - SchemaApiKey_IdProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid UUIDv4', () => {
      const result = SchemaApiKey_IdProp.safeParse(
        'c56a4180-65aa-42ec-a945-5fd21dec0538'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid UUID format', () => {
      const result = SchemaApiKey_IdProp.safeParse('invalid-uuid');
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = SchemaApiKey_IdProp.safeParse('');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - SchemaApiKey_SecretProp', () => {
  const validSecret = 'a'.repeat(SCHEMA_API_KEY_SECRET_LENGTH);

  describe('Basic Functionality', () => {
    it('should accept valid 64-character hex secret', () => {
      const result = SchemaApiKey_SecretProp.safeParse(validSecret);
      expect(result.success).toBe(true);
    });

    it('should accept all hex characters', () => {
      const result = SchemaApiKey_SecretProp.safeParse(
        '0123456789abcdef'.repeat(4)
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject secret shorter than 64 characters', () => {
      const result = SchemaApiKey_SecretProp.safeParse('a'.repeat(63));
      expect(result.success).toBe(false);
    });

    it('should reject secret longer than 64 characters', () => {
      const result = SchemaApiKey_SecretProp.safeParse('a'.repeat(65));
      expect(result.success).toBe(false);
    });

    it('should reject uppercase hex characters', () => {
      const result = SchemaApiKey_SecretProp.safeParse('A'.repeat(64));
      expect(result.success).toBe(false);
    });

    it('should reject non-hex characters', () => {
      const result = SchemaApiKey_SecretProp.safeParse('g'.repeat(64));
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = SchemaApiKey_SecretProp.safeParse('');
      expect(result.success).toBe(false);
    });
  });
});
