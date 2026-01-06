// Package imports
import z from 'zod';

// Project imports
import { Config_EnvFileProp } from '../props';
import {
  Config_PostgresqlHostProp,
  Config_PostgresqlPortProp,
  Config_PostgresqlDbNameProp,
  Config_PostgresqlTargetSchemaProp,
  Config_PostgresqlUserProp,
  Config_PostgresqlPasswordProp,
  Config_PostgresqlSslModeProp,
  Config_PostgresqlConnectTimeoutProp
} from './props';

/**
 * ### Config_PostgresqlEnvSchema
 *
 * Zod schema validator for PostgreSQL environment-specific configuration.
 *
 * Fields:
 * - `env-file` - Path to environment file (optional) - see {@link Config_EnvFileProp}
 * - `host` - Database host - see {@link Config_PostgresqlHostProp}
 * - `port` - Database port - see {@link Config_PostgresqlPortProp}
 * - `db-name` - Database name - see {@link Config_PostgresqlDbNameProp}
 * - `target-schema` - Target schema name - see {@link Config_PostgresqlTargetSchemaProp}
 * - `user` - Database user - see {@link Config_PostgresqlUserProp}
 * - `password` - Database password - see {@link Config_PostgresqlPasswordProp}
 * - `ssl-mode` - SSL connection mode - see {@link Config_PostgresqlSslModeProp}
 * - `connect-timeout` - Connection timeout - see {@link Config_PostgresqlConnectTimeoutProp}
 */
export const Config_PostgresqlEnvSchema = z.object({
  'env-file': Config_EnvFileProp,
  host: Config_PostgresqlHostProp,
  port: Config_PostgresqlPortProp,
  'db-name': Config_PostgresqlDbNameProp,
  'target-schema': Config_PostgresqlTargetSchemaProp,
  user: Config_PostgresqlUserProp,
  password: Config_PostgresqlPasswordProp,
  'ssl-mode': Config_PostgresqlSslModeProp,
  'connect-timeout': Config_PostgresqlConnectTimeoutProp
});
