// Package imports
import z from 'zod';

// Project imports
import { Psql15_0_TableSchema } from './table';

/**
 * ### Psql15_0_Schema
 *
 * Zod schema validator for PostgreSQL 15.0 schema definition with tables and cross-table validation.
 *
 * Fields:
 * - `tables` - Array of table definitions - see {@link Psql15_0_TableSchema}
 *
 * Validations:
 * - Table IDs must be unique within schema
 * - Table names must be unique within schema
 * - Foreign key references must point to existing tables
 * - Foreign key referenced columns must exist in the referenced table
 * - Foreign key referenced columns must be a primary key or have a unique constraint
 */
export const Psql15_0_Schema = z
  .object({
    tables: z.array(Psql15_0_TableSchema)
  })
  .strict()
  .superRefine((data, ctx) => {
    // Build lookup maps for tables
    const tableByName = new Map(
      data.tables.map((table) => [table.name, table])
    );

    // Validate table IDs are unique within schema
    const tableIds = data.tables.map((table) => table.id);
    if (tableIds.length !== new Set(tableIds).size) {
      ctx.addIssue({
        code: 'custom',
        message: 'Table IDs must be unique within a schema',
        path: ['tables']
      });
    }

    // Validate table names are unique within schema
    if (data.tables.length !== tableByName.size) {
      ctx.addIssue({
        code: 'custom',
        message: 'Table names must be unique within a schema',
        path: ['tables']
      });
    }

    // Validate foreign key references across tables
    for (const [tableIdx, table] of data.tables.entries()) {
      if (!table.constraints) continue;

      for (const [constraintIdx, constraint] of table.constraints.entries()) {
        // Only validate foreign key constraints
        if (constraint.type !== 'foreign_key' || !constraint.references)
          continue;

        const referencedTableName = constraint.references.table;
        const referencedColumns = constraint.references.columns;

        // Check if referenced table exists
        const referencedTable = tableByName.get(referencedTableName);
        if (!referencedTable) {
          ctx.addIssue({
            code: 'custom',
            message: `Foreign key "${constraint.name}" references non-existent table "${referencedTableName}"`,
            path: [
              'tables',
              tableIdx,
              'constraints',
              constraintIdx,
              'references',
              'table'
            ]
          });
          continue; // Skip further validation for this FK
        }

        // Build column lookup for referenced table
        const referencedTableColumns = new Set(
          referencedTable.columns.map((col) => col.name)
        );

        // Check if all referenced columns exist in the referenced table
        for (const [colIdx, colName] of referencedColumns.entries()) {
          if (!referencedTableColumns.has(colName)) {
            ctx.addIssue({
              code: 'custom',
              message: `Foreign key "${constraint.name}" references non-existent column "${colName}" in table "${referencedTableName}"`,
              path: [
                'tables',
                tableIdx,
                'constraints',
                constraintIdx,
                'references',
                'columns',
                colIdx
              ]
            });
          }
        }

        // Check if referenced columns form a primary key or unique constraint
        if (referencedTable.constraints) {
          const referencedColsSet = new Set(referencedColumns);

          // Find a matching PK or unique constraint on the referenced table
          const hasMatchingConstraint = referencedTable.constraints.some(
            (refConstraint) => {
              if (
                refConstraint.type !== 'primary_key' &&
                refConstraint.type !== 'unique'
              ) {
                return false;
              }

              // Check if constraint columns match exactly
              if (refConstraint.columns.length !== referencedColumns.length) {
                return false;
              }

              return refConstraint.columns.every((col) =>
                referencedColsSet.has(col)
              );
            }
          );

          if (!hasMatchingConstraint) {
            ctx.addIssue({
              code: 'custom',
              message: `Foreign key "${constraint.name}" references columns (${referencedColumns.join(', ')}) in table "${referencedTableName}" which are not a primary key or unique constraint`,
              path: [
                'tables',
                tableIdx,
                'constraints',
                constraintIdx,
                'references',
                'columns'
              ]
            });
          }
        } else {
          // Referenced table has no constraints at all
          ctx.addIssue({
            code: 'custom',
            message: `Foreign key "${constraint.name}" references columns (${referencedColumns.join(', ')}) in table "${referencedTableName}" which has no constraints defined`,
            path: [
              'tables',
              tableIdx,
              'constraints',
              constraintIdx,
              'references',
              'columns'
            ]
          });
        }
      }
    }
  });
