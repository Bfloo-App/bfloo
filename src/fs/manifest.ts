// Package imports
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type { ZodSafeParseResult, z } from 'zod';

// Project imports
import { getBflooDir } from './paths';
import { addSpacesBetweenMapEntries } from './yaml';
import {
  getManifestSchema,
  getManifestSnapshotEntrySchema,
  SchemaSnapshot_Schema
} from '$schemas';
import { CliError } from '$error';
import { PATHS, type SupportedDatabaseEngine } from '$constants';
import { computeSnapshotContentHash } from '$utils';

/**
 * ### getSchemaSnapshotDir
 *
 * Returns the path to a schema's snapshot directory in .bfloo.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaName` - Local key for the schema
 *
 * @returns `string` - Path to the schema snapshot directory
 */
export function getSchemaSnapshotDir(
  projectRoot: string,
  schemaName: string
): string {
  return path.join(getBflooDir(projectRoot), schemaName);
}

/**
 * ### getManifestPath
 *
 * Returns the path to a schema's manifest file.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaName` - Local key for the schema
 *
 * @returns `string` - Path to the manifest file
 */
export function getManifestPath(
  projectRoot: string,
  schemaName: string
): string {
  return path.join(
    getSchemaSnapshotDir(projectRoot, schemaName),
    PATHS.manifestFile
  );
}

/**
 * ### getSnapshotFilename
 *
 * Generates a filename for a stored snapshot based on date and label.
 *
 * Parameters:
 * - `createdAt` - Creation date of the snapshot
 * - `label` - Label for the snapshot
 *
 * @returns `string` - The generated filename
 *
 * @throws `CliError` - When date extraction fails
 */
export function getSnapshotFilename(
  createdAt: string | Date,
  label: string
): string {
  const date: Date =
    typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const dateStr: string | undefined = date.toISOString().split('T')[0];

  if (!dateStr) {
    throw new CliError({
      title: 'Internal Error',
      message: 'Failed to extract date from ISO string',
      hints: [`Input date: ${date.toISOString()}`],
      suggestions: ['Please report this issue']
    });
  }

  return `${dateStr}_${label}.yml`;
}

/**
 * ### manifestExists
 *
 * Checks if a manifest file exists for a schema.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaName` - Local key for the schema
 *
 * @returns `boolean` - True if manifest exists
 */
export function manifestExists(
  projectRoot: string,
  schemaName: string
): boolean {
  return fs.existsSync(getManifestPath(projectRoot, schemaName));
}

/**
 * ### readManifest
 *
 * Reads and validates a schema's manifest file.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaName` - Local key for the schema
 * - `engine` - Database engine type - see {@link SupportedDatabaseEngine}
 *
 * @returns `Manifest` - The parsed manifest - see {@link getManifestSchema}
 *
 * @throws `CliError` - When manifest is not found or invalid
 */
export function readManifest(
  projectRoot: string,
  schemaName: string,
  engine: SupportedDatabaseEngine
): z.infer<ReturnType<typeof getManifestSchema>> {
  const manifestPath: string = getManifestPath(projectRoot, schemaName);

  if (!fs.existsSync(manifestPath)) {
    throw new CliError({
      title: 'Manifest not found',
      message: `Could not find manifest file at "${manifestPath}"`,
      suggestions: ['Run "bfloo init" to initialize the project']
    });
  }

  const content: string = fs.readFileSync(manifestPath, 'utf-8');
  const parsed: unknown = yaml.parse(content, { logLevel: 'silent' });
  const Manifest_Schema = getManifestSchema(engine);
  const result: ZodSafeParseResult<z.infer<typeof Manifest_Schema>> =
    Manifest_Schema.safeParse(parsed);

  if (!result.success) {
    throw new CliError({
      title: 'Invalid manifest',
      message: `The manifest file at "${manifestPath}" has validation errors`,
      suggestions: [
        'Check your manifest.yml syntax or re-initialize the schema'
      ]
    });
  }

  return result.data;
}

/**
 * ### writeManifest
 *
 * Writes a manifest file to disk with proper formatting.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaName` - Local key for the schema
 * - `manifest` - Manifest data to write - see {@link getManifestSchema}
 */
