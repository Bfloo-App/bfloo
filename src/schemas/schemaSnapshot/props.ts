// Package imports
import z from 'zod';

// Project imports
import { Schema_IdProp } from '../schema/props';
import { Psql15_0_TableSchema } from '$schemas/postgresql';
import {
  ENGINE_KEY_POSTGRESQL_15_0,
  PSQL_VERSION_15_0,
  type SupportedEngineKey
} from '$constants';
import { CliError } from '$error';

/**
 * ### SchemaSnapshot_IdProp
 *
 * Zod schema validator for schema snapshot unique identifier.
 */
export const SchemaSnapshot_IdProp = z.uuidv4();

/**
 * ### SchemaSnapshot_ParentIdProp
 *
 * Zod schema validator for optional parent snapshot identifier.
 */
export const SchemaSnapshot_ParentIdProp = z.uuidv4().nullable();

/**
 * ### SchemaSnapshot_LabelProp
 *
 * Zod schema validator for snapshot label (1-64 characters).
 * Only allows letters, numbers, hyphens, underscores, dots, plus signs, and at signs.
 * This supports semantic versioning (e.g., v1.0.0, 1.2.3-beta.1, 1.0.0+build.123).
 */
export const SchemaSnapshot_LabelProp = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9._+@-]+$/);

/**
 * ### SchemaSnapshot_DescriptionProp
 *
 * Zod schema validator for optional snapshot description (max 256 characters).
 */
export const SchemaSnapshot_DescriptionProp = z
  .string()
  .trim()
  .max(256)
  .nullable();

/**
 * ### SchemaSnapshot_StatusProp
 *
 * Zod schema validator for snapshot status (draft or done).
 */
export const SchemaSnapshot_StatusProp = z.enum(['draft', 'done']);

/**
 * ### SchemaSnapshot_CreatedAtProp
 *
 * Zod schema validator for snapshot creation timestamp.
 */
export const SchemaSnapshot_CreatedAtProp = z.coerce.date();

/**
 * ### SchemaSnapshot_UpdatedAtProp
 *
 * Zod schema validator for snapshot last update timestamp.
 */
export const SchemaSnapshot_UpdatedAtProp = z.coerce.date();

/**
 * ### SchemaSnapshot_ContentHashProp
 *
 * Zod schema validator for snapshot content hash.
 * SHA-256 hash of snapshot data using RFC 8785 JSON Canonicalization.
 *
 * Format: `sha256:<64-char-hex>`
 */
export const SchemaSnapshot_ContentHashProp = z
  .string()
  .regex(/^sha256:[a-f0-9]{64}$/);

/**
 * ### SchemaSnapshot_BaseProps
 *
 * Shared base properties for all schema snapshot variants.
 * Used as foundation for discriminated union variants.
 */
export const SchemaSnapshot_BaseProps = {
  id: SchemaSnapshot_IdProp,
  schemaId: Schema_IdProp,
  parentId: SchemaSnapshot_ParentIdProp,
  label: SchemaSnapshot_LabelProp,
  description: SchemaSnapshot_DescriptionProp,
  status: SchemaSnapshot_StatusProp,
  contentHash: SchemaSnapshot_ContentHashProp,
  createdAt: SchemaSnapshot_CreatedAtProp,
  updatedAt: SchemaSnapshot_UpdatedAtProp
};

// ─────────────────────────────────────────────────────────────
// Stored/Working Snapshot Props
// ─────────────────────────────────────────────────────────────

/**
 * ### StoredSnapshot_DescriptionProp
 *
 * Zod schema for optional snapshot description in stored/working files (max 256 characters).
 */
export const StoredSnapshot_DescriptionProp = z
  .string()
  .trim()
  .max(256)
  .optional();

/**
 * ### getTablesSchema
 *
 * Returns the appropriate tables array Zod schema for a given engine key.
 *
 * @param engineKey - The engine:version composite key (e.g., 'postgresql:v15.0')
 * @returns Zod array schema for tables validated against the engine's table schema
 * @throws {CliError} If the engine key is not supported
 */
export function getTablesSchema(engineKey: SupportedEngineKey) {
  switch (engineKey) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Extensibility pattern for future engines
    case ENGINE_KEY_POSTGRESQL_15_0:
      return z.array(Psql15_0_TableSchema);

    //--------------------------------------------------
    // Add new engine:version variants here:
    //--------------------------------------------------
    // case ENGINE_KEY_POSTGRESQL_16_0:
    //   return z.array(Psql16_0_TableSchema);
    // case ENGINE_KEY_MYSQL_8_0:
    //   return z.array(Mysql8_0_TableSchema);

    default: {
      const _exhaustiveCheck: never = engineKey;
      throw new CliError({
        title: 'Unsupported Engine Key',
        message: `The engine key "${String(_exhaustiveCheck)}" is not supported`,
        suggestions: [
          'Check that you are using a supported database engine and version'
        ]
      });
    }
  }
}

/**
 * ### getEngineVersionSchema
 *
 * Returns a Zod literal schema for the engine version based on the engine key.
 * This ensures the engine-version field in working snapshots matches the
 * expected version for the schema's engine.
 *
 * @param engineKey - The engine:version composite key (e.g., 'postgresql:v15.0')
 * @returns Zod literal schema for the specific engine version
 * @throws {CliError} If the engine key is not supported
 */
export function getEngineVersionSchema(engineKey: SupportedEngineKey) {
  switch (engineKey) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Extensibility pattern for future engines
    case ENGINE_KEY_POSTGRESQL_15_0:
      return z.literal(PSQL_VERSION_15_0);

    //--------------------------------------------------
    // Add new engine:version variants here:
    //--------------------------------------------------
    // case ENGINE_KEY_POSTGRESQL_16_0:
    //   return z.literal(PSQL_VERSION_16_0);
    // case ENGINE_KEY_MYSQL_8_0:
    //   return z.literal(MYSQL_VERSION_8_0);

    default: {
      const _exhaustiveCheck: never = engineKey;
      throw new CliError({
        title: 'Unsupported Engine Key',
        message: `The engine key "${String(_exhaustiveCheck)}" is not supported`,
        suggestions: [
          'Check that you are using a supported database engine and version'
        ]
      });
    }
  }
}
