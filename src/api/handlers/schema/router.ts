// Project imports
import type { schema_GetByApiKeyHandler } from './getByApiKey';

/**
 * ### Schema_Router
 *
 * Type definition for schema-related API handlers.
 *
 * Fields:
 * - `getByApiKey` - Handler to fetch schema by API key - see {@link schema_GetByApiKeyHandler}
 */
export interface Schema_Router {
  getByApiKey: typeof schema_GetByApiKeyHandler;
}