export function writeManifest(
  projectRoot: string,
  schemaName: string,
  manifest: z.infer<ReturnType<typeof getManifestSchema>>
): void {
  const schemaDir: string = getSchemaSnapshotDir(projectRoot, schemaName);
  const manifestPath: string = getManifestPath(projectRoot, schemaName);

  // Create schema directory if it doesn't exist
  if (!fs.existsSync(schemaDir)) {
    fs.mkdirSync(schemaDir, { recursive: true });
  }

  // Create a YAML document to enable spaceBefore on snapshot entries
  const doc = new yaml.Document(manifest);

  // Add warning comment at the top
  doc.commentBefore = [
    ' WARNING: This file is managed by bfloo CLI.',
    ' Manual modifications may lead to data corruption or sync issues.',
    ' Use bfloo commands to manage snapshots safely.'
  ].join('\n');

  // Add blank lines between snapshot entries for readability
  const snapshotsNode = doc.get('snapshots', true);

  if (yaml.isMap(snapshotsNode)) {
    addSpacesBetweenMapEntries(snapshotsNode);
  }

  const yamlContent: string = doc.toString({ indent: 2 });
  fs.writeFileSync(manifestPath, yamlContent, 'utf-8');
}

/**
 * ### buildManifestFromSnapshots
 *
 * Builds a manifest from an array of snapshots fetched from the API.
 *
 * Parameters:
 * - `schemaId` - Remote schema ID
 * - `snapshots` - Array of snapshots - see {@link SchemaSnapshot_Schema}
 *
 * @returns `Manifest` - The built manifest - see {@link getManifestSchema}
 *
 * @throws `CliError` - When hash verification fails or snapshot processing fails
 */
export function buildManifestFromSnapshots(
  schemaId: string,
  snapshots: z.infer<typeof SchemaSnapshot_Schema>[]
): z.infer<ReturnType<typeof getManifestSchema>> {
  // Find the current snapshot (latest by createdAt)
  const sortedSnapshots: z.infer<typeof SchemaSnapshot_Schema>[] = [
    ...snapshots
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const currentSnapshot = sortedSnapshots[0];

  if (!currentSnapshot) {
    throw new CliError({
      title: 'Internal Error',
      message: 'Failed to determine current snapshot after sorting',
      suggestions: ['Please report this issue']
    });
  }

  const currentSnapshotId: string = currentSnapshot.id;

  // Build manifest entries
  const manifestSnapshots: z.infer<
    ReturnType<typeof getManifestSchema>
  >['snapshots'] = {};

  for (const snapshot of snapshots) {
    // Verify hash integrity
    const computedHash: string = computeSnapshotContentHash(snapshot);

    if (computedHash !== snapshot.contentHash) {
      throw new CliError({
        title: 'Hash Verification Failed',
        message: `Content hash mismatch for snapshot "${snapshot.label}" (${snapshot.id})`,
        hints: [
          `Expected: ${snapshot.contentHash}`,
          `Computed: ${computedHash}`
        ],
        suggestions: [
          'This may indicate data corruption during transfer',
          'Try running the command again'
        ]
      });
    }

    const isCurrent: boolean = snapshot.id === currentSnapshotId;
    const file: string = isCurrent
      ? 'current'
      : getSnapshotFilename(snapshot.createdAt, snapshot.label);

    const entry: z.infer<ReturnType<typeof getManifestSnapshotEntrySchema>> = {
      label: snapshot.label,
      'parent-id': snapshot.parentId,
      status: snapshot.status,
      'database-version': snapshot.engineVersion,
      'created-at': snapshot.createdAt.toISOString(),
      file,
      'content-hash': snapshot.contentHash,
      'sync-state': 'synced',
      'synced-at': new Date().toISOString()
    };

    manifestSnapshots[snapshot.id] = entry;
  }

  return { 'schema-id': schemaId, snapshots: manifestSnapshots };
}

/**
 * ### findSchemaIdInManifests
 *
 * Searches all manifests for a specific schema ID.
 *
 * Parameters:
 * - `projectRoot` - Root directory of the project
 * - `schemaId` - Remote schema ID to find
 *
 * @returns `string | null` - The local key if found, null otherwise
 */
export function findSchemaIdInManifests(
  projectRoot: string,
  schemaId: string
): string | null {
  const bflooDir: string = getBflooDir(projectRoot);

  // If .bfloo directory doesn't exist, no manifests to check
  if (!fs.existsSync(bflooDir)) return null;

  // Get all subdirectories in .bfloo (each is a schema's local key)
  const entries = fs.readdirSync(bflooDir, {
    withFileTypes: true
  });
  const schemaDirs: string[] = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  for (const localKey of schemaDirs) {
    const manifestPath: string = getManifestPath(projectRoot, localKey);

    if (!fs.existsSync(manifestPath)) continue;

    try {
      const content: string = fs.readFileSync(manifestPath, 'utf-8');
      const parsed: unknown = yaml.parse(content, { logLevel: 'silent' });

      // We only need to check the schema-id field, not validate the entire manifest
      if (
        parsed &&
        typeof parsed === 'object' &&
        'schema-id' in parsed &&
        parsed['schema-id'] === schemaId
      ) {
        return localKey;
      }
    } catch {
      // Skip manifests that can't be read/parsed
      continue;
    }
  }

  return null;
}
