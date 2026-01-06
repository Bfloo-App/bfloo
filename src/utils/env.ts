// Package imports
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Project imports
import { CliError } from '$error';

/**
 * ### ENV_VAR_PATTERN
 *
 * Regex pattern to match environment variable notation (e.g., `${VAR_NAME}`).
 */
const ENV_VAR_PATTERN = /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

/**
 * ### hasEnvVarNotation
 *
 * Checks if a string contains environment variable notation.
 *
 * Parameters:
 * - `value` - String to check for `${VAR_NAME}` patterns
 *
 * @returns `boolean` - True if the string contains env var notation
 */
export function hasEnvVarNotation(value: string): boolean {
  return ENV_VAR_PATTERN.test(value);
}

/**
 * ### resolveEnvVar
 *
 * Resolves environment variable placeholders in a string.
 *
 * Parameters:
 * - `value` - String containing `${VAR_NAME}` placeholders
 * - `envMap` - Map of environment variable names to values
 *
 * @returns `string` - String with all placeholders resolved
 *
 * @throws `CliError` - When a referenced environment variable is not found
 */
export function resolveEnvVar(
  value: string,
  envMap: Record<string, string>
): string {
  return value.replace(ENV_VAR_PATTERN, (match, varName: string) => {
    const resolved = envMap[varName];

    if (resolved === undefined) {
      throw new CliError({
        title: 'Environment variable not found',
        message: `Could not resolve environment variable "${varName}"`,
        suggestions: [
          'Check that the variable is defined in your env-file',
          'Ensure the env-file path is correct in your config'
        ]
      });
    }

    return resolved;
  });
}

/**
 * ### loadEnvFile
 *
 * Loads and parses an environment file from disk.
 *
 * Parameters:
 * - `projectRoot` - Root directory for resolving relative paths
 * - `envFilePath` - Path to the env file (absolute or relative to projectRoot)
 *
 * @returns `Record<string, string>` - Parsed environment variables
 *
 * @throws `CliError` - When the env file is not found
 */
export function loadEnvFile(
  projectRoot: string,
  envFilePath: string
): Record<string, string> {
  const fullPath = path.isAbsolute(envFilePath)
    ? envFilePath
    : path.join(projectRoot, envFilePath);

  if (!fs.existsSync(fullPath)) {
    throw new CliError({
      title: 'Environment file not found',
      message: `Could not find env-file at "${fullPath}"`,
      suggestions: [
        'Check that the env-file path is correct in your config',
        'Create the env-file with your environment variables'
      ]
    });
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  return dotenv.parse(content);
}
