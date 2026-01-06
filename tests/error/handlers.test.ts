// Package imports
import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';

// Project imports
import { CliError } from '../../src/error/CliError';
import { handleRootError } from '../../src/error/handlers';
import * as printerModule from '../../src/ui/printer';

/**
 * Helper to call handleRootError and verify it triggers process.exit.
 * Returns the message of the error thrown by our mocked process.exit.
 */
function callHandleRootError(err: unknown): string {
  try {
    handleRootError(err);
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error('Expected handleRootError to throw');
}

describe('handleRootError', () => {
  let exitSpy: ReturnType<typeof spyOn>;
  let spacerSpy: ReturnType<typeof spyOn>;
  let failSpy: ReturnType<typeof spyOn>;
  let errorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Mock process.exit to throw an error instead of exiting
    exitSpy = spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Mock printer methods
    spacerSpy = spyOn(printerModule.printer, 'spacer').mockImplementation(
      () => {}
    );
    failSpy = spyOn(printerModule.printer, 'fail').mockImplementation(() => {});
    errorSpy = spyOn(printerModule.printer, 'error').mockImplementation(
      () => {}
    );
  });

  afterEach(() => {
    exitSpy.mockRestore();
    spacerSpy.mockRestore();
    failSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('user cancellation errors', () => {
    test('handles ExitPromptError silently with SIGINT exit code', () => {
      const error = new Error('User cancelled');
      error.name = 'ExitPromptError';

      const msg = callHandleRootError(error);

      expect(msg).toBe('process.exit called');
      expect(spacerSpy).toHaveBeenCalledTimes(1);
      expect(failSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(130);
    });

    test('handles CancelPromptError silently with SIGINT exit code', () => {
      const error = new Error('Prompt cancelled');
      error.name = 'CancelPromptError';

      const msg = callHandleRootError(error);

      expect(msg).toBe('process.exit called');
      expect(spacerSpy).toHaveBeenCalledTimes(1);
      expect(exitSpy).toHaveBeenCalledWith(130);
    });

    test('handles AbortError silently with SIGINT exit code', () => {
      const error = new Error('Operation aborted');
      error.name = 'AbortError';

      const msg = callHandleRootError(error);

      expect(msg).toBe('process.exit called');
      expect(spacerSpy).toHaveBeenCalledTimes(1);
      expect(exitSpy).toHaveBeenCalledWith(130);
    });

    test('detects user cancellation by constructor name', () => {
      // Create a custom error class to test constructor.name detection
      class ExitPromptError extends Error {
        constructor() {
          super('Custom exit');
          // Intentionally not setting this.name
        }
      }

      const error = new ExitPromptError();

      const msg = callHandleRootError(error);

      expect(msg).toBe('process.exit called');
      expect(spacerSpy).toHaveBeenCalledTimes(1);
      expect(exitSpy).toHaveBeenCalledWith(130);
    });
  });

  describe('CliError handling', () => {
    test('handles CliError with fail printer and GENERAL_ERROR exit code', () => {
      const cliError = new CliError({
        title: 'Test Error',
        message: 'Test message'
      });

      const msg = callHandleRootError(cliError);

      expect(msg).toBe('process.exit called');
      expect(failSpy).toHaveBeenCalledTimes(1);
      expect(failSpy).toHaveBeenCalledWith(cliError);
      expect(errorSpy).not.toHaveBeenCalled();
      expect(spacerSpy).not.toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('handles CliError with suggestions', () => {
      const cliError = new CliError({
        title: 'Config Error',
        message: 'Configuration is invalid',
        suggestions: ['Check your config file']
      });

      const msg = callHandleRootError(cliError);

      expect(msg).toBe('process.exit called');
      expect(failSpy).toHaveBeenCalledWith(cliError);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('unexpected error handling', () => {
    test('handles standard Error with error printer', () => {
      const error = new Error('Unexpected error');

      const msg = callHandleRootError(error);

      expect(msg).toBe('process.exit called');
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(error);
      expect(failSpy).not.toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('handles TypeError', () => {
      const error = new TypeError('Cannot read property');

      const msg = callHandleRootError(error);

      expect(msg).toBe('process.exit called');
      expect(errorSpy).toHaveBeenCalledWith(error);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('handles string error', () => {
      const error = 'String error message';

      const msg = callHandleRootError(error);

      expect(msg).toBe('process.exit called');
      expect(errorSpy).toHaveBeenCalledWith(error);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('handles object error', () => {
      const error = { code: 'ERR', detail: 'Something went wrong' };

      const msg = callHandleRootError(error);

      expect(msg).toBe('process.exit called');
      expect(errorSpy).toHaveBeenCalledWith(error);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('handles null error', () => {
      const msg = callHandleRootError(null);

      expect(msg).toBe('process.exit called');
      expect(errorSpy).toHaveBeenCalledWith(null);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('handles undefined error', () => {
      const msg = callHandleRootError(undefined);

      expect(msg).toBe('process.exit called');
      expect(errorSpy).toHaveBeenCalledWith(undefined);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('handles number error', () => {
      const msg = callHandleRootError(42);

      expect(msg).toBe('process.exit called');
      expect(errorSpy).toHaveBeenCalledWith(42);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('non-cancellation errors', () => {
    test('does not treat regular Error as user cancellation', () => {
      const error = new Error('Regular error');

      const msg = callHandleRootError(error);

      expect(msg).toBe('process.exit called');
      expect(spacerSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    });

    test('does not treat non-Error with cancellation-like message as cancellation', () => {
      const error = { message: 'ExitPromptError' };

      const msg = callHandleRootError(error);

      // This should be treated as unexpected error, not cancellation
      expect(msg).toBe('process.exit called');
      expect(errorSpy).toHaveBeenCalled();
      expect(spacerSpy).not.toHaveBeenCalled();
    });
  });
});
