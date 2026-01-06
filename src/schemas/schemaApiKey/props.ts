// Package imports
import z from 'zod';

// Project imports
import {
  SCHEMAS_API_KEY_PREFIX,
  SCHEMA_API_KEY_SECRET_LENGTH
} from '../../constants/api.js';

/**
 * ### SchemaApiKey_PrefixProp
 *
 * Zod schema validator for the prefix portion of a schema API key.
 *
 * See {@link SCHEMAS_API_KEY_PREFIX} for the expected value.
 */
export const SchemaApiKey_PrefixProp = z.literal(SCHEMAS_API_KEY_PREFIX);

/**
 * ### SchemaApiKey_IdProp
 *
 * Zod schema validator for the UUID portion of a schema API key.
 */
export const SchemaApiKey_IdProp = z.uuidv4();

/**
 * ### SchemaApiKey_SecretProp
 *
 * Zod schema validator for the secret portion of a schema API key (64 hex characters).
 *
 * See {@link SCHEMA_API_KEY_SECRET_LENGTH} for the required length.
 */
export const SchemaApiKey_SecretProp = z
  .string()
  .length(SCHEMA_API_KEY_SECRET_LENGTH)
  .regex(/^[a-f0-9]+$/, 'Secret must be lowercase hexadecimal');
