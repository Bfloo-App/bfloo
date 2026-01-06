// Package imports
import { describe, expect, test } from 'bun:test';

// Project imports
import {
  API_KEY_SECTIONS_SEPARATOR,
  DEFAULT_TIMEOUT_MS,
  SCHEMA_API_KEY_SECRET_LENGTH,
  SCHEMAS_API_KEY_PREFIX
} from '../../src/constants/api';

describe('[Unit] - API Constants', () => {
  describe('SCHEMAS_API_KEY_PREFIX', () => {
    test('is "sk"', () => {
      expect(SCHEMAS_API_KEY_PREFIX).toBe('sk');
    });

    test('is a string', () => {
      expect(typeof SCHEMAS_API_KEY_PREFIX).toBe('string');
    });

    test('is lowercase', () => {
      expect(SCHEMAS_API_KEY_PREFIX).toBe(SCHEMAS_API_KEY_PREFIX.toLowerCase());
    });
  });

  describe('API_KEY_SECTIONS_SEPARATOR', () => {
    test('is underscore', () => {
      expect(API_KEY_SECTIONS_SEPARATOR).toBe('_');
    });

    test('is a single character', () => {
      expect(API_KEY_SECTIONS_SEPARATOR.length).toBe(1);
    });

    test('is a string', () => {
      expect(typeof API_KEY_SECTIONS_SEPARATOR).toBe('string');
    });
  });

  describe('SCHEMA_API_KEY_SECRET_LENGTH', () => {
    test('is 64', () => {
      expect(SCHEMA_API_KEY_SECRET_LENGTH).toBe(64);
    });

    test('is a number', () => {
      expect(typeof SCHEMA_API_KEY_SECRET_LENGTH).toBe('number');
    });

    test('is positive', () => {
      expect(SCHEMA_API_KEY_SECRET_LENGTH).toBeGreaterThan(0);
    });

    test('is an integer', () => {
      expect(Number.isInteger(SCHEMA_API_KEY_SECRET_LENGTH)).toBe(true);
    });
  });

  describe('DEFAULT_TIMEOUT_MS', () => {
    test('is 10000 milliseconds', () => {
      expect(DEFAULT_TIMEOUT_MS).toBe(10_000);
    });

    test('is a number', () => {
      expect(typeof DEFAULT_TIMEOUT_MS).toBe('number');
    });

    test('is positive', () => {
      expect(DEFAULT_TIMEOUT_MS).toBeGreaterThan(0);
    });

    test('represents 10 seconds', () => {
      expect(DEFAULT_TIMEOUT_MS / 1000).toBe(10);
    });
  });

  describe('API key format', () => {
    test('can construct valid API key format', () => {
      const prefix = SCHEMAS_API_KEY_PREFIX;
      const separator = API_KEY_SECTIONS_SEPARATOR;
      const mockId = 'abc123';
      const mockSecret = 'x'.repeat(SCHEMA_API_KEY_SECRET_LENGTH);

      const apiKey = `${prefix}${separator}${mockId}${separator}${mockSecret}`;

      expect(apiKey).toMatch(/^sk_[a-z0-9]+_x{64}$/);
    });

    test('prefix and separator work together', () => {
      const start = `${SCHEMAS_API_KEY_PREFIX}${API_KEY_SECTIONS_SEPARATOR}`;
      expect(start).toBe('sk_');
    });
  });
});
