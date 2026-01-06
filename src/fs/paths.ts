// Package imports
import * as fs from 'fs';
import * as path from 'path';

// Project imports
import { PATHS } from '$constants';

/**
 * ### findProjectRoot
 *
 * Searches up the directory tree for a bfloo project root.
 *
 * Parameters:
 * - `startDir` - Directory to start searching from (defaults to cwd)
 *
 * @returns `string | null` - Path to project root, or null if not found
 */
export function findProjectRoot(
  startDir: string = process.cwd()
): string | null {
  let currentDir: string = path.resolve(startDir);
  const root: string = path.parse(currentDir).root;

  while (currentDir !== root) {
    const configPath: string = path.join(currentDir, PATHS.configFile);

    if (fs.existsSync(configPath) && fs.statSync(configPath).isFile()) {
      return currentDir;
    }

    currentDir = path.dirname(currentDir);
  }

  // Check root directory as well
  const rootConfigPath: string = path.join(root, PATHS.configFile);
  if (fs.existsSync(rootConfigPath) && fs.statSync(rootConfigPath).isFile()) {
    return root;
  }

  return null;
}

/**
 * ### getBflooDir
 *
 * Returns the path to the .bfloo directory.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 *
 * @returns `string` - Path to the .bfloo directory
 */
export function getBflooDir(projectRoot: string): string {
  return path.join(projectRoot, PATHS.bflooDir);
}

/**
 * ### getConfigPath
 *
 * Returns the path to the bfloo.yml config file.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 *
 * @returns `string` - Path to the config file
 */
export function getConfigPath(projectRoot: string): string {
  return path.join(projectRoot, PATHS.configFile);
}

/**
 * ### getSchemaDir
 *
 * Returns the path to a schema's working directory.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaDir` - Relative path to the schema directory
 *
 * @returns `string` - Full path to the schema directory
 */
export function getSchemaDir(projectRoot: string, schemaDir: string): string {
  return path.join(projectRoot, schemaDir);
}
