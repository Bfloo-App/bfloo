/**
 * ### apiConfig
 *
 * Configuration for API requests to the bfloo backend.
 *
 * Fields:
 * - `url` - Base URL for the API
 * - `paths` - API endpoint paths
 *   - `schema` - Path for schema endpoint
 *   - `snapshots` - Path for snapshots endpoint
 * - `headers` - Header generator functions
 *   - `contentType` - Returns Content-Type header tuple
 *   - `accept` - Returns Accept header tuple
 *   - `authorization` - Returns Authorization header tuple with Bearer token
 * - `reqTimeout` - Request timeout in milliseconds
 */
export const apiConfig = {
  url: process.env['BFLOO_API_URL'] ?? 'https://bfloo.com/api',
  paths: {
    schema: '/schema',
    snapshots: '/schema/snapshots'
  },
  headers: {
    contentType: (): [string, string] => ['Content-Type', 'application/json'],
    accept: (): [string, string] => ['Accept', 'application/json'],
    authorization: (token: string): [string, string] => [
      'Authorization',
      `Bearer ${token}`
    ]
  },
  reqTimeout: 5000
} as const;
