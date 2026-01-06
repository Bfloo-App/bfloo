// Package imports
import z from 'zod';

// Project imports
import {
  SCHEMAS_API_KEY_PREFIX,
  API_KEY_SECTIONS_SEPARATOR
} from '../../constants/api';
import { SchemaApiKey_IdProp, SchemaApiKey_SecretProp } from './props';

/**
 * ### SchemaApiKey_Schema
 *
 * Zod schema validator for schema API key strings.
 *
 * Format: `{prefix}_{uuid}_{secret}`
 * - `prefix` - API key type prefix
 * - `uuid` - UUIDv4 identifier - see {@link SchemaApiKey_IdProp}
 * - `secret` - 64-character hexadecimal secret - see {@link SchemaApiKey_SecretProp}
 */
export const SchemaApiKey_Schema = z.string().check((ctx) => {
  const value = ctx.value;
  const parts = value.split(API_KEY_SECTIONS_SEPARATOR);

  // Must have exactly 3 sections: prefix, uuid, secret
  if (parts.length !== 3) {
    ctx.issues.push({
      code: 'custom',
      input: value,
      message: `Invalid schema API key format. Expected: ${SCHEMAS_API_KEY_PREFIX}${API_KEY_SECTIONS_SEPARATOR}<uuid>${API_KEY_SECTIONS_SEPARATOR}<secret>`
    });
    return;
  }

  const prefix = parts[0] ?? '';
  const uuid = parts[1] ?? '';
  const secret = parts[2] ?? '';

  // Validate prefix using switch
  switch (prefix) {
    case SCHEMAS_API_KEY_PREFIX:
      break;
    default:
      ctx.issues.push({
        code: 'custom',
        input: prefix,
        message: `Invalid API key prefix: "${prefix}"`
      });
      return;
  }

  // Validate UUID using Zod prop
  const uuidResult = SchemaApiKey_IdProp.safeParse(uuid);
  if (!uuidResult.success) {
    ctx.issues.push({
      code: 'custom',
      input: uuid,
      message: `Invalid API key UUID: "${uuid}"`
    });
    return;
  }

  // Validate secret using Zod prop
  const secretResult = SchemaApiKey_SecretProp.safeParse(secret);
  if (!secretResult.success) {
    ctx.issues.push({
      code: 'custom',
      input: secret,
      message: `Invalid API key secret`
    });
  }
});
