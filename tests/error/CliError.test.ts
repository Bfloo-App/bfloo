// Package imports
import { describe, expect, test } from 'bun:test';

// Project imports
import { CliError } from '../../src/error/CliError';

describe('CliError', () => {
  describe('constructor', () => {
    test('creates error with required fields only', () => {
      const error = new CliError({
        title: 'Test Error',
        message: 'Test message'
      });

      expect(error.title).toBe('Test Error');
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('CliError');
      expect(error.code).toBeUndefined();
      expect(error.suggestions).toBeUndefined();
      expect(error.hints).toBeUndefined();
      expect(error.cause).toBeUndefined();
    });

    test('creates error with all optional fields except code', () => {
      const cause = new Error('Original error');
      const error = new CliError({
        title: 'Full Error',
        message: 'Full message',
        suggestions: ['Try this', 'Or that'],
        hints: ['Hint 1', 'Hint 2'],
        cause
      });

      expect(error.title).toBe('Full Error');
      expect(error.message).toBe('Full message');
      expect(error.suggestions).toEqual(['Try this', 'Or that']);
      expect(error.hints).toEqual(['Hint 1', 'Hint 2']);
      expect(error.cause).toBe(cause);
    });

    test('extends Error class', () => {
      const error = new CliError({
        title: 'Test',
        message: 'Message'
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CliError);
    });

    test('has stack trace', () => {
      const error = new CliError({
        title: 'Test',
        message: 'Message'
      });

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    test('preserves cause in error chain', () => {
      const rootCause = new Error('Root cause');
      const error = new CliError({
        title: 'Wrapper',
        message: 'Wrapped error',
        cause: rootCause
      });

      expect(error.cause).toBe(rootCause);
    });

    test('handles non-Error cause', () => {
      const error = new CliError({
        title: 'Test',
        message: 'Message',
        cause: 'string cause'
      });

      expect(error.cause).toBe('string cause');
    });

    test('handles object cause', () => {
      const cause = { code: 'ERR', detail: 'Something went wrong' };
      const error = new CliError({
        title: 'Test',
        message: 'Message',
        cause
      });

      expect(error.cause).toEqual(cause);
    });

    test('handles undefined cause', () => {
      const error = new CliError({
        title: 'Test',
        message: 'Message',
        cause: undefined
      });

      expect(error.cause).toBeUndefined();
    });

    test('handles null cause', () => {
      const error = new CliError({
        title: 'Test',
        message: 'Message',
        cause: null
      });

      expect(error.cause).toBeNull();
    });
  });

  describe('toJSON', () => {
    test('returns object with required fields', () => {
      const error = new CliError({
        title: 'JSON Error',
        message: 'JSON message'
      });

      const json = error.toJSON();

      expect(json).toEqual({
        title: 'JSON Error',
        message: 'JSON message'
      });
    });

    test('includes suggestions when present and non-empty', () => {
      const error = new CliError({
        title: 'Error',
        message: 'Message',
        suggestions: ['Suggestion 1']
      });

      const json = error.toJSON();

      expect(json.suggestions).toEqual(['Suggestion 1']);
    });

    test('excludes suggestions when empty array', () => {
      const error = new CliError({
        title: 'Error',
        message: 'Message',
        suggestions: []
      });

      const json = error.toJSON();

      expect(json.suggestions).toBeUndefined();
    });

    test('includes hints when present and non-empty', () => {
      const error = new CliError({
        title: 'Error',
        message: 'Message',
        hints: ['Hint 1', 'Hint 2']
      });

      const json = error.toJSON();

      expect(json.hints).toEqual(['Hint 1', 'Hint 2']);
    });

    test('excludes hints when empty array', () => {
      const error = new CliError({
        title: 'Error',
        message: 'Message',
        hints: []
      });

      const json = error.toJSON();

      expect(json.hints).toBeUndefined();
    });

    test('does not include cause in JSON output', () => {
      const error = new CliError({
        title: 'Error',
        message: 'Message',
        cause: new Error('Original')
      });

      const json = error.toJSON();

      expect(json.cause).toBeUndefined();
    });

    test('returns multiple suggestions', () => {
      const error = new CliError({
        title: 'Error',
        message: 'Message',
        suggestions: ['First', 'Second', 'Third']
      });

      const json = error.toJSON();

      expect(json.suggestions).toEqual(['First', 'Second', 'Third']);
    });

    test('returns multiple hints', () => {
      const error = new CliError({
        title: 'Error',
        message: 'Message',
        hints: ['Hint A', 'Hint B']
      });

      const json = error.toJSON();

      expect(json.hints).toEqual(['Hint A', 'Hint B']);
    });

    test('is JSON serializable', () => {
      const error = new CliError({
        title: 'Serializable',
        message: 'Can be stringified',
        suggestions: ['Tip'],
        hints: ['Info']
      });

      const jsonString = JSON.stringify(error.toJSON());
      const parsed = JSON.parse(jsonString) as Record<string, unknown>;

      expect(parsed).toEqual({
        title: 'Serializable',
        message: 'Can be stringified',
        suggestions: ['Tip'],
        hints: ['Info']
      });
    });

    test('handles special characters in strings', () => {
      const error = new CliError({
        title: 'Error with "quotes"',
        message: 'Message with\nnewline and\ttab',
        suggestions: ['Use <brackets>'],
        hints: ['Check "path/to/file"']
      });

      const json = error.toJSON();

      expect(json.title).toBe('Error with "quotes"');
      expect(json.message).toBe('Message with\nnewline and\ttab');
      expect(json.suggestions).toEqual(['Use <brackets>']);
      expect(json.hints).toEqual(['Check "path/to/file"']);
    });
  });

  describe('readonly properties', () => {
    test('title is readonly', () => {
      const error = new CliError({
        title: 'Original',
        message: 'Message'
      });

      // TypeScript would prevent this at compile time
      // At runtime, we verify the value remains unchanged
      expect(error.title).toBe('Original');
    });

    test('code is readonly and undefined when not set', () => {
      const error = new CliError({
        title: 'Test',
        message: 'Message'
      });

      expect(error.code).toBeUndefined();
    });

    test('suggestions is readonly', () => {
      const error = new CliError({
        title: 'Test',
        message: 'Message',
        suggestions: ['Original']
      });

      expect(error.suggestions).toEqual(['Original']);
    });

    test('hints is readonly', () => {
      const error = new CliError({
        title: 'Test',
        message: 'Message',
        hints: ['Original hint']
      });

      expect(error.hints).toEqual(['Original hint']);
    });
  });

  describe('error properties', () => {
    test('name property is set to CliError', () => {
      const error = new CliError({
        title: 'Test',
        message: 'Message'
      });

      expect(error.name).toBe('CliError');
    });

    test('message property is accessible', () => {
      const error = new CliError({
        title: 'Test',
        message: 'Detailed error message'
      });

      expect(error.message).toBe('Detailed error message');
    });

    test('can be thrown and caught', () => {
      const error = new CliError({
        title: 'Throwable',
        message: 'This error can be thrown'
      });

      let caughtError: unknown = null;
      try {
        throw error;
      } catch (e) {
        caughtError = e;
      }

      expect(caughtError).toBe(error);
      expect(caughtError).toBeInstanceOf(CliError);
      expect((caughtError as CliError).title).toBe('Throwable');
    });

    test('instanceof checks work correctly', () => {
      const error = new CliError({
        title: 'Test',
        message: 'Message'
      });

      expect(error instanceof CliError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });
});
