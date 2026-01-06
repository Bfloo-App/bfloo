// Package imports
import z from 'zod';

// Project imports
import {
  SchemaSnapshot_LabelProp,
  StoredSnapshot_DescriptionProp,
  getTablesSchema,
  getEngineVersionSchema
} from './props';
import type { SupportedEngineKey } from '$constants';

/**
 * ### WorkingSnapshot_SchemaNameProp
 *
 * Zod schema validator for schema name in working snapshot (1-64 characters).
 */
export const WorkingSnapshot_SchemaNameProp = z.string().trim().min(1).max(64);

/**
 * ### WorkingSnapshot_SchemaDescriptionProp
 *
 * Zod schema validator for optional schema description in working snapshot (max 256 characters).
 */
export const WorkingSnapshot_SchemaDescriptionProp = z
  .string()
  .trim()
  .max(256)
  .optional();

/**
 * ### getWorkingSnapshotSchema
 *
 * Returns the Zod schema for a working snapshot file based on engine key.
 *
 * Parameters:
 * - `engineKey` - Engine:version composite key - see {@link SupportedEngineKey}
 *
 * @returns Zod object schema for working snapshot file
 *
 * Fields:
 * - `schema` - Local schema metadata
 *   - `name` - Schema display name - see {@link WorkingSnapshot_SchemaNameProp}
 *   - `description` - Schema description (optional) - see {@link WorkingSnapshot_SchemaDescriptionProp}
 * - `snapshot` - Snapshot data (optional)
 *   - `label` - Snapshot label - see {@link SchemaSnapshot_LabelProp}
 *   - `engine-version` - Engine version
 *   - `description` - Snapshot description (optional)
 *   - `tables` - Array of table definitions
 */
export function getWorkingSnapshotSchema(engineKey: SupportedEngineKey) {
  return z
    .object({
      schema: z
        .object({
          name: WorkingSnapshot_SchemaNameProp,
          description: WorkingSnapshot_SchemaDescriptionProp
        })
        .strict(),
      snapshot: z
        .object({
          label: SchemaSnapshot_LabelProp,
          'engine-version': getEngineVersionSchema(engineKey),
          description: StoredSnapshot_DescriptionProp,
          tables: getTablesSchema(engineKey)
        })
        .strict()
        .optional()
    })
    .strict();
}
