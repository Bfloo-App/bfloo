/**
 * ### ErrorCode
 *
 * Enumeration of error codes for programmatic error handling.
 */
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR'
}

/**
 * ### EXIT_CODES
 *
 * Process exit codes used by the CLI.
 *
 * Fields:
 * - `SUCCESS` - Successful execution (0)
 * - `GENERAL_ERROR` - General error (1)
 * - `SIGINT` - User cancellation via Ctrl+C (130)
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  SIGINT: 130 // 128 + SIGINT(2) - standard for Ctrl+C
} as const;

/**
 * ### USER_CANCELLATION_ERRORS
 *
 * Set of error names that indicate user cancellation.
 */
export const USER_CANCELLATION_ERRORS = new Set([
  'ExitPromptError', // @inquirer/prompts - user pressed Ctrl+C during prompt
  'CancelPromptError', // @inquirer/prompts - prompt was programmatically cancelled
  'AbortError' // Standard AbortController cancellation
]);
