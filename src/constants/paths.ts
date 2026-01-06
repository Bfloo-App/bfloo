/**
 * ### PATHS
 *
 * Default file and directory paths used by bfloo.
 *
 * Fields:
 * - `bflooDir` - Hidden directory for bfloo configuration
 * - `configFile` - Main configuration file name
 * - `manifestFile` - Manifest file name for tracking state
 * - `snapshotsDir` - Directory name for stored snapshots
 * - `defaultSchemaDir` - Default directory for schema files
 */
export const PATHS = {
  bflooDir: '.bfloo',
  configFile: 'bfloo.yml',
  manifestFile: 'manifest.yml',
  snapshotsDir: 'snapshots',
  defaultSchemaDir: 'db-schemas'
} as const;
