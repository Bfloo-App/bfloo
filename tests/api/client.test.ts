// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import { ApiClient } from '../../src/api/client';
import * as handlers from '../../src/api/handlers';

describe('[Unit] - ApiClient', () => {
  describe('Structure', () => {
    it('should be defined', () => {
      expect(ApiClient).toBeDefined();
    });

    it('should have schema property', () => {
      expect(ApiClient.schema).toBeDefined();
    });

    it('should have schemaSnapshot property', () => {
      expect(ApiClient.schemaSnapshot).toBeDefined();
    });
  });

  describe('Schema Router', () => {
    it('should have getByApiKey handler', () => {
      expect(ApiClient.schema.getByApiKey).toBeDefined();
    });

    it('should reference the correct handler', () => {
      expect(ApiClient.schema.getByApiKey).toBe(
        handlers.schema_GetByApiKeyHandler
      );
    });

    it('should have getByApiKey as a function', () => {
      expect(typeof ApiClient.schema.getByApiKey).toBe('function');
    });
  });

  describe('SchemaSnapshot Router', () => {
    it('should have listByApiKey handler', () => {
      expect(ApiClient.schemaSnapshot.listByApiKey).toBeDefined();
    });

    it('should reference the correct handler', () => {
      expect(ApiClient.schemaSnapshot.listByApiKey).toBe(
        handlers.schemaSnapshot_ListByApiKeyHandler
      );
    });

    it('should have listByApiKey as a function', () => {
      expect(typeof ApiClient.schemaSnapshot.listByApiKey).toBe('function');
    });
  });

  describe('Type Safety', () => {
    it('should only expose expected schema operations', () => {
      const schemaKeys = Object.keys(ApiClient.schema);
      expect(schemaKeys).toContain('getByApiKey');
      expect(schemaKeys).toHaveLength(1);
    });

    it('should only expose expected schemaSnapshot operations', () => {
      const snapshotKeys = Object.keys(ApiClient.schemaSnapshot);
      expect(snapshotKeys).toContain('listByApiKey');
      expect(snapshotKeys).toHaveLength(1);
    });

    it('should only expose expected top-level properties', () => {
      const clientKeys = Object.keys(ApiClient);
      expect(clientKeys).toContain('schema');
      expect(clientKeys).toContain('schemaSnapshot');
      expect(clientKeys).toHaveLength(2);
    });
  });
});
