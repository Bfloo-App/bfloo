// Package imports
import z from 'zod';

// Project imports
import {
  SchemaSnapshot_LabelProp,
  SchemaSnapshot_StatusProp,
  SchemaSnapshot_ContentHashProp
} from '../schemaSnapshot/props';
import { Schema_IdProp } from '../schema/props';
import {
  Manifest_SnapshotIdProp,
  Manifest_ParentIdProp,
  Manifest_CreatedAtProp,
  Manifest_FileProp,
  Manifest_SyncStateProp,
  Manifest_SyncedAtProp,
  getDatabaseVersionProp
} from './props';
import type { SupportedDatabaseEngine } from '$constants';

/**
 * ### getManifestSnapshotEntrySchema
 *
 * Returns the Zod schema for a manifest snapshot entry based on database engine.
 *
 * Parameters:
 * - `engine` - Database engine type - see {@link SupportedDatabaseEngine}
 *
 * @returns Zod object schema for manifest snapshot entry
 */
export function getManifestSnapshotEntrySchema(
  engine: SupportedDatabaseEngine
) {
  return z.object({
    label: SchemaSnapshot_LabelProp,
    'parent-id': Manifest_ParentIdProp,
    status: SchemaSnapshot_StatusProp,
    'database-version': getDatabaseVersionProp(engine),
    'created-at': Manifest_CreatedAtProp,
    file: Manifest_FileProp,
    'content-hash': SchemaSnapshot_ContentHashProp,
    'sync-state': Manifest_SyncStateProp,
    'synced-at': Manifest_SyncedAtProp
  });
}

/**
 * ### getManifestSchema
 *
 * Returns the Zod schema for a manifest file based on database engine.
 *
 * Parameters:
 * - `engine` - Database engine type - see {@link SupportedDatabaseEngine}
 *
 * @returns Zod object schema for manifest file
 */
export function getManifestSchema(engine: SupportedDatabaseEngine) {
  return z.object({
    'schema-id': Schema_IdProp,
    snapshots: z.record(
      Manifest_SnapshotIdProp,
      getManifestSnapshotEntrySchema(engine)
    )
  });
}
