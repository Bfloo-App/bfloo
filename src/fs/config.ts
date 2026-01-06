// Package imports
import * as fs from 'fs';
import * as yaml from 'yaml';
import { type ZodSafeParseResult, z } from 'zod';

// Project imports
import { getConfigPath } from './paths';
import { addSpacesBetweenMapEntries } from './yaml';
import { BflooConfig_Schema, Config_SchemaSchema } from '$schemas';
import { CliError } from '$error';

/**
 * ### configExists
 *
 * Checks if a bfloo configuration file exists in the project.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 *
 * @returns `boolean` - True if config file exists
 */
export function configExists(projectRoot: string): boolean {
  return fs.existsSync(getConfigPath(projectRoot));
}

/**
 * ### readConfig
 *
 * Reads and validates the bfloo configuration file.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 *
 * @returns `BflooConfig` - The parsed configuration - see {@link BflooConfig_Schema}
 *
 * @throws `CliError` - When config file is not found or invalid
 */
export function readConfig(
  projectRoot: string
): z.infer<typeof BflooConfig_Schema> {
  const configPath: string = getConfigPath(projectRoot);

  if (!fs.existsSync(configPath)) {
    throw new CliError({
      title: 'Configuration not found',
      message: `Could not find configuration file at "${configPath}"`,
      suggestions: ['Run "bfloo init" to initialize a project']
    });
  }

  const content: string = fs.readFileSync(configPath, 'utf-8');
  const parsed: unknown = yaml.parse(content, { logLevel: 'silent' });
  const result: ZodSafeParseResult<z.infer<typeof BflooConfig_Schema>> =
    BflooConfig_Schema.safeParse(parsed);

  if (!result.success) {
    throw new CliError({
      title: 'Invalid config',
      message: 'The config file has validation errors',
      suggestions: ['Check your bfloo.yml syntax']
    });
  }

  return result.data;
}

/**
 * ### writeConfig
 *
 * Writes the bfloo configuration to disk.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `config` - Configuration object to write - see {@link BflooConfig_Schema}
 */
export function writeConfig(
  projectRoot: string,
  config: z.infer<typeof BflooConfig_Schema>
): void {
  const configPath: string = getConfigPath(projectRoot);

  // Create a YAML document to enable spaceBefore on schema entries
  const doc = new yaml.Document(config);

  // Add blank lines between schema entries for readability
  const schemasNode: unknown = doc.get('schemas', true);

  if (yaml.isMap(schemasNode)) {
    addSpacesBetweenMapEntries(schemasNode);
  }

  const yamlContent: string = doc.toString({ indent: 2 });
  fs.writeFileSync(configPath, yamlContent, 'utf-8');
}

/**
 * ### createInitialConfig
 *
 * Creates an initial bfloo configuration with a single schema.
 *
 * Parameters:
 * - `schemaName` - Local key for the schema
 * - `schemaConfig` - Schema configuration - see {@link Config_SchemaSchema}
 *
 * @returns `BflooConfig` - The initial configuration - see {@link BflooConfig_Schema}
 */
export function createInitialConfig(
  schemaName: string,
  schemaConfig: z.infer<typeof Config_SchemaSchema>
): z.infer<typeof BflooConfig_Schema> {
  return {
    schemas: {
      [schemaName]: schemaConfig
    }
  };
}

/**
 * ### normalizeSchemaName
 *
 * Normalizes a schema name for use as a local key.
 *
 * Parameters:
 * - `name` - Schema name to normalize
 *
 * @returns `string` - The normalized schema name
 */
export function normalizeSchemaName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9._-]/g, '');
}
