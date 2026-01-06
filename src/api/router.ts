// Project imports
import type { Schema_Router, SchemaSnapshot_Router } from './handlers';

/**
 * ### ApiClient_Router
 *
 * Type definition for the API client router structure.
 *
 * Fields:
 * - `schema` - Schema handler router - see {@link Schema_Router}
 * - `schemaSnapshot` - Snapshot handler router - see {@link SchemaSnapshot_Router}
 */
export interface ApiClient_Router {
  schema: Schema_Router;
  schemaSnapshot: SchemaSnapshot_Router;
}
