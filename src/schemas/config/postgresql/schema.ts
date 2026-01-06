// Package imports
import z from 'zod';

// Project imports
import * as commonProps from '../props';
import * as props from './props';
import { Config_PostgresqlEnvSchema } from './env';

/**
 * ### Config_PostgresqlSchemaSchema
 *
 * Zod schema validator for PostgreSQL schema configuration in bfloo config files.
 *
 * Fields:
 * - `dir` - Directory for schema files - see {@link Config_DirProp}
 * - `key` - API key for remote access - see {@link Config_ApiKeyProp}
 * - `engine` - Database engine literal - see {@link Config_PostgresqlEngineProp}
 * - `env-file` - Path to environment file (optional) - see {@link Config_EnvFileProp}
 * - `envs` - Environment-specific configurations - see {@link Config_PostgresqlEnvSchema}
 */
export const Config_PostgresqlSchemaSchema = z.object({
  dir: commonProps.Config_DirProp,
  key: commonProps.Config_ApiKeyProp,
  engine: props.Config_PostgresqlEngineProp,
  'env-file': commonProps.Config_EnvFileProp,
  envs: z
    .record(commonProps.Config_EnvNameProp, Config_PostgresqlEnvSchema)
    .default({})
});
