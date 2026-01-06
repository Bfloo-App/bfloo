// Package imports
import z from 'zod';

// Project imports
import { Config_LocalKeyProp } from './props';
import { Config_PostgresqlSchemaSchema } from './postgresql';

/**
 * ### Config_SchemaSchema
 *
 * Zod discriminated union for schema configurations by engine type.
 * Currently supports PostgreSQL only.
 */
export const Config_SchemaSchema = z.discriminatedUnion('engine', [
  Config_PostgresqlSchemaSchema
]);

/**
 * ### BflooConfig_Schema
 *
 * Zod schema validator for the root bfloo configuration file.
 *
 * Fields:
 * - `schemas` - Record of schema configurations keyed by local name - see {@link Config_SchemaSchema}
 */
export const BflooConfig_Schema = z.object({
  schemas: z.record(Config_LocalKeyProp, Config_SchemaSchema)
});
