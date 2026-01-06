// Package imports
import type { z, ZodSafeParseResult } from 'zod';

// Project imports
import { SchemaApiKey_Schema, Schema_Schema } from '$schemas';
import { CliError } from '$error';
import { fetchWithTimeout } from '$utils/fetch';
import { apiConfig } from '../../config';

/**
 * ### Schema_GetByApiKeyHandlerParams
 *
 * Parameters for fetching a schema by API key.
 *
 * Fields:
 * - `key` - API key for authentication - see {@link SchemaApiKey_Schema}
 */
interface Schema_GetByApiKeyHandlerParams {
  key: z.infer<typeof SchemaApiKey_Schema>;
}

/**
 * ### schema_GetByApiKeyHandler
 *
 * Fetches a schema from the API using the provided API key.
 *
 * Parameters:
 * - `params` - Handler parameters - see {@link Schema_GetByApiKeyHandlerParams}
 *   - `key` - API key for authentication
 *
 * @returns `Promise<Schema>` - The fetched schema data - see {@link Schema_Schema}
 *
 * @throws `CliError` - When the API request fails or returns invalid data
 */
export const schema_GetByApiKeyHandler = async ({
  key
}: Schema_GetByApiKeyHandlerParams): Promise<z.infer<typeof Schema_Schema>> => {
  const url: URL = new URL(apiConfig.url + apiConfig.paths.schema);

  const method = 'GET' as const;

  const headers: Headers = new Headers();
  headers.append(...apiConfig.headers.authorization(key));
  headers.append(...apiConfig.headers.accept());

  const reqInit: RequestInit = {
    method,
    headers
  };

  const res: Response = await fetchWithTimeout(url, reqInit);

  if (!res.ok)
    throw new CliError({
      title: `${String(res.status)}: Failed to Fetch Schema`,
      message: `Failed to fetch schema associated with provided API key.`
    });

  const resJson: unknown = await res.json();
  const resValidation: ZodSafeParseResult<z.infer<typeof Schema_Schema>> =
    Schema_Schema.safeParse(resJson);

  if (!resValidation.success)
    throw new CliError({
      title: 'Invalid API Response',
      message: 'Received invalid schema data from API',
      cause: resValidation.error
    });

  return resValidation.data;
};
