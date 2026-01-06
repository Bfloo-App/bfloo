// Project imports
import type { schemaSnapshot_ListByApiKeyHandler } from './listByApiKey';

/**
 * ### SchemaSnapshot_Router
 *
 * Type definition for schema snapshot-related API handlers.
 *
 * Fields:
 * - `listByApiKey` - Handler to list snapshots by API key - see {@link schemaSnapshot_ListByApiKeyHandler}
 */
export interface SchemaSnapshot_Router {
  listByApiKey: typeof schemaSnapshot_ListByApiKeyHandler;
}
