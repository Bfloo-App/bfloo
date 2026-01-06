// Package imports
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type z from 'zod';

// Project imports
import { getSchemaSnapshotDir } from './manifest';
import { getSchemaDir } from './paths';
import { addSpacesBetweenSeqItems } from './yaml';
import { getStoredSnapshotSchema, getWorkingSnapshotSchema } from '$schemas';
import { CliError } from '$error';
import { PATHS, type SupportedEngineKey } from '$constants';
import type { ZodSafeParseResult } from 'zod';

/**
 * ### getSnapshotsDir
 *
 * Returns the path to a schema's stored snapshots directory.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaName` - Local key for the schema
 *
 * @returns `string` - Path to the snapshots directory
 */
export function getSnapshotsDir(
  projectRoot: string,
  schemaName: string
): string {
  return path.join(
    getSchemaSnapshotDir(projectRoot, schemaName),
    PATHS.snapshotsDir
  );
}

/**
 * ### getStoredSnapshotPath
 *
 * Returns the path to a specific stored snapshot file.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaName` - Local key for the schema
 * - `filename` - Snapshot filename
 *
 * @returns `string` - Path to the stored snapshot file
 */
export function getStoredSnapshotPath(
  projectRoot: string,
  schemaName: string,
  filename: string
): string {
  return path.join(getSnapshotsDir(projectRoot, schemaName), filename);
}

/**
 * ### getWorkingSnapshotPath
 *
 * Returns the path to a schema's working snapshot file.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaDir` - Relative path to the schema directory
 * - `schemaName` - Local key for the schema
 *
 * @returns `string` - Path to the working snapshot file
 */
export function getWorkingSnapshotPath(
  projectRoot: string,
  schemaDir: string,
  schemaName: string
): string {
  return path.join(getSchemaDir(projectRoot, schemaDir), `${schemaName}.yml`);
}

/**
 * ### storedSnapshotExists
 *
 * Checks if a stored snapshot file exists.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaName` - Local key for the schema
 * - `filename` - Snapshot filename
 *
 * @returns `boolean` - True if the snapshot file exists
 */
export function storedSnapshotExists(
  projectRoot: string,
  schemaName: string,
  filename: string
): boolean {
  return fs.existsSync(
    getStoredSnapshotPath(projectRoot, schemaName, filename)
  );
}

/**
 * ### readStoredSnapshot
 *
 * Reads and validates a stored snapshot file.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaName` - Local key for the schema
 * - `filename` - Snapshot filename
 * - `engineKey` - Engine key for schema validation - see {@link SupportedEngineKey}
 *
 * @returns `StoredSnapshot` - The parsed snapshot - see {@link getStoredSnapshotSchema}
 *
 * @throws `CliError` - When snapshot is not found or invalid
 */
export function readStoredSnapshot(
  projectRoot: string,
  schemaName: string,
  filename: string,
  engineKey: SupportedEngineKey
): z.infer<ReturnType<typeof getStoredSnapshotSchema>> {
  const snapshotPath: string = getStoredSnapshotPath(
    projectRoot,
    schemaName,
    filename
  );

  if (!fs.existsSync(snapshotPath)) {
    throw new CliError({
      title: 'Stored snapshot not found',
      message: `Could not find stored snapshot at "${snapshotPath}"`,
      suggestions: ['Check that the snapshot file exists']
    });
  }

  const content: string = fs.readFileSync(snapshotPath, 'utf-8');
  const parsed: unknown = yaml.parse(content, { logLevel: 'silent' });
  const StoredSnapshot_Schema = getStoredSnapshotSchema(engineKey);
  const result: ZodSafeParseResult<z.infer<typeof StoredSnapshot_Schema>> =
    StoredSnapshot_Schema.safeParse(parsed);

  if (!result.success) {
    throw new CliError({
      title: 'Invalid stored snapshot',
      message: `The stored snapshot at "${snapshotPath}" has validation errors`,
      hints: result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      ),
      suggestions: ['Check the snapshot file syntax and structure']
    });
  }

  return result.data;
}

/**
 * ### writeStoredSnapshot
 *
 * Writes a stored snapshot file to disk.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaName` - Local key for the schema
 * - `filename` - Snapshot filename
 * - `data` - Snapshot data to write - see {@link getStoredSnapshotSchema}
 */
export function writeStoredSnapshot(
  projectRoot: string,
  schemaName: string,
  filename: string,
  data: z.infer<ReturnType<typeof getStoredSnapshotSchema>>
): void {
  const snapshotsDir: string = getSnapshotsDir(projectRoot, schemaName);
  const snapshotPath: string = getStoredSnapshotPath(
    projectRoot,
    schemaName,
    filename
  );

  // Create snapshots directory if it doesn't exist
  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir, { recursive: true });
  }

  const yamlContent: string = yaml.stringify(data, { indent: 2 });
  fs.writeFileSync(snapshotPath, yamlContent, 'utf-8');
}

