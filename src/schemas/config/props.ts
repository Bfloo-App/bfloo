// Package imports
import z from 'zod';

// Project imports
import { PATHS } from '$constants';
import { SchemaApiKey_Schema } from '../schemaApiKey/schema';

/**
 * ### Config_EnvFileProp
 *
 * Zod schema validator for optional environment file path.
 */
export const Config_EnvFileProp = z.string().optional();

/**
 * ### Config_LocalKeyProp
 *
 * Zod schema validator for local schema key (1-64 lowercase chars with dots, hyphens, underscores).
 */
export const Config_LocalKeyProp = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9._-]+$/);

/**
 * ### Config_EnvNameProp
 *
 * Zod schema validator for environment name (1-32 lowercase chars with hyphens, underscores).
 */
export const Config_EnvNameProp = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(/^[a-z0-9_-]+$/);

/**
 * ### Config_DirProp
 *
 * Zod schema validator for schema directory path (defaults to 'schemas').
 */
export const Config_DirProp = z.string().default(PATHS.defaultSchemaDir);

/**
 * ### Config_ApiKeyProp
 *
 * Zod schema validator for API key (either direct key or environment variable reference).
 *
 * Variants:
 * - Direct API key - see {@link SchemaApiKey_Schema}
 * - Environment variable reference (e.g., `${MY_API_KEY}`)
 */
export const Config_ApiKeyProp = z.union([
  SchemaApiKey_Schema,
  z.string().regex(/^\$\{[A-Za-z_][A-Za-z0-9_]*\}$/)
]);
