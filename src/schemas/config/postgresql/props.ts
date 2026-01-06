// Package imports
import z from 'zod';

// Project imports
import { ENGINE_POSTGRESQL_DISPLAY } from '$constants';

/**
 * ### Config_PostgresqlEngineProp
 *
 * Zod schema validator for PostgreSQL engine literal in config files.
 */
export const Config_PostgresqlEngineProp = z.literal(ENGINE_POSTGRESQL_DISPLAY);

/**
 * ### Config_PostgresqlHostProp
 *
 * Zod schema validator for PostgreSQL database host (non-empty string).
 */
export const Config_PostgresqlHostProp = z.string().min(1);

/**
 * ### Config_PostgresqlPortProp
 *
 * Zod schema validator for PostgreSQL database port (1-65535).
 */
export const Config_PostgresqlPortProp = z.int().min(1).max(65535);

/**
 * ### Config_PostgresqlDbNameProp
 *
 * Zod schema validator for PostgreSQL database name (non-empty string).
 */
export const Config_PostgresqlDbNameProp = z.string().min(1);

/**
 * ### Config_PostgresqlTargetSchemaProp
 *
 * Zod schema validator for PostgreSQL target schema (defaults to 'public').
 */
export const Config_PostgresqlTargetSchemaProp = z.string().default('public');

/**
 * ### Config_PostgresqlUserProp
 *
 * Zod schema validator for PostgreSQL database username (non-empty string).
 */
export const Config_PostgresqlUserProp = z.string().min(1);

/**
 * ### Config_PostgresqlPasswordProp
 *
 * Zod schema validator for PostgreSQL database password.
 */
export const Config_PostgresqlPasswordProp = z.string();

/**
 * ### Config_PostgresqlSslModeProp
 *
 * Zod schema validator for PostgreSQL SSL mode (defaults to 'prefer').
 *
 * Variants:
 * - `disable` - SSL disabled
 * - `allow` - SSL allowed but not required
 * - `prefer` - SSL preferred if available
 * - `require` - SSL required
 * - `verify-ca` - SSL required with CA verification
 * - `verify-full` - SSL required with full certificate verification
 */
export const Config_PostgresqlSslModeProp = z
  .enum(['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'])
  .default('prefer');

/**
 * ### Config_PostgresqlConnectTimeoutProp
 *
 * Zod schema validator for PostgreSQL connection timeout in seconds (defaults to 10).
 */
export const Config_PostgresqlConnectTimeoutProp = z
  .int()
  .positive()
  .default(10);
