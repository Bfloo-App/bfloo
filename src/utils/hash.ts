// Package imports
import { createHash } from 'crypto';
import canonicalize from 'canonicalize';
import type z from 'zod';

// Project imports
import { CliError } from '$error';
import type { SchemaSnapshot_Schema } from '$schemas';

/**
 * ### computeSnapshotContentHash
 *
 * Computes a SHA-256 content hash for a schema snapshot.
 *
 * Parameters:
 * - `snapshot` - Schema snapshot to hash - see {@link SchemaSnapshot_Schema}
 *
 * @returns `string` - Hash string in format `sha256:<hex>`
 *
 * @throws `CliError` - When snapshot contains non-serializable values
 */
export function computeSnapshotContentHash(
  snapshot: z.infer<typeof SchemaSnapshot_Schema>
): string {
  const { engineKey, description, data } = snapshot;

  // Build content object conditionally based on what fields are present
  const content =
    data !== null
      ? description !== null
        ? { engineKey, description, tables: data.tables }
        : { engineKey, tables: data.tables }
      : description !== null
        ? { engineKey, description }
        : { engineKey };

  const canonicalJson = canonicalize(content);

  if (canonicalJson === undefined) {
    throw new CliError({
      title: 'Hash Computation Failed',
      message:
        'Failed to canonicalize snapshot content: data contains non-serializable values'
    });
  }

  const hash = createHash('sha256').update(canonicalJson).digest('hex');

  return `sha256:${hash}`;
}
