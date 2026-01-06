// Package imports
import z from 'zod';

// Project imports
import { SchemaSnapshot_BaseProps } from './props';
import { Psql15_0_Schema } from '$schemas/postgresql';
import {
  ENGINE_POSTGRESQL,
  PSQL_VERSION_15_0,
  ENGINE_KEY_POSTGRESQL_15_0
} from '$constants';

/**
 * ### SchemaSnapshot_Psql15_0_Schema
 *
 * Zod schema variant for PostgreSQL v15.0 snapshots.
 *
 * Discriminated by:
 * - `engineKey: 'postgresql:v15.0'`
 *
 * Also includes:
 * - `engine: 'postgresql'`
 * - `engineVersion: 'v15.0'`
 */
const SchemaSnapshot_Psql15_0_Schema = z.object({
  ...SchemaSnapshot_BaseProps,
  engine: z.literal(ENGINE_POSTGRESQL),
  engineVersion: z.literal(PSQL_VERSION_15_0),
  engineKey: z.literal(ENGINE_KEY_POSTGRESQL_15_0),
  data: z.union([Psql15_0_Schema, z.null()])
});

/**
 * ### SchemaSnapshot_Schema
 *
 * Zod schema validator for schema snapshot object with camelCase properties.
 *
 * This schema represents the enriched data structure used in application code that includes
 * the engine field from the parent schema.
 *
 * Uses discriminated union on `engineKey` field to enforce correct `engine`, `engineVersion`,
 * and `data` combinations. When new engine/version combos are added, add a new variant.
 *
 * Fields:
 * - `id` - Snapshot unique identifier
 * - `schemaId` - Parent schema identifier
 * - `parentId` - Optional parent snapshot identifier
 * - `label` - Snapshot label
 * - `description` - Optional description
 * - `engine` - Database engine type
 * - `engineVersion` - Engine version
 * - `engineKey` - Composite key (discriminator): `engine:engineVersion`
 * - `status` - Snapshot status
 * - `data` - Optional snapshot JSONB data (validated based on engine/version)
 * - `createdAt` - Creation timestamp
 * - `updatedAt` - Last update timestamp
 */
export const SchemaSnapshot_Schema = z.discriminatedUnion('engineKey', [
  SchemaSnapshot_Psql15_0_Schema

  //--------------------------------------------------
  // Add new engine/version variants here:
  //--------------------------------------------------
  // SchemaSnapshot_Psql16_0_ViewSchema,
  // SchemaSnapshot_Mysql8_0_ViewSchema,
]);
