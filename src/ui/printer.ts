// External imports
import ora, { type Ora, type Options as OraOptions } from 'ora';
import {
  greenBright,
  blueBright,
  redBright,
  bold,
  dim,
  bgRed,
  bgYellow,
  white,
  yellow,
  black
} from 'picocolors';

// Project imports
import { type CliError, getOutputOptions } from '$error';

/**
 * ### BOX
 *
 * Unicode box-drawing characters for CLI error boxes.
 */
const BOX = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
  verticalRight: '├',
  verticalLeft: '┤'
} as const;

/**
 * ### ICONS
 *
 * Unicode icons for CLI output messages.
 */
const ICONS = {
  success: '✔',
  error: '✖',
  info: '\u2139', // ℹ - information source
  warning: '⚠',
  step: '\u203a', // › - single right-pointing angle quotation mark
  suggestion: '→',
  hint: '💡'
} as const;

/**
 * ### BOX_WIDTH
 *
 * Total width of error box including borders.
 */
const BOX_WIDTH = 60;

/**
 * ### CONTENT_WIDTH
 *
 * Available width for content inside error box (box width minus borders and padding).
 */
const CONTENT_WIDTH: number = BOX_WIDTH - 4;

/**
 * ### DEFAULT_SPINNER_OPTIONS
 *
 * Default configuration for ora spinner instances.
 */
const DEFAULT_SPINNER_OPTIONS: OraOptions = {
  spinner: 'dots',
  color: 'cyan'
};

/**
 * ### BadgeType
 *
 * Type of badge to display in error box header.
 *
 * Variants:
 * - `error` - Unexpected/unhandled errors
 * - `fail` - Expected CLI failures
 * - `warning` - Warning messages
 */
type BadgeType = 'error' | 'fail' | 'warning';

/**
 * ### BadgeConfig
 *
 * Configuration for error box badge styling.
 *
 * Fields:
 * - `label` - Badge text label
 * - `bgColor` - Background color function
 * - `textColor` - Text color function
 * - `borderColor` - Border color function
 */
interface BadgeConfig {
  label: string;
  bgColor: (text: string) => string;
  textColor: (text: string) => string;
  borderColor: (text: string) => string;
}

/**
 * ### BADGES
 *
 * Badge configurations for each badge type.
 */
const BADGES: Record<BadgeType, BadgeConfig> = {
  error: {
    label: 'ERROR',
    bgColor: bgRed,
    textColor: white,
    borderColor: redBright
  },
  fail: {
    label: 'FAIL',
    bgColor: bgYellow,
    textColor: black,
    borderColor: yellow
  },
  warning: {
    label: 'WARNING',
    bgColor: bgYellow,
    textColor: black,
    borderColor: yellow
  }
};

/**
 * ### SpinnerTask
 *
 * Message configuration for spinner-wrapped async tasks.
 *
 * Type Parameters:
 * - `T` - Task result type
 *
 * Fields:
 * - `start` - Message displayed while task is running
 * - `success` - Message on success (optional, can be string or function)
 * - `fail` - Message on failure (optional)
 */
export interface SpinnerTask<T> {
  start: string;
  success?: string | ((result: T) => string);
  fail?: string;
}

// eslint-disable-next-line no-control-regex -- Intentional ANSI escape code pattern
const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

/**
 * ### stripAnsi
 *
 * Removes ANSI escape codes from a string.
 *
 * Parameters:
 * - `str` - String potentially containing ANSI codes
 *
 * @returns `string` - String with ANSI codes removed
 */
function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, '');
}

/**
 * ### visibleLength
 *
 * Calculates the visible length of a string (excluding ANSI codes).
 *
 * Parameters:
 * - `str` - String to measure
 *
 * @returns `number` - Visible character count
 */
function visibleLength(str: string): number {
  return stripAnsi(str).length;
}

/**
 * ### wrapText
 *
 * Wraps text to fit within a maximum width, handling ANSI codes correctly.
 *
 * Parameters:
 * - `text` - Text to wrap
 * - `maxWidth` - Maximum visible width per line
 *
 * @returns `string[]` - Array of wrapped lines
 */
