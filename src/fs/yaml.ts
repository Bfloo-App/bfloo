// Package imports
import * as yaml from 'yaml';

/**
 * ### addSpacesBetweenSeqItems
 *
 * Adds blank lines between items in a YAML sequence for readability.
 *
 * Parameters:
 * - `seq` - YAML sequence node to modify
 */
export function addSpacesBetweenSeqItems(seq: yaml.YAMLSeq): void {
  let isFirst = true;

  for (const item of seq.items) {
    if (isFirst) {
      isFirst = false;
    } else if (yaml.isMap(item) || yaml.isSeq(item) || yaml.isScalar(item)) {
      item.spaceBefore = true;
    }
  }
}

/**
 * ### addSpacesBetweenMapEntries
 *
 * Adds blank lines between entries in a YAML map for readability.
 *
 * Parameters:
 * - `map` - YAML map node to modify
 */
export function addSpacesBetweenMapEntries(map: yaml.YAMLMap): void {
  let isFirst = true;

  for (const pair of map.items) {
    if (isFirst) {
      isFirst = false;
    } else if (yaml.isScalar(pair.key)) {
      pair.key.spaceBefore = true;
    }
  }
}
