// Package imports
import { z, type ZodSafeParseResult } from 'zod';

// Project imports
import { type SchemaApiKey_Schema, SchemaSnapshot_Schema } from '$schemas';
import { fetchWithTimeout } from '$utils/fetch';
import { apiConfig } from '../../config';
import { CliError } from '$error';

/**
 * ### SchemaSnapshot_ListByApiKeyHandlerParams
 *
 * Parameters for fetching schema snapshots by API key.
 *
 * Fields:
 * - `key` - API key for authentication - see {@link SchemaApiKey_Schema}
 */
interface SchemaSnapshot_ListByApiKeyHandlerParams {
  key: z.infer<typeof SchemaApiKey_Schema>;
}

/**
 * ### schemaSnapshot_ListByApiKeyHandler
 *
 * Fetches all schema snapshots from the API using the provided API key.
 *
 * Parameters:
 * - `params` - Handler parameters - see {@link SchemaSnapshot_ListByApiKeyHandlerParams}
 *   - `key` - API key for authentication
 *
 * @returns `Promise<SchemaSnapshot[]>` - Array of fetched snapshots - see {@link SchemaSnapshot_Schema}
 *
 * @throws `CliError` - When the API request fails or returns invalid data
 */
export const schemaSnapshot_ListByApiKeyHandler = async ({
  key
}: SchemaSnapshot_ListByApiKeyHandlerParams): Promise<
  z.infer<typeof SchemaSnapshot_Schema>[]
> => {
  const url: URL = new URL(apiConfig.url + apiConfig.paths.snapshots);

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
      title: `${String(res.status)}: Failed to Fetch Snapshots`,
      message: `Failed to fetch snapshots associated with provided API key.`
    });

  const resJson: unknown = await res.json();
  const resValidation: ZodSafeParseResult<
    z.infer<typeof SchemaSnapshot_Schema>[]
  > = z.array(SchemaSnapshot_Schema).safeParse(resJson);

  if (!resValidation.success)
    throw new CliError({
      title: 'Invalid API Response',
      message: 'Received invalid snapshot data from API',
      cause: resValidation.error
    });

  return resValidation.data;
};
