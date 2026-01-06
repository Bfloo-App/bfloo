// Project imports
import type { ApiClient_Router } from './router';
import * as handlers from './handlers';

/**
 * ### ApiClient
 *
 * API client for communicating with the bfloo backend.
 *
 * Fields:
 * - `schema` - Schema-related API operations - see {@link Schema_Router}
 * - `schemaSnapshot` - Snapshot-related API operations - see {@link SchemaSnapshot_Router}
 */
export const ApiClient: ApiClient_Router = {
  schema: {
    getByApiKey: handlers.schema_GetByApiKeyHandler
  },
  schemaSnapshot: {
    listByApiKey: handlers.schemaSnapshot_ListByApiKeyHandler
  }
};
