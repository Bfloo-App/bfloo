// Package imports
import z from 'zod';

// Project imports
import { StoredSnapshot_DescriptionProp, getTablesSchema } from './props';
import type { SupportedEngineKey } from '$constants';

/**
 * ### getStoredSnapshotSchema
 *
 * Returns the Zod schema for a stored snapshot file based on engine key.
 *
 * Parameters:
 * - `engineKey` - Engine:version composite key - see {@link SupportedEngineKey}
 *
 * @returns Zod object schema for stored snapshot file
 */
export function getStoredSnapshotSchema(engineKey: SupportedEngineKey) {
  return z
    .object({
      description: StoredSnapshot_DescriptionProp,
      tables: getTablesSchema(engineKey)
    })
    .strict();
}
