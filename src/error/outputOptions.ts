/**
 * ### OutputOptions
 *
 * Configuration options for CLI output formatting.
 *
 * Fields:
 * - `verbose` - Enable verbose output
 * - `json` - Enable JSON output format
 */
interface OutputOptions {
  verbose: boolean;
  json: boolean;
}

/**
 * ### options
 *
 * Internal state for output options.
 */
const options: OutputOptions = {
  verbose: false,
  json: false
};

/**
 * ### setVerbose
 *
 * Sets the verbose output mode.
 *
 * Parameters:
 * - `value` - Whether to enable verbose output
 */
export function setVerbose(value: boolean): void {
  options.verbose = value;
}

/**
 * ### isVerbose
 *
 * Checks if verbose output mode is enabled.
 *
 * @returns `boolean` - True if verbose mode is enabled
 */
export function isVerbose(): boolean {
  return options.verbose;
}

/**
 * ### setJson
 *
 * Sets the JSON output mode.
 *
 * Parameters:
 * - `value` - Whether to enable JSON output
 */
export function setJson(value: boolean): void {
  options.json = value;
}

/**
 * ### isJson
 *
 * Checks if JSON output mode is enabled.
 *
 * @returns `boolean` - True if JSON mode is enabled
 */
export function isJson(): boolean {
  return options.json;
}

/**
 * ### getOutputOptions
 *
 * Returns the current output options.
 *
 * @returns `Readonly<OutputOptions>` - The current output options - see {@link OutputOptions}
 */
export function getOutputOptions(): Readonly<OutputOptions> {
  return options;
}
