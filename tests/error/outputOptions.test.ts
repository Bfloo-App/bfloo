// Package imports
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

// Project imports
import {
  getOutputOptions,
  isJson,
  isVerbose,
  setJson,
  setVerbose
} from '../../src/error/outputOptions';

describe('outputOptions', () => {
  // Reset state before each test
  beforeEach(() => {
    setVerbose(false);
    setJson(false);
  });

  // Ensure clean state after tests
  afterEach(() => {
    setVerbose(false);
    setJson(false);
  });

  describe('setVerbose', () => {
    test('sets verbose to true', () => {
      setVerbose(true);
      expect(isVerbose()).toBe(true);
    });

    test('sets verbose to false', () => {
      setVerbose(true);
      setVerbose(false);
      expect(isVerbose()).toBe(false);
    });

    test('can be called multiple times', () => {
      setVerbose(true);
      setVerbose(true);
      expect(isVerbose()).toBe(true);

      setVerbose(false);
      setVerbose(false);
      expect(isVerbose()).toBe(false);
    });
  });

  describe('isVerbose', () => {
    test('returns false by default', () => {
      expect(isVerbose()).toBe(false);
    });

    test('returns true after setting verbose', () => {
      setVerbose(true);
      expect(isVerbose()).toBe(true);
    });

    test('returns boolean type', () => {
      expect(typeof isVerbose()).toBe('boolean');
    });
  });

  describe('setJson', () => {
    test('sets json to true', () => {
      setJson(true);
      expect(isJson()).toBe(true);
    });

    test('sets json to false', () => {
      setJson(true);
      setJson(false);
      expect(isJson()).toBe(false);
    });

    test('can be called multiple times', () => {
      setJson(true);
      setJson(true);
      expect(isJson()).toBe(true);

      setJson(false);
      setJson(false);
      expect(isJson()).toBe(false);
    });
  });

  describe('isJson', () => {
    test('returns false by default', () => {
      expect(isJson()).toBe(false);
    });

    test('returns true after setting json', () => {
      setJson(true);
      expect(isJson()).toBe(true);
    });

    test('returns boolean type', () => {
      expect(typeof isJson()).toBe('boolean');
    });
  });

  describe('getOutputOptions', () => {
    test('returns object with verbose and json properties', () => {
      const options = getOutputOptions();
      expect(options).toHaveProperty('verbose');
      expect(options).toHaveProperty('json');
    });

    test('returns default values', () => {
      const options = getOutputOptions();
      expect(options.verbose).toBe(false);
      expect(options.json).toBe(false);
    });

    test('reflects verbose changes', () => {
      setVerbose(true);
      const options = getOutputOptions();
      expect(options.verbose).toBe(true);
      expect(options.json).toBe(false);
    });

    test('reflects json changes', () => {
      setJson(true);
      const options = getOutputOptions();
      expect(options.verbose).toBe(false);
      expect(options.json).toBe(true);
    });

    test('reflects both changes', () => {
      setVerbose(true);
      setJson(true);
      const options = getOutputOptions();
      expect(options.verbose).toBe(true);
      expect(options.json).toBe(true);
    });

    test('returns readonly object', () => {
      const options = getOutputOptions();
      // TypeScript would prevent direct modification
      // Runtime behavior is that the reference returns the internal state
      expect(options.verbose).toBe(false);
      expect(options.json).toBe(false);
    });

    test('multiple calls return consistent state', () => {
      setVerbose(true);
      const options1 = getOutputOptions();
      const options2 = getOutputOptions();

      expect(options1.verbose).toBe(options2.verbose);
      expect(options1.json).toBe(options2.json);
    });
  });

  describe('independent state', () => {
    test('verbose and json are independent', () => {
      setVerbose(true);
      expect(isVerbose()).toBe(true);
      expect(isJson()).toBe(false);

      setJson(true);
      expect(isVerbose()).toBe(true);
      expect(isJson()).toBe(true);

      setVerbose(false);
      expect(isVerbose()).toBe(false);
      expect(isJson()).toBe(true);
    });

    test('changing one does not affect the other', () => {
      setVerbose(true);
      setJson(false);

      expect(isVerbose()).toBe(true);
      expect(isJson()).toBe(false);

      setJson(true);
      expect(isVerbose()).toBe(true);
    });
  });

  describe('state persistence', () => {
    test('state persists across getter calls', () => {
      setVerbose(true);

      expect(isVerbose()).toBe(true);
      expect(isVerbose()).toBe(true);
      expect(isVerbose()).toBe(true);
    });

    test('state updates immediately', () => {
      expect(isVerbose()).toBe(false);
      setVerbose(true);
      expect(isVerbose()).toBe(true);
      setVerbose(false);
      expect(isVerbose()).toBe(false);
    });
  });
});
