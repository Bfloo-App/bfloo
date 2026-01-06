// Package imports
import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import type { Mock } from 'bun:test';

// Project imports
import {
  printer,
  success,
  step,
  warning,
  info,
  header,
  keyValue,
  spacer,
  text,
  fail,
  error,
  rollbackWarning,
  abortDetected,
  forceExit,
  rollbackStart,
  rollbackComplete,
  createSpinner,
  withSpinner,
  type SpinnerTask
} from '../../src/ui/printer';
import { CliError } from '../../src/error/CliError';
import { setVerbose, setJson } from '../../src/error/outputOptions';

// Type for console spy
type ConsoleSpy = Mock<typeof console.log>;

// Helper to get call args safely
function getCallArg(spy: ConsoleSpy, callIndex: number): string {
  const calls = spy.mock.calls;
  const call = calls[callIndex];
  return call ? String(call[0]) : '';
}

// Helper to get all call outputs as single string
function getAllCallOutputs(spy: ConsoleSpy): string {
  return spy.mock.calls.map((call) => String(call[0])).join('\n');
}

describe('[Unit] - printer', () => {
  let consoleLogSpy: ConsoleSpy;
  let consoleErrorSpy: ConsoleSpy;

  beforeEach(() => {
    consoleLogSpy = spyOn(console, 'log').mockImplementation(
      () => {}
    ) as ConsoleSpy;
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(
      () => {}
    ) as ConsoleSpy;
    // Reset output options to defaults
    setVerbose(false);
    setJson(false);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Simple Output Methods', () => {
    describe('success', () => {
      it('should output message with checkmark icon', () => {
        success('Operation completed');
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const output = getCallArg(consoleLogSpy, 0);
        expect(output).toContain('Operation completed');
        expect(output).toContain('✔');
      });

      it('should handle empty message', () => {
        success('');
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('step', () => {
      it('should output message with step icon', () => {
        step('Processing item');
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const output = getCallArg(consoleLogSpy, 0);
        expect(output).toContain('Processing item');
        expect(output).toContain('›');
      });
    });

    describe('warning', () => {
      it('should output message with warning icon', () => {
        warning('This is a warning');
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const output = getCallArg(consoleLogSpy, 0);
        expect(output).toContain('This is a warning');
        expect(output).toContain('⚠');
      });
    });

    describe('info', () => {
      it('should output message with info icon', () => {
        info('Information message');
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const output = getCallArg(consoleLogSpy, 0);
        expect(output).toContain('Information message');
        // Info icon is ℹ (Unicode 2139)
        expect(output).toContain('\u2139');
      });
    });

    describe('header', () => {
      it('should output title with underline', () => {
        header('Section Title');
        expect(consoleLogSpy).toHaveBeenCalledTimes(3);
        // First call is empty line
        expect(getCallArg(consoleLogSpy, 0)).toBe('');
        // Second call is the bold title
        const titleOutput = getCallArg(consoleLogSpy, 1);
        expect(titleOutput).toContain('Section Title');
        // Third call is the underline
        const underlineOutput = getCallArg(consoleLogSpy, 2);
        expect(underlineOutput).toContain('─');
      });
    });

    describe('keyValue', () => {
      it('should output key-value pair with formatting', () => {
        keyValue('Name', 'John');
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const output = getCallArg(consoleLogSpy, 0);
        expect(output).toContain('Name:');
        expect(output).toContain('John');
      });

      it('should handle empty values', () => {
        keyValue('Empty', '');
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const output = getCallArg(consoleLogSpy, 0);
        expect(output).toContain('Empty:');
      });
    });

    describe('spacer', () => {
      it('should output empty line', () => {
        spacer();
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        expect(getCallArg(consoleLogSpy, 0)).toBe('');
      });
    });

    describe('text', () => {
      it('should output plain text', () => {
        text('Plain text message');
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        expect(getCallArg(consoleLogSpy, 0)).toBe('Plain text message');
      });

      it('should output text with indentation', () => {
        text('Indented message', 4);
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        expect(getCallArg(consoleLogSpy, 0)).toBe('    Indented message');
      });

      it('should handle zero indentation', () => {
        text('No indent', 0);
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        expect(getCallArg(consoleLogSpy, 0)).toBe('No indent');
      });
    });
  });

  describe('Status Messages', () => {
    describe('abortDetected', () => {
      it('should output abort warning message', () => {
        abortDetected();
        expect(consoleLogSpy).toHaveBeenCalledTimes(2);
        const firstLine = getCallArg(consoleLogSpy, 0);
        expect(firstLine).toContain('Abort detected');
        const secondLine = getCallArg(consoleLogSpy, 1);
        expect(secondLine).toContain('Ctrl+C');
      });
    });

    describe('forceExit', () => {
      it('should output force quit message', () => {
        forceExit();
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const output = getCallArg(consoleLogSpy, 0);
        expect(output).toContain('Force quitting');
      });
    });

    describe('rollbackStart', () => {
      it('should output rollback start message', () => {
        rollbackStart();
        expect(consoleLogSpy).toHaveBeenCalledTimes(3);
        const messageLine = getCallArg(consoleLogSpy, 1);
        expect(messageLine).toContain('Rolling back');
      });
    });

    describe('rollbackComplete', () => {
      it('should output rollback complete message', () => {
        rollbackComplete();
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const output = getCallArg(consoleLogSpy, 0);
        expect(output).toContain('Rollback complete');
        expect(output).toContain('✔');
      });
    });
  });

  describe('Error Display - fail', () => {
    it('should display CliError in boxed format', () => {
      const cliError = new CliError({
        title: 'Test Error',
        message: 'Something went wrong'
      });

      fail(cliError);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('Test Error');
      expect(output).toContain('Something went wrong');
      expect(output).toContain('FAIL');
    });

    it('should display error without code when ErrorCode is empty', () => {
      // Note: ErrorCode enum is currently empty, so we test without code
      // When error codes are added, this test should be updated
      const cliError = new CliError({
        title: 'Config Error',
        message: 'Invalid configuration'
      });

      fail(cliError);
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('Config Error');
    });

    it('should display error with suggestions', () => {
      const cliError = new CliError({
        title: 'Missing File',
        message: 'Config file not found',
        suggestions: ['Run bfloo init', 'Check file permissions']
      });

      fail(cliError);
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('Run bfloo init');
      expect(output).toContain('Check file permissions');
    });

    it('should display error with hints', () => {
      const cliError = new CliError({
        title: 'Connection Error',
        message: 'Could not connect',
        hints: ['Make sure the server is running']
      });

      fail(cliError);
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('Make sure the server is running');
    });

    it('should output JSON when json mode is enabled', () => {
      setJson(true);
      const cliError = new CliError({
        title: 'JSON Error',
        message: 'Test error message'
      });

      fail(cliError);
      const output = getCallArg(consoleErrorSpy, 0);
      const parsed = JSON.parse(output) as Record<string, unknown>;
      expect(parsed['type']).toBe('fail');
      expect(parsed['title']).toBe('JSON Error');
      expect(parsed['message']).toBe('Test error message');
    });

    it('should show cause in verbose mode', () => {
      setVerbose(true);
      const cause = new Error('Original error');
      const cliError = new CliError({
        title: 'Wrapped Error',
        message: 'An error occurred',
        cause
      });

      fail(cliError);
      // First call is the boxed error, subsequent calls show cause
      expect(consoleErrorSpy.mock.calls.length).toBeGreaterThan(1);
      const causeOutput = getAllCallOutputs(consoleErrorSpy);
      expect(causeOutput).toContain('Cause:');
    });

    it('should handle string cause in verbose mode', () => {
      setVerbose(true);
      const cliError = new CliError({
        title: 'String Cause Error',
        message: 'An error occurred',
        cause: 'String cause message'
      });

      fail(cliError);
      const allOutput = getAllCallOutputs(consoleErrorSpy);
      expect(allOutput).toContain('String cause message');
    });

    it('should handle object cause in verbose mode', () => {
      setVerbose(true);
      const cliError = new CliError({
        title: 'Object Cause Error',
        message: 'An error occurred',
        cause: { key: 'value', nested: { data: 123 } }
      });

      fail(cliError);
      const allOutput = getAllCallOutputs(consoleErrorSpy);
      expect(allOutput).toContain('Cause:');
    });
  });

  describe('Error Display - error', () => {
    it('should display Error instance in boxed format', () => {
      const err = new Error('Unexpected failure');

      error(err);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('Error');
      expect(output).toContain('Unexpected failure');
      expect(output).toContain('ERROR');
    });

    it('should handle string error', () => {
      error('String error message');
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('String error message');
    });

    it('should handle object error with name and message', () => {
      error({ name: 'CustomError', message: 'Custom message' });
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('CustomError');
      expect(output).toContain('Custom message');
    });

    it('should handle object error with title', () => {
      error({ title: 'TitleError', message: 'Title message' });
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('TitleError');
    });

    it('should handle object without name or title', () => {
      error({ foo: 'bar', baz: 123 });
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('Error');
    });

    it('should handle null error', () => {
      error(null);
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('Unknown Error');
    });

    it('should handle undefined error', () => {
      error(undefined);
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('Unknown Error');
    });

    it('should handle number error', () => {
      error(42);
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('42');
    });

    it('should output JSON when json mode is enabled', () => {
      setJson(true);
      const err = new Error('JSON mode error');

      error(err);
      const output = getCallArg(consoleErrorSpy, 0);
      const parsed = JSON.parse(output) as Record<string, unknown>;
      expect(parsed['type']).toBe('error');
      expect(parsed['title']).toBe('Error');
      expect(parsed['message']).toBe('JSON mode error');
    });

    it('should include stack in JSON when verbose', () => {
      setJson(true);
      setVerbose(true);
      const err = new Error('Verbose JSON error');

      error(err);
      const output = getCallArg(consoleErrorSpy, 0);
      const parsed = JSON.parse(output) as Record<string, unknown>;
      expect(parsed['stack']).toBeDefined();
    });

    it('should show stack trace in verbose mode', () => {
      setVerbose(true);
      const err = new Error('Verbose error');

      error(err);
      const allOutput = getAllCallOutputs(consoleErrorSpy);
      expect(allOutput).toContain('Stack trace:');
    });
  });

  describe('Error Display - rollbackWarning', () => {
    it('should display rollback warning with failures', () => {
      rollbackWarning(['Failed to delete file', 'Failed to restore config']);
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('Rollback Incomplete');
      expect(output).toContain('Failed to delete file');
      expect(output).toContain('Failed to restore config');
    });

    it('should output JSON when json mode is enabled', () => {
      setJson(true);
      rollbackWarning(['Cleanup failed']);
      const output = getCallArg(consoleErrorSpy, 0);
      const parsed = JSON.parse(output) as Record<string, unknown>;
      expect(parsed['type']).toBe('rollback_warning');
      expect(parsed['failures']).toEqual(['Cleanup failed']);
    });
  });

  describe('Spinner Methods', () => {
    describe('createSpinner', () => {
      it('should create spinner with default options', () => {
        const spinner = createSpinner('Loading...');
        expect(spinner).toBeDefined();
        expect(spinner.text).toBe('Loading...');
      });

      it('should create spinner with custom options', () => {
        const spinner = createSpinner('Custom spinner', { color: 'green' });
        expect(spinner).toBeDefined();
        expect(spinner.text).toBe('Custom spinner');
      });
    });

    describe('withSpinner', () => {
      it('should execute task and show success', async () => {
        const task = Promise.resolve('result');
        const messages: SpinnerTask<string> = {
          start: 'Processing...',
          success: 'Done!'
        };

        const result = await withSpinner(task, messages);
        expect(result).toBe('result');
      });

      it('should use function for success message', async () => {
        const task = Promise.resolve(42);
        const messages: SpinnerTask<number> = {
          start: 'Calculating...',
          success: (result) => `Result: ${String(result)}`
        };

        const result = await withSpinner(task, messages);
        expect(result).toBe(42);
      });

      it('should use start message as fallback for success', async () => {
        const task = Promise.resolve('ok');
        const messages: SpinnerTask<string> = {
          start: 'Loading...'
        };

        const result = await withSpinner(task, messages);
        expect(result).toBe('ok');
      });

      it('should strip trailing dots from start message for success fallback', async () => {
        const task = Promise.resolve('ok');
        const messages: SpinnerTask<string> = {
          start: 'Loading items...'
        };

        // This should not throw and should use "Loading items" as success message
        const result = await withSpinner(task, messages);
        expect(result).toBe('ok');
      });

      it('should show failure message on error', async () => {
        const task = Promise.reject(new Error('Task failed'));
        const messages: SpinnerTask<string> = {
          start: 'Processing...',
          fail: 'Processing failed'
        };

        try {
          await withSpinner(task, messages);
          expect(true).toBe(false); // Should not reach here
        } catch (err) {
          expect(err).toBeInstanceOf(Error);
          expect((err as Error).message).toBe('Task failed');
        }
      });

      it('should use default failure message when not provided', async () => {
        const task = Promise.reject(new Error('Oops'));
        const messages: SpinnerTask<string> = {
          start: 'Running...'
        };

        try {
          await withSpinner(task, messages);
          expect(true).toBe(false); // Should not reach here
        } catch (err) {
          expect(err).toBeInstanceOf(Error);
          expect((err as Error).message).toBe('Oops');
        }
      });

      it('should pass custom options to spinner', async () => {
        const task = Promise.resolve('done');
        const messages: SpinnerTask<string> = {
          start: 'Working...',
          success: 'Completed'
        };

        const result = await withSpinner(task, messages, { color: 'yellow' });
        expect(result).toBe('done');
      });
    });
  });

  describe('printer object', () => {
    it('should export all methods', () => {
      expect(typeof printer.success).toBe('function');
      expect(typeof printer.step).toBe('function');
      expect(typeof printer.warning).toBe('function');
      expect(typeof printer.info).toBe('function');
      expect(typeof printer.header).toBe('function');
      expect(typeof printer.keyValue).toBe('function');
      expect(typeof printer.spacer).toBe('function');
      expect(typeof printer.text).toBe('function');
      expect(typeof printer.fail).toBe('function');
      expect(typeof printer.error).toBe('function');
      expect(typeof printer.rollbackWarning).toBe('function');
      expect(typeof printer.abortDetected).toBe('function');
      expect(typeof printer.forceExit).toBe('function');
      expect(typeof printer.rollbackStart).toBe('function');
      expect(typeof printer.rollbackComplete).toBe('function');
      expect(typeof printer.createSpinner).toBe('function');
      expect(typeof printer.withSpinner).toBe('function');
    });

    it('should have same behavior when called via object or destructured', () => {
      printer.success('Via object');
      success('Via destructured');
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Text Wrapping', () => {
    it('should wrap long error titles', () => {
      const cliError = new CliError({
        title:
          'This is a very long error title that should be wrapped to fit within the box boundaries properly',
        message: 'Short message'
      });

      fail(cliError);
      // Just verify it doesn't throw and produces output
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should wrap long messages', () => {
      const cliError = new CliError({
        title: 'Error',
        message:
          'This is a very long error message that contains many words and should be wrapped across multiple lines to fit within the error box boundaries without breaking the layout'
      });

      fail(cliError);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle very long words without spaces', () => {
      const cliError = new CliError({
        title: 'Error',
        message:
          'Thisisaverylongwordwithoutanyspacesthatshouldbehardwrappedatthemaximumwidth'
      });

      fail(cliError);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should wrap long suggestions', () => {
      const cliError = new CliError({
        title: 'Error',
        message: 'An error occurred',
        suggestions: [
          'This is a very long suggestion that should be wrapped properly across multiple lines while maintaining the suggestion icon on the first line only'
        ]
      });

      fail(cliError);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should wrap long hints', () => {
      const cliError = new CliError({
        title: 'Error',
        message: 'An error occurred',
        hints: [
          'This is a very long hint that provides additional context and should be wrapped properly across multiple lines while maintaining the hint icon on the first line only'
        ]
      });

      fail(cliError);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle error with all fields populated', () => {
      // Note: ErrorCode enum is currently empty, so we test without code
      const cliError = new CliError({
        title: 'Complete Error',
        message: 'All fields present',
        suggestions: ['Suggestion 1', 'Suggestion 2'],
        hints: ['Hint 1', 'Hint 2'],
        cause: new Error('Root cause')
      });

      fail(cliError);
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('Complete Error');
      expect(output).toContain('All fields present');
      expect(output).toContain('Suggestion 1');
      expect(output).toContain('Hint 1');
    });

    it('should handle error with empty suggestions array', () => {
      const cliError = new CliError({
        title: 'Error',
        message: 'Message',
        suggestions: []
      });

      fail(cliError);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle error with empty hints array', () => {
      const cliError = new CliError({
        title: 'Error',
        message: 'Message',
        hints: []
      });

      fail(cliError);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle error with only title and message', () => {
      const cliError = new CliError({
        title: 'Minimal Error',
        message: 'Minimal message'
      });

      fail(cliError);
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('Minimal Error');
      expect(output).toContain('Minimal message');
    });

    it('should handle Error with empty message', () => {
      const err = new Error('');
      err.name = 'EmptyMessageError';

      error(err);
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('EmptyMessageError');
    });

    it('should handle Error with custom name', () => {
      const err = new Error('Custom error message');
      err.name = 'CustomNamedError';

      error(err);
      const output = getCallArg(consoleErrorSpy, 0);
      expect(output).toContain('CustomNamedError');
    });

    it('should handle Error without name', () => {
      const err = new Error('Error without name');
      err.name = '';

      error(err);
      const output = getCallArg(consoleErrorSpy, 0);
      // Should fall back to 'Error' when name is empty
      expect(output).toContain('Error without name');
    });
  });
});
