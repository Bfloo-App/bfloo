// Package imports
import z from 'zod';

// Project imports
import { SchemaSnapshot_IdProp } from '../schemaSnapshot/props';
import {
  ENGINE_POSTGRESQL,
  SUPPORTED_PSQL_VERSIONS,
  type SupportedDatabaseEngine
} from '$constants';
import { CliError } from '$error';

/**
 * ### Manifest_LocalIdProp
 *
 * Zod schema validator for local snapshot ID (format: `local-<uuid>`).
 */
export const Manifest_LocalIdProp = z
  .string()
  .regex(
    /^local-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
  );

/**
 * ### Manifest_SnapshotIdProp
 *
 * Zod schema validator for snapshot ID (either remote UUID or local ID).
 */
export const Manifest_SnapshotIdProp = z.union([
  SchemaSnapshot_IdProp,
  Manifest_LocalIdProp
]);

/**
 * ### Manifest_ParentIdProp
 *
 * Zod schema validator for optional parent snapshot ID.
 */
export const Manifest_ParentIdProp = Manifest_SnapshotIdProp.nullable();

/**
 * ### Manifest_PsqlVersionProp
 *
 * Zod schema validator for supported PostgreSQL versions.
 */
export const Manifest_PsqlVersionProp = z.enum(SUPPORTED_PSQL_VERSIONS);

/**
 * ### getDatabaseVersionProp
 *
 * Returns the appropriate Zod schema for database version based on engine type.
 *
 * Parameters:
 * - `engine` - Database engine type - see {@link SupportedDatabaseEngine}
 *
 * @returns Zod enum schema for supported versions of the given engine
 *
 * @throws `CliError` - When the database engine is not supported
 */
export function getDatabaseVersionProp(engine: SupportedDatabaseEngine) {
  switch (engine) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Extensibility pattern for future engines
    case ENGINE_POSTGRESQL:
      return Manifest_PsqlVersionProp;
    default: {
      const _exhaustiveCheck: never = engine;
      throw new CliError({
        title: 'Unsupported Database Engine',
        message: `The database engine "${String(_exhaustiveCheck)}" is not supported`,
        suggestions: ['Check that you are using a supported database engine']
      });
    }
  }
}

/**
 * ### Manifest_CreatedAtProp
 *
 * Zod schema validator for snapshot creation timestamp (ISO 8601 datetime).
 */
export const Manifest_CreatedAtProp = z.iso.datetime();

/**
 * ### Manifest_FileProp
 *
 * Zod schema validator for snapshot filename (either 'current' or dated YAML file).
 */
export const Manifest_FileProp = z
  .string()
  .regex(/^(current|[0-9]{4}-[0-9]{2}-[0-9]{2}_[a-zA-Z0-9._+@-]+\.yml)$/);

/**
 * ### Manifest_SyncStateProp
 *
 * Zod schema validator for snapshot synchronization state.
 *
 * Variants:
 * - `synced` - Snapshot is synchronized with remote
 * - `local-only` - Snapshot exists only locally
 * - `orphaned` - Remote snapshot no longer exists
 */
export const Manifest_SyncStateProp = z.enum([
  'synced',
  'local-only',
  'orphaned'
]);

/**
 * ### Manifest_SyncedAtProp
 *
 * Zod schema validator for optional last sync timestamp (ISO 8601 datetime or null).
 */
export const Manifest_SyncedAtProp = z.iso.datetime().nullable();