/**
 * ### workingSnapshotExists
 *
 * Checks if a working snapshot file exists.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaDir` - Relative path to the schema directory
 * - `schemaName` - Local key for the schema
 *
 * @returns `boolean` - True if the working snapshot exists
 */
export function workingSnapshotExists(
  projectRoot: string,
  schemaDir: string,
  schemaName: string
): boolean {
  return fs.existsSync(
    getWorkingSnapshotPath(projectRoot, schemaDir, schemaName)
  );
}

/**
 * ### readWorkingSnapshot
 *
 * Reads and validates a working snapshot file.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaDir` - Relative path to the schema directory
 * - `schemaName` - Local key for the schema
 * - `engineKey` - Engine key for schema validation - see {@link SupportedEngineKey}
 *
 * @returns `WorkingSnapshot` - The parsed snapshot - see {@link getWorkingSnapshotSchema}
 *
 * @throws `CliError` - When snapshot is not found or invalid
 */
export function readWorkingSnapshot(
  projectRoot: string,
  schemaDir: string,
  schemaName: string,
  engineKey: SupportedEngineKey
): z.infer<ReturnType<typeof getWorkingSnapshotSchema>> {
  const workingPath: string = getWorkingSnapshotPath(
    projectRoot,
    schemaDir,
    schemaName
  );

  if (!fs.existsSync(workingPath)) {
    throw new CliError({
      title: 'Working snapshot not found',
      message: `Could not find working snapshot at "${workingPath}"`,
      suggestions: ['Check that the schema has been initialized']
    });
  }

  const content: string = fs.readFileSync(workingPath, 'utf-8');
  const parsed: unknown = yaml.parse(content, { logLevel: 'silent' });
  const WorkingSnapshot_Schema = getWorkingSnapshotSchema(engineKey);
  const result: ZodSafeParseResult<z.infer<typeof WorkingSnapshot_Schema>> =
    WorkingSnapshot_Schema.safeParse(parsed);

  if (!result.success) {
    throw new CliError({
      title: 'Invalid working snapshot',
      message: `The working snapshot at "${workingPath}" has validation errors`,
      hints: result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      ),
      suggestions: ['Check the working snapshot file syntax and structure']
    });
  }

  return result.data;
}

/**
 * ### writeWorkingSnapshot
 *
 * Writes a working snapshot file with formatted YAML output.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaDir` - Relative path to the schema directory
 * - `schemaName` - Local key for the schema
 * - `data` - Snapshot data to write - see {@link getWorkingSnapshotSchema}
 */
export function writeWorkingSnapshot(
  projectRoot: string,
  schemaDir: string,
  schemaName: string,
  data: z.infer<ReturnType<typeof getWorkingSnapshotSchema>>
): void {
  const schemaDirPath: string = getSchemaDir(projectRoot, schemaDir);
  const workingPath: string = getWorkingSnapshotPath(
    projectRoot,
    schemaDir,
    schemaName
  );

  // Create schema directory if it doesn't exist
  if (!fs.existsSync(schemaDirPath)) {
    fs.mkdirSync(schemaDirPath, { recursive: true });
  }

  // Create a YAML document for advanced formatting
  const doc = new yaml.Document(data);

  // Get the root map to access key-value pairs
  const rootMap: yaml.Node | null = doc.contents;

  if (yaml.isMap(rootMap)) {
    // Find the 'schema' and 'snapshot' pairs
    for (const pair of rootMap.items) {
      if (yaml.isScalar(pair.key)) {
        if (pair.key.value === 'schema') {
          // Add comment before schema key
          pair.key.commentBefore = [
            ' NOTE: Schema name and description are detached from remote.',
            ' Changes made here will NOT be reflected on the remote server.',
            ' Only the local display values are affected.'
          ].join('\n');
        } else if (pair.key.value === 'snapshot') {
          // Add space before snapshot key
          pair.key.spaceBefore = true;

          // Add spaces between tables, columns, and constraints
          if (yaml.isMap(pair.value)) {
            const tablesNode = pair.value.get('tables', true);

            if (yaml.isSeq(tablesNode)) {
              addSpacesBetweenSeqItems(tablesNode);

              // For each table, add spaces between columns and constraints
              for (const tableItem of tablesNode.items) {
                if (yaml.isMap(tableItem)) {
                  const columnsNode = tableItem.get('columns', true);

                  if (yaml.isSeq(columnsNode)) {
                    addSpacesBetweenSeqItems(columnsNode);
                  }

                  const constraintsNode = tableItem.get('constraints', true);

                  if (yaml.isSeq(constraintsNode)) {
                    addSpacesBetweenSeqItems(constraintsNode);
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  const yamlContent: string = doc.toString({ indent: 2 });
  fs.writeFileSync(workingPath, yamlContent, 'utf-8');
}
