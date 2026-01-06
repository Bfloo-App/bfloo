/**
 * ### ENGINE_POSTGRESQL
 *
 * Internal identifier for PostgreSQL database engine.
 */
export const ENGINE_POSTGRESQL = 'postgresql' as const;

/**
 * ### ENGINE_POSTGRESQL_DISPLAY
 *
 * Display name for PostgreSQL database engine.
 */
export const ENGINE_POSTGRESQL_DISPLAY = 'PostgreSQL' as const;

/**
 * ### SUPPORTED_DATABASE_ENGINES
 *
 * Array of supported database engine identifiers.
 */
export const SUPPORTED_DATABASE_ENGINES = [ENGINE_POSTGRESQL] as const;

/**
 * ### SUPPORTED_ENGINE_DISPLAY_NAMES
 *
 * Array of supported database engine display names.
 */
export const SUPPORTED_ENGINE_DISPLAY_NAMES = [
  ENGINE_POSTGRESQL_DISPLAY
] as const;

/**
 * ### PSQL_VERSION_15_0
 *
 * Version identifier for PostgreSQL 15.0.
 */
export const PSQL_VERSION_15_0 = 'v15.0' as const;

/**
 * ### SUPPORTED_PSQL_VERSIONS
 *
 * Array of supported PostgreSQL versions.
 */
export const SUPPORTED_PSQL_VERSIONS = [PSQL_VERSION_15_0] as const;

/**
 * ### SUPPORTED_ENGINE_VERSIONS
 *
 * Mapping of database engines to their supported versions.
 *
 * Fields:
 * - `postgresql` - Supported PostgreSQL versions
 */
export const SUPPORTED_ENGINE_VERSIONS = {
  [ENGINE_POSTGRESQL]: SUPPORTED_PSQL_VERSIONS
} as const;

/**
 * ### ENGINE_KEY_POSTGRESQL_15_0
 *
 * Composite engine key for PostgreSQL 15.0.
 */
export const ENGINE_KEY_POSTGRESQL_15_0 =
  `${ENGINE_POSTGRESQL}:${PSQL_VERSION_15_0}` as const;

/**
 * ### SUPPORTED_ENGINE_KEYS
 *
 * Array of supported composite engine keys.
 */
export const SUPPORTED_ENGINE_KEYS = [ENGINE_KEY_POSTGRESQL_15_0] as const;

/**
 * ### SupportedDatabaseEngine
 *
 * Union type of supported database engine identifiers.
 */
export type SupportedDatabaseEngine =
  (typeof SUPPORTED_DATABASE_ENGINES)[number];

/**
 * ### SupportedEngineDisplayName
 *
 * Union type of supported database engine display names.
 */
export type SupportedEngineDisplayName =
  (typeof SUPPORTED_ENGINE_DISPLAY_NAMES)[number];

/**
 * ### SupportedPsqlVersion
 *
 * Union type of supported PostgreSQL versions.
 */
export type SupportedPsqlVersion = (typeof SUPPORTED_PSQL_VERSIONS)[number];

/**
 * ### SupportedEngineVersion
 *
 * Generic type for supported versions of a specific database engine.
 *
 * Type Parameters:
 * - `E` - Database engine type - see {@link SupportedDatabaseEngine}
 */
export type SupportedEngineVersion<E extends SupportedDatabaseEngine> =
  (typeof SUPPORTED_ENGINE_VERSIONS)[E][number];

/**
 * ### SupportedEngineKey
 *
 * Union type of supported composite engine keys.
 */
export type SupportedEngineKey = (typeof SUPPORTED_ENGINE_KEYS)[number];

/**
 * ### ENGINE_DISPLAY_NAMES
 *
 * Mapping of database engine identifiers to their display names.
 *
 * Fields:
 * - `postgresql` - PostgreSQL display name
 */
export const ENGINE_DISPLAY_NAMES = {
  [ENGINE_POSTGRESQL]: ENGINE_POSTGRESQL_DISPLAY
} as const;

/**
 * ### resolveEngineDisplayName
 *
 * Resolves a database engine identifier to its display name.
 *
 * Parameters:
 * - `engine` - Database engine identifier - see {@link SupportedDatabaseEngine}
 *
 * @returns `SupportedEngineDisplayName` - The display name - see {@link SupportedEngineDisplayName}
 */
export function resolveEngineDisplayName(
  engine: SupportedDatabaseEngine
): SupportedEngineDisplayName {
  return ENGINE_DISPLAY_NAMES[engine];
}
