// Package imports
import { describe, expect, test } from 'bun:test';

// Project imports
import {
  ErrorCode,
  EXIT_CODES,
  USER_CANCELLATION_ERRORS
} from '../../src/error/constants';

describe('ErrorCode', () => {
  test('is an enum', () => {
    expect(typeof ErrorCode).toBe('object');
  });

  test('contains NETWORK_ERROR', () => {
    expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR' as ErrorCode);
  });

  test('contains exactly one error code', () => {
    // TypeScript enums with string values only have forward mappings
    const codes = Object.keys(ErrorCode);
    expect(codes).toEqual(['NETWORK_ERROR']);
  });

  test('all values are strings', () => {
    for (const value of Object.values(ErrorCode)) {
      expect(typeof value).toBe('string');
    }
  });
});

describe('EXIT_CODES', () => {
  test('SUCCESS is 0', () => {
    expect(EXIT_CODES.SUCCESS).toBe(0);
  });

  test('GENERAL_ERROR is 1', () => {
    expect(EXIT_CODES.GENERAL_ERROR).toBe(1);
  });

  test('SIGINT is 130', () => {
    // 128 + SIGINT(2) = 130, standard for Ctrl+C
    expect(EXIT_CODES.SIGINT).toBe(130);
  });

  test('contains exactly three exit codes', () => {
    const keys = Object.keys(EXIT_CODES);
    expect(keys).toEqual(['SUCCESS', 'GENERAL_ERROR', 'SIGINT']);
  });

  test('all values are numbers', () => {
    for (const value of Object.values(EXIT_CODES)) {
      expect(typeof value).toBe('number');
    }
  });

  test('all values are non-negative', () => {
    for (const value of Object.values(EXIT_CODES)) {
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  test('SUCCESS is less than error codes', () => {
    expect(EXIT_CODES.SUCCESS).toBeLessThan(EXIT_CODES.GENERAL_ERROR);
    expect(EXIT_CODES.SUCCESS).toBeLessThan(EXIT_CODES.SIGINT);
  });
});

describe('USER_CANCELLATION_ERRORS', () => {
  test('is a Set', () => {
    expect(USER_CANCELLATION_ERRORS).toBeInstanceOf(Set);
  });

  test('contains ExitPromptError', () => {
    expect(USER_CANCELLATION_ERRORS.has('ExitPromptError')).toBe(true);
  });

  test('contains CancelPromptError', () => {
    expect(USER_CANCELLATION_ERRORS.has('CancelPromptError')).toBe(true);
  });

  test('contains AbortError', () => {
    expect(USER_CANCELLATION_ERRORS.has('AbortError')).toBe(true);
  });

  test('contains exactly three error names', () => {
    expect(USER_CANCELLATION_ERRORS.size).toBe(3);
  });

  test('does not contain unrelated error names', () => {
    expect(USER_CANCELLATION_ERRORS.has('Error')).toBe(false);
    expect(USER_CANCELLATION_ERRORS.has('TypeError')).toBe(false);
    expect(USER_CANCELLATION_ERRORS.has('SyntaxError')).toBe(false);
    expect(USER_CANCELLATION_ERRORS.has('RandomError')).toBe(false);
  });

  test('values are all strings', () => {
    for (const value of USER_CANCELLATION_ERRORS) {
      expect(typeof value).toBe('string');
    }
  });

  test('can be used for membership checks', () => {
    const testError = { name: 'ExitPromptError' };
    expect(USER_CANCELLATION_ERRORS.has(testError.name)).toBe(true);

    const regularError = { name: 'Error' };
    expect(USER_CANCELLATION_ERRORS.has(regularError.name)).toBe(false);
  });
});