function wrapText(text: string, maxWidth: number): string[] {
  const words: string[] = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const wordLen = visibleLength(word);
    const currentLen = visibleLength(currentLine);
    const spaceNeeded: 1 | 0 = currentLine ? 1 : 0;

    // Word fits on current line
    if (currentLen + spaceNeeded + wordLen <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
      continue;
    }

    // Word doesn't fit - push current line if not empty
    if (currentLine) {
      lines.push(currentLine);
      currentLine = '';
    }

    // If word fits on its own line, use it
    if (wordLen <= maxWidth) {
      currentLine = word;
      continue;
    }

    // Word is too long - hard break at maxWidth
    let remaining = word;

    while (visibleLength(remaining) > maxWidth) {
      lines.push(remaining.slice(0, maxWidth));
      remaining = remaining.slice(maxWidth);
    }

    if (remaining) currentLine = remaining;
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * ### boxLine
 *
 * Creates a content line with box borders and proper padding.
 *
 * Parameters:
 * - `content` - Content to display
 * - `borderColor` - Color function for borders
 *
 * @returns `string` - Formatted box line
 */
function boxLine(content: string, borderColor: (s: string) => string): string {
  const stripped = stripAnsi(content);
  const padding = Math.max(0, BOX_WIDTH - stripped.length - 4);
  return `${borderColor(BOX.vertical)}  ${content}${' '.repeat(padding)}${borderColor(BOX.vertical)}`;
}

/**
 * ### emptyBoxLine
 *
 * Creates an empty line with box borders.
 *
 * Parameters:
 * - `borderColor` - Color function for borders
 *
 * @returns `string` - Empty box line
 */
function emptyBoxLine(borderColor: (s: string) => string): string {
  return `${borderColor(BOX.vertical)}${' '.repeat(BOX_WIDTH - 2)}${borderColor(BOX.vertical)}`;
}

/**
 * ### topBorder
 *
 * Creates the top border of an error box with badge.
 *
 * Parameters:
 * - `badge` - Badge configuration - see {@link BadgeConfig}
 *
 * @returns `string` - Top border line with badge
 */
function topBorder(badge: BadgeConfig): string {
  const badgeText = ` ${badge.label} `;
  const badgeRendered = badge.bgColor(badge.textColor(bold(badgeText)));
  const leftPart = `${badge.borderColor(BOX.topLeft)}${badge.borderColor(BOX.horizontal.repeat(2))} `;
  const rightPartLength = BOX_WIDTH - 3 - 1 - badgeText.length - 1 - 1;
  const rightPart = ` ${badge.borderColor(BOX.horizontal.repeat(rightPartLength))}${badge.borderColor(BOX.topRight)}`;
  return `${leftPart}${badgeRendered}${rightPart}`;
}

/**
 * ### bottomBorder
 *
 * Creates the bottom border of an error box.
 *
 * Parameters:
 * - `borderColor` - Color function for borders
 *
 * @returns `string` - Bottom border line
 */
function bottomBorder(borderColor: (s: string) => string): string {
  return `${borderColor(BOX.bottomLeft)}${borderColor(BOX.horizontal.repeat(BOX_WIDTH - 2))}${borderColor(BOX.bottomRight)}`;
}

/**
 * ### dividerLine
 *
 * Creates a horizontal divider line inside an error box.
 *
 * Parameters:
 * - `borderColor` - Color function for borders
 *
 * @returns `string` - Divider line
 */
function dividerLine(borderColor: (s: string) => string): string {
  return `${borderColor(BOX.verticalRight)}${dim(BOX.horizontal.repeat(BOX_WIDTH - 2))}${borderColor(BOX.verticalLeft)}`;
}

/**
 * ### formatBoxedError
 *
 * Formats an error message in a styled box with badge, title, message, and suggestions.
 *
 * Parameters:
 * - `title` - Error title
 * - `message` - Error message (optional)
 * - `code` - Error code (optional)
 * - `suggestions` - Array of suggestion strings (optional)
 * - `hints` - Array of hint strings (optional)
 * - `badge` - Badge type (defaults to 'error') - see {@link BadgeType}
 *
 * @returns `string` - Formatted error box
 */
function formatBoxedError(
  title: string,
  message: string | undefined,
  code: string | undefined,
  suggestions: string[] | undefined,
  hints: string[] | undefined,
  badge: BadgeType = 'error'
): string {
  const lines: string[] = [];
  const config: BadgeConfig = BADGES[badge];
  const borderColor: (text: string) => string = config.borderColor;

  lines.push('');
  lines.push(topBorder(config));
  lines.push(emptyBoxLine(borderColor));

  // Title
  const titleLines: string[] = wrapText(title, CONTENT_WIDTH);
  for (const titleLine of titleLines) {
    lines.push(boxLine(bold(titleLine), borderColor));
  }

  // Message
  if (message) {
    lines.push(emptyBoxLine(borderColor));
    const messageLines: string[] = wrapText(message, CONTENT_WIDTH);
    for (const msgLine of messageLines) {
      lines.push(boxLine(dim(msgLine), borderColor));
    }
  }

  // Error code
  if (code) {
    lines.push(emptyBoxLine(borderColor));
    lines.push(boxLine(dim(`Code: ${code}`), borderColor));
  }

  // Divider before suggestions/hints
  if (suggestions?.length || hints?.length) {
    lines.push(emptyBoxLine(borderColor));
    lines.push(dividerLine(borderColor));
  }

  // Suggestions
  if (suggestions?.length) {
    lines.push(emptyBoxLine(borderColor));
    for (const suggestion of suggestions) {
      const suggestionLines: string[] = wrapText(suggestion, CONTENT_WIDTH - 3);
      for (let i = 0; i < suggestionLines.length; i++) {
        const prefix = i === 0 ? `${greenBright(ICONS.suggestion)} ` : '  ';
        lines.push(
          boxLine(`${prefix}${suggestionLines[i] ?? ''}`, borderColor)
        );
      }
    }
  }

  // Hints
  if (hints?.length) {
    lines.push(emptyBoxLine(borderColor));
    for (const hint of hints) {
      const hintLines: string[] = wrapText(hint, CONTENT_WIDTH - 5);
      for (let i = 0; i < hintLines.length; i++) {
        const prefix = i === 0 ? `${yellow(ICONS.hint)} ` : '   ';
        lines.push(
          boxLine(`${prefix}${blueBright(hintLines[i] ?? '')}`, borderColor)
        );
      }
    }
  }

  lines.push(emptyBoxLine(borderColor));
  lines.push(bottomBorder(borderColor));
  lines.push('');

  return lines.join('\n');
}

/**
 * ### extractErrorInfo
 *
 * Extracts title, message, and stack from an unknown error value.
 *
 * Parameters:
 * - `err` - Unknown error value
 *
 * @returns Object with `title`, `message`, and `stack` properties
 */
function extractErrorInfo(err: unknown): {
  title: string;
  message: string | undefined;
  stack: string | undefined;
} {
  if (err instanceof Error) {
    return {
      title: err.name || 'Error',
      message: err.message,
      stack: err.stack
    };
  }

  if (typeof err === 'string') {
    return { title: 'Error', message: err, stack: undefined };
  }

  if (typeof err === 'object' && err !== null) {
    const obj: Record<string, unknown> = err as Record<string, unknown>;
    const nameOrTitle = obj['name'] ?? obj['title'];
    const titleStr = typeof nameOrTitle === 'string' ? nameOrTitle : 'Error';
    const messageVal = obj['message'];
    const messageStr =
      typeof messageVal === 'string' ? messageVal : JSON.stringify(err);
    return {
      title: titleStr,
      message: messageStr,
      stack: undefined
    };
  }

  return { title: 'Unknown Error', message: String(err), stack: undefined };
}

/**
 * ### formatFailJson
 *
 * Formats a CliError as JSON for machine-readable output.
 *
 * Parameters:
 * - `error` - CLI error to format - see {@link CliError}
 *
 * @returns `string` - JSON string
 */
function formatFailJson(error: CliError): string {
  const output: { type: string } & ReturnType<CliError['toJSON']> = {
    type: 'fail',
    ...error.toJSON()
  };
  return JSON.stringify(output, null, 2);
}

/**
 * ### formatErrorJson
 *
 * Formats an unknown error as JSON for machine-readable output.
 *
 * Parameters:
 * - `err` - Unknown error value
 *
 * @returns `string` - JSON string
 */
function formatErrorJson(err: unknown): string {
  const { title, message, stack } = extractErrorInfo(err);
  const options: ReturnType<typeof getOutputOptions> = getOutputOptions();

  const output: Record<string, unknown> = {
    type: 'error',
    title,
    message
  };

  if (options.verbose && stack) {
    output['stack'] = stack;
  }

  return JSON.stringify(output, null, 2);
}

/**
 * ### printer
 *
 * CLI output utilities for formatted messages, errors, and spinners.
 */
export const printer = {
  /**
   * ### fail
   *
   * Displays a CLI error in a styled box or JSON format.
   *
   * Parameters:
   * - `error` - CLI error to display - see {@link CliError}
   */
  fail: (error: CliError): void => {
    const options: ReturnType<typeof getOutputOptions> = getOutputOptions();
    if (options.json) {
      console.error(formatFailJson(error));
      return;
    }

    console.error(
      formatBoxedError(
        error.title,
        error.message,
        error.code,
        error.suggestions,
        error.hints,
        'fail'
      )
    );

    if (options.verbose && error.cause) {
      const cause: unknown = error.cause;
      let causeStr: string;
      if (cause instanceof Error) {
        causeStr = cause.stack ?? cause.message;
      } else if (typeof cause === 'string') {
        causeStr = cause;
      } else {
        causeStr = JSON.stringify(cause);
      }
      console.error(dim('Cause:'));
      console.error(dim(causeStr));
      console.error('');
    }
  },

  /**
   * ### error
   *
   * Displays an unexpected error in a styled box or JSON format.
   *
   * Parameters:
   * - `err` - Unknown error value
   */
  error: (err: unknown): void => {
    const options: ReturnType<typeof getOutputOptions> = getOutputOptions();
    if (options.json) {
      console.error(formatErrorJson(err));
      return;
    }
    const { title, message, stack } = extractErrorInfo(err);
    console.error(
      formatBoxedError(
        title,
        message,
        undefined,
        ['This is an unexpected error. Please report it if it persists.'],
        undefined,
        'error'
      )
    );

    if (options.verbose && stack) {
      console.error(dim('Stack trace:'));
      console.error(dim(stack));
      console.error('');
    }
  },

  /**
   * ### rollbackWarning
   *
   * Displays a warning about incomplete rollback operations.
   *
   * Parameters:
   * - `failures` - Array of failed rollback action descriptions
   */
  rollbackWarning: (failures: string[]): void => {
    const options: ReturnType<typeof getOutputOptions> = getOutputOptions();
    if (options.json) {
      console.error(
        JSON.stringify(
          {
            type: 'rollback_warning',
            message: 'Some cleanup actions failed during rollback',
            failures
          },
          null,
          2
        )
      );
      return;
    }
    console.error(
      formatBoxedError(
        'Rollback Incomplete',
        'Some cleanup actions failed during error recovery.',
        undefined,
        failures,
        ['You may need to manually clean up these resources.'],
        'warning'
      )
    );
  },

  /**
   * ### success
   *
   * Displays a success message with checkmark icon.
   *
   * Parameters:
   * - `message` - Success message text
   */
  success: (message: string): void => {
    console.log(`${greenBright(ICONS.success)} ${message}`);
  },

  /**
   * ### step
   *
   * Displays a step/progress message with arrow icon.
   *
   * Parameters:
   * - `message` - Step message text
   */
  step: (message: string): void => {
    console.log(`${dim(ICONS.step)} ${message}`);
  },

  /**
   * ### warning
   *
   * Displays a warning message with warning icon.
   *
   * Parameters:
   * - `message` - Warning message text
   */
  warning: (message: string): void => {
    console.log(`${yellow(ICONS.warning)} ${message}`);
  },

  /**
   * ### info
   *
   * Displays an info message with info icon.
   *
   * Parameters:
   * - `message` - Info message text
   */
  info: (message: string): void => {
    console.log(`${blueBright(ICONS.info)} ${message}`);
  },

  /**
   * ### abortDetected
   *
   * Displays a message when user abort (Ctrl+C) is detected.
   */
  abortDetected: (): void => {
    console.log(
      `${yellow(ICONS.warning)} ${bold('Abort detected.')} Rollback will start after current task completes.`
    );
    console.log(
      dim('   Press Ctrl+C again to force quit (may leave incomplete changes).')
    );
  },

  /**
   * ### forceExit
   *
   * Displays a message when force quit is triggered.
   */
  forceExit: (): void => {
    console.log(`${redBright(ICONS.error)} ${bold('Force quitting...')}`);
  },

  /**
   * ### rollbackStart
   *
   * Displays a message when rollback process begins.
   */
  rollbackStart: (): void => {
    console.log('');
    console.log(
      `${yellow(ICONS.warning)} ${bold('Rolling back changes, please do not interrupt...')}`
    );
    console.log(
      dim('   Press Ctrl+C to force quit (may leave incomplete changes).')
    );
  },

  /**
   * ### rollbackComplete
   *
   * Displays a message when rollback completes successfully.
   */
  rollbackComplete: (): void => {
    console.log(`${greenBright(ICONS.success)} ${dim('Rollback complete.')}`);
  },

  /**
   * ### header
   *
   * Displays a section header with underline.
   *
   * Parameters:
   * - `title` - Header title text
   */
  header: (title: string): void => {
    console.log('');
    console.log(bold(title));
    console.log(dim('─'.repeat(40)));
  },

  /**
   * ### keyValue
   *
   * Displays a key-value pair with formatting.
   *
   * Parameters:
   * - `key` - Label for the value
   * - `value` - Value to display
   */
  keyValue: (key: string, value: string): void => {
    console.log(`  ${dim(key + ':')} ${value}`);
  },

  /**
   * ### spacer
   *
   * Outputs an empty line for visual spacing.
   */
  spacer: (): void => {
    console.log('');
  },

  /**
   * ### text
   *
   * Displays plain text with optional indentation.
   *
   * Parameters:
   * - `message` - Text to display
   * - `indent` - Number of spaces to indent (defaults to 0)
   */
  text: (message: string, indent = 0): void => {
    const padding = indent > 0 ? ' '.repeat(indent) : '';
    console.log(`${padding}${message}`);
  },

  /**
   * ### createSpinner
   *
   * Creates an ora spinner instance with default options.
   *
   * Parameters:
   * - `text` - Spinner text
   * - `options` - Additional ora options (optional)
   *
   * @returns `Ora` - Spinner instance - see {@link Ora}
   */
  createSpinner: (text: string, options?: OraOptions): Ora => {
    return ora({
      ...DEFAULT_SPINNER_OPTIONS,
      ...options,
      text
    });
  },

  /**
   * ### withSpinner
   *
   * Wraps an async task with a spinner that shows progress and result.
   *
   * Type Parameters:
   * - `T` - Task result type
   *
   * Parameters:
   * - `task` - Promise to execute
   * - `messages` - Spinner messages configuration - see {@link SpinnerTask}
   * - `options` - Additional ora options (optional)
   *
   * @returns `Promise<T>` - Task result
   *
   * @throws Re-throws any error from the task after displaying failure message
   */
  withSpinner: async <T>(
    task: Promise<T>,
    messages: SpinnerTask<T>,
    options?: OraOptions
  ): Promise<T> => {
    const spinner: Ora = printer.createSpinner(messages.start, options);
    spinner.start();

    try {
      const result: T = await task;
      const successMessage: string =
        typeof messages.success === 'function'
          ? messages.success(result)
          : (messages.success ?? messages.start.replace(/\.{3}$/, ''));
      spinner.succeed(successMessage);
      return result;
    } catch (error) {
      const failMessage: string = messages.fail ?? 'Operation failed';
      spinner.fail(failMessage);
      throw error;
    }
  }
};

export const {
  fail,
  error,
  rollbackWarning,
  abortDetected,
  forceExit,
  rollbackStart,
  rollbackComplete,
  success,
  step,
  warning,
  info,
  header,
  keyValue,
  spacer,
  text,
  createSpinner,
  withSpinner
} = printer;
