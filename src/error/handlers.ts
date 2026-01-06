// Project imports
import { printer } from '$ui';
import { CliError } from './CliError';
import { EXIT_CODES, USER_CANCELLATION_ERRORS } from './constants';

/**
 * ### isUserCancellation
 *
 * Checks if an error represents a user cancellation action.
 *
 * Parameters:
 * - `err` - Error to check
 *
 * @returns `boolean` - True if the error is a user cancellation
 */
function isUserCancellation(err: unknown): boolean {
  if (!(err instanceof Error)) return false;

  // Check by error name
  if (USER_CANCELLATION_ERRORS.has(err.name)) return true;

  // Check constructor name as fallback (some errors don't set .name)
  if (USER_CANCELLATION_ERRORS.has(err.constructor.name)) return true;

  return false;
}

/**
 * ### handleRootError
 *
 * Handles uncaught errors at the root level and exits the process.
 *
 * Parameters:
 * - `err` - Error to handle
 *
 * @returns `never` - This function always exits the process
 */
export function handleRootError(err: unknown): never {
  // User cancellation - exit silently
  if (isUserCancellation(err)) {
    // Print a newline to clean up the prompt line
    printer.spacer();
    process.exit(EXIT_CODES.SIGINT);
  }

  // Expected errors (CliError) are "failures" - orange styling
  if (err instanceof CliError) {
    printer.fail(err);
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }

  // Unexpected errors - red styling
  printer.error(err);
  process.exit(EXIT_CODES.GENERAL_ERROR);
}
