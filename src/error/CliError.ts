// Project imports
import { ErrorCode } from './constants';

/**
 * ### CliErrorObj
 *
 * Object structure for CLI error data.
 *
 * Fields:
 * - `title` - Short error title for display
 * - `message` - Detailed error message
 * - `code` - Error code for programmatic handling (optional) - see {@link ErrorCode}
 * - `suggestions` - Actionable suggestions for the user (optional)
 * - `hints` - Additional context or hints (optional)
 * - `cause` - Underlying error cause (optional)
 */
export interface CliErrorObj {
  title: string;
  message: string;
  code?: ErrorCode;
  suggestions?: string[];
  hints?: string[];
  cause?: unknown;
}

/**
 * ### CliError
 *
 * Custom error class for CLI-specific errors with structured output.
 *
 * Constructor Parameters:
 * - `opts` - Error configuration - see {@link CliErrorObj}
 */
export class CliError extends Error {
  /**
   * ### title
   *
   * Short error title for display.
   */
  public readonly title: string = 'Error';

  /**
   * ### code
   *
   * Error code for programmatic handling.
   */
  public readonly code: ErrorCode | undefined;

  /**
   * ### suggestions
   *
   * Actionable suggestions for the user.
   */
  public readonly suggestions: string[] | undefined;

  /**
   * ### hints
   *
   * Additional context or hints.
   */
  public readonly hints: string[] | undefined;

  /**
   * ### constructor
   *
   * Creates a new CLI error instance.
   *
   * Parameters:
   * - `opts` - Error configuration - see {@link CliErrorObj}
   */
  constructor(opts: CliErrorObj) {
    super(opts.message, { cause: opts.cause });

    this.title = opts.title;
    this.name = 'CliError';
    this.code = opts.code;
    this.suggestions = opts.suggestions;
    this.hints = opts.hints;

    if (typeof Error.captureStackTrace === 'function')
      Error.captureStackTrace(this, CliError);
  }

  /**
   * ### toJSON
   *
   * Converts the error to a JSON-serializable object.
   *
   * @returns `CliErrorObj` - The error as a plain object - see {@link CliErrorObj}
   */
  public toJSON(): CliErrorObj {
    const json: CliErrorObj = {
      title: this.title,
      message: this.message
    };

    if (this.code) json.code = this.code;
    if (this.suggestions?.length) json.suggestions = this.suggestions;
    if (this.hints?.length) json.hints = this.hints;

    return json;
  }
}
