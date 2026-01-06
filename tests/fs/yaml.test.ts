// Package imports
import { describe, it, expect } from 'bun:test';
import * as yaml from 'yaml';

// Project imports
import {
  addSpacesBetweenSeqItems,
  addSpacesBetweenMapEntries
} from '../../src/fs/yaml';

describe('[Unit] - addSpacesBetweenSeqItems', () => {
  describe('Basic Functionality', () => {
    it('should add spaceBefore to all items except first', () => {
      const seq = new yaml.YAMLSeq();
      seq.add(new yaml.Scalar('first'));
      seq.add(new yaml.Scalar('second'));
      seq.add(new yaml.Scalar('third'));

      addSpacesBetweenSeqItems(seq);

      const items = seq.items as yaml.Scalar[];
      expect(items[0]?.spaceBefore).toBeFalsy();
      expect(items[1]?.spaceBefore).toBe(true);
      expect(items[2]?.spaceBefore).toBe(true);
    });

    it('should handle empty sequence', () => {
      const seq = new yaml.YAMLSeq();

      // Should not throw
      expect(() => {
        addSpacesBetweenSeqItems(seq);
      }).not.toThrow();
    });

    it('should handle single item sequence', () => {
      const seq = new yaml.YAMLSeq();
      seq.add(new yaml.Scalar('only'));

      addSpacesBetweenSeqItems(seq);

      const items = seq.items as yaml.Scalar[];
      expect(items[0]?.spaceBefore).toBeFalsy();
    });

    it('should work with map items in sequence', () => {
      const seq = new yaml.YAMLSeq();
      const map1 = new yaml.YAMLMap();
      map1.set('key1', 'value1');
      const map2 = new yaml.YAMLMap();
      map2.set('key2', 'value2');

      seq.add(map1);
      seq.add(map2);

      addSpacesBetweenSeqItems(seq);

      expect(map1.spaceBefore).toBeFalsy();
      expect(map2.spaceBefore).toBe(true);
    });

    it('should work with nested sequences', () => {
      const seq = new yaml.YAMLSeq();
      const nested1 = new yaml.YAMLSeq();
      nested1.add(new yaml.Scalar('a'));
      const nested2 = new yaml.YAMLSeq();
      nested2.add(new yaml.Scalar('b'));

      seq.add(nested1);
      seq.add(nested2);

      addSpacesBetweenSeqItems(seq);

      expect(nested1.spaceBefore).toBeFalsy();
      expect(nested2.spaceBefore).toBe(true);
    });
  });

  describe('YAML Output', () => {
    it('should produce formatted YAML with blank lines', () => {
      const doc = new yaml.Document();
      const seq = new yaml.YAMLSeq();
      const map1 = new yaml.YAMLMap();
      map1.set('name', 'table1');
      const map2 = new yaml.YAMLMap();
      map2.set('name', 'table2');

      seq.add(map1);
      seq.add(map2);

      addSpacesBetweenSeqItems(seq);

      doc.contents = seq;
      const output = doc.toString();

      // Should have blank line between items
      expect(output).toContain('\n\n- name:');
    });
  });
});

describe('[Unit] - addSpacesBetweenMapEntries', () => {
  describe('Basic Functionality', () => {
    it('should add spaceBefore to scalar keys except first', () => {
      // Create map with explicit Scalar keys to match the function's expectation
      const map = new yaml.YAMLMap();
      const key1 = new yaml.Scalar('first');
      const key2 = new yaml.Scalar('second');
      const key3 = new yaml.Scalar('third');
      map.add(new yaml.Pair(key1, 'value1'));
      map.add(new yaml.Pair(key2, 'value2'));
      map.add(new yaml.Pair(key3, 'value3'));

      addSpacesBetweenMapEntries(map);

      expect(key1.spaceBefore).toBeFalsy();
      expect(key2.spaceBefore).toBe(true);
      expect(key3.spaceBefore).toBe(true);
    });

    it('should handle empty map', () => {
      const map = new yaml.YAMLMap();

      // Should not throw
      expect(() => {
        addSpacesBetweenMapEntries(map);
      }).not.toThrow();
    });

    it('should handle single entry map', () => {
      const map = new yaml.YAMLMap();
      const key = new yaml.Scalar('only');
      map.add(new yaml.Pair(key, 'value'));

      addSpacesBetweenMapEntries(map);

      expect(key.spaceBefore).toBeFalsy();
    });

    it('should skip non-scalar keys', () => {
      const map = new yaml.YAMLMap();
      // Non-scalar key (should be skipped)
      const nonScalarKey = new yaml.YAMLSeq();
      nonScalarKey.add('array-key');
      map.add(new yaml.Pair(nonScalarKey, 'value1'));

      const scalarKey = new yaml.Scalar('second');
      map.add(new yaml.Pair(scalarKey, 'value2'));

      // Should not throw
      expect(() => {
        addSpacesBetweenMapEntries(map);
      }).not.toThrow();
    });
  });

  describe('YAML Output', () => {
    it('should produce formatted YAML with blank lines between entries', () => {
      const doc = new yaml.Document();
      const map = new yaml.YAMLMap();
      const key1 = new yaml.Scalar('schema1');
      const key2 = new yaml.Scalar('schema2');
      map.add(new yaml.Pair(key1, { engine: 'postgresql' }));
      map.add(new yaml.Pair(key2, { engine: 'postgresql' }));

      addSpacesBetweenMapEntries(map);

      doc.contents = map;
      const output = doc.toString();

      // Should have blank line between entries
      expect(output).toContain('\n\nschema2:');
    });
  });
});
