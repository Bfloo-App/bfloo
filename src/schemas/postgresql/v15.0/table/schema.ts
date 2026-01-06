// Package imports
import z from 'zod';

// Project imports
import {
  Psql15_0_Table_ColumnsProp,
  Psql15_0_Table_ConstraintsProp,
  Psql15_0_Table_DescriptionProp,
  Psql15_0_Table_IdProp,
  Psql15_0_Table_NameProp
} from './props';

/**
 * ### Psql15_0_TableSchema
 *
 * Zod schema validator for PostgreSQL table definition with columns, constraints, and validation rules.
 *
 * Fields:
 * - `id` - Table unique identifier (required) - see {@link Psql15_0_Table_IdProp}
 * - `name` - Table name - see {@link Psql15_0_Table_NameProp}
 * - `description` - Table description (optional) - see {@link Psql15_0_Table_DescriptionProp}
 * - `columns` - Array of column definitions (at least one required) - see {@link Psql15_0_Table_ColumnsProp}
 * - `constraints` - Array of constraint definitions (optional) - see {@link Psql15_0_Table_ConstraintsProp}
 */
export const Psql15_0_TableSchema = z
  .object({
    id: Psql15_0_Table_IdProp,
    name: Psql15_0_Table_NameProp,
    description: Psql15_0_Table_DescriptionProp.optional(),
    columns: Psql15_0_Table_ColumnsProp,
    constraints: Psql15_0_Table_ConstraintsProp.optional()
  })
  .strict()
  .superRefine((data, ctx) => {
    // Build column lookup maps
    const columnNames = new Set(data.columns.map((col) => col.name));
    const columnByName = new Map(data.columns.map((col) => [col.name, col]));

    // Validate column IDs are unique
    const columnIds = data.columns.map((col) => col.id);
    if (columnIds.length !== new Set(columnIds).size) {
      ctx.addIssue({
        code: 'custom',
        message: 'Column IDs must be unique within a table',
        path: ['columns']
      });
    }

    // Validate column names are unique
    if (data.columns.length !== columnNames.size) {
      ctx.addIssue({
        code: 'custom',
        message: 'Column names must be unique within a table',
        path: ['columns']
      });
    }

    // Early return if no constraints to validate
    if (!data.constraints || data.constraints.length === 0) {
      return;
    }

    // Validate constraint IDs are unique
    const constraintIds = data.constraints.map((con) => con.id);
    if (constraintIds.length !== new Set(constraintIds).size) {
      ctx.addIssue({
        code: 'custom',
        message: 'Constraint IDs must be unique within a table',
        path: ['constraints']
      });
    }

    // Validate constraint names are unique
    const constraintNames = data.constraints.map((con) => con.name);
    if (constraintNames.length !== new Set(constraintNames).size) {
      ctx.addIssue({
        code: 'custom',
        message: 'Constraint names must be unique within a table',
        path: ['constraints']
      });
    }

    // Count primary key constraints
    let primaryKeyCount = 0;

    // Validate each constraint
    for (const [i, constraint] of data.constraints.entries()) {
      // Count primary key constraints
      if (constraint.type === 'primary_key') {
        primaryKeyCount++;
      }

      // Validate that all constraint columns exist in table
      for (const colName of constraint.columns) {
        if (!columnNames.has(colName)) {
          ctx.addIssue({
            code: 'custom',
            message: `Constraint "${constraint.name}" references non-existent column "${colName}"`,
            path: ['constraints', i, 'columns']
          });
        }
      }

      // Primary key specific validations
      if (constraint.type === 'primary_key') {
        for (const colName of constraint.columns) {
          const column = columnByName.get(colName);
          if (column && column.constraints?.nullable !== false) {
            ctx.addIssue({
              code: 'custom',
              message: `Primary key column "${colName}" must have nullable=false`,
              path: ['constraints', i, 'columns']
            });
          }
        }
      }

      // Foreign key specific validations
      if (constraint.type === 'foreign_key' && constraint.references) {
        // Validate column count matches references column count
        if (
          constraint.columns.length !== constraint.references.columns.length
        ) {
          ctx.addIssue({
            code: 'custom',
            message: `Foreign key "${constraint.name}" has ${String(constraint.columns.length)} column(s) but references ${String(constraint.references.columns.length)} column(s)`,
            path: ['constraints', i, 'references', 'columns']
          });
        }

        // Validate set_null on_delete requires nullable columns
        if (constraint.on_delete === 'set_null') {
          for (const colName of constraint.columns) {
            const column = columnByName.get(colName);
            if (column && column.constraints?.nullable === false) {
              ctx.addIssue({
                code: 'custom',
                message: `Foreign key "${constraint.name}" has on_delete="set_null" but column "${colName}" is not nullable`,
                path: ['constraints', i, 'on_delete']
              });
            }
          }
        }

        // Validate set_null on_update requires nullable columns
        if (constraint.on_update === 'set_null') {
          for (const colName of constraint.columns) {
            const column = columnByName.get(colName);
            if (column && column.constraints?.nullable === false) {
              ctx.addIssue({
                code: 'custom',
                message: `Foreign key "${constraint.name}" has on_update="set_null" but column "${colName}" is not nullable`,
                path: ['constraints', i, 'on_update']
              });
            }
          }
        }
      }
    }

    // Validate at most one primary key per table
    if (primaryKeyCount > 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Table can have at most one primary key constraint',
        path: ['constraints']
      });
    }
  });
