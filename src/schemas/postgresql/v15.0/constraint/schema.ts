// Package imports
import z from 'zod';

// Project imports
import {
  Psql15_0_Constraint_ColumnsProp,
  Psql15_0_Constraint_DescriptionProp,
  Psql15_0_Constraint_IdProp,
  Psql15_0_Constraint_NameProp,
  Psql15_0_Constraint_OnDeleteProp,
  Psql15_0_Constraint_OnUpdateProp,
  Psql15_0_Constraint_References,
  Psql15_0_Constraint_TypeEnum
} from './props';

/**
 * ### Psql15_0_ConstraintSchema
 *
 * Zod schema validator for PostgreSQL constraint definition with type-specific fields and validation rules.
 *
 * Fields:
 * - `id` - Constraint unique identifier (required) - see {@link Psql15_0_Constraint_IdProp}
 * - `name` - Constraint name - see {@link Psql15_0_Constraint_NameProp}
 * - `type` - Constraint type - see {@link Psql15_0_Constraint_TypeEnum}
 * - `description` - Constraint description (optional) - see {@link Psql15_0_Constraint_DescriptionProp}
 * - `columns` - Array of column names - see {@link Psql15_0_Constraint_ColumnsProp}
 * - `references` - Referenced table and columns (required for foreign_key type) - see {@link Psql15_0_Constraint_References}
 * - `on_delete` - Delete action (required for foreign_key type) - see {@link Psql15_0_Constraint_OnDeleteProp}
 * - `on_update` - Update action (required for foreign_key type) - see {@link Psql15_0_Constraint_OnUpdateProp}
 */
export const Psql15_0_ConstraintSchema = z
  .object({
    id: Psql15_0_Constraint_IdProp,
    name: Psql15_0_Constraint_NameProp,
    type: Psql15_0_Constraint_TypeEnum,
    description: Psql15_0_Constraint_DescriptionProp.optional(),
    columns: Psql15_0_Constraint_ColumnsProp,
    references: Psql15_0_Constraint_References.optional(),
    on_delete: Psql15_0_Constraint_OnDeleteProp.optional(),
    on_update: Psql15_0_Constraint_OnUpdateProp.optional()
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.type === 'foreign_key') {
      // Foreign key constraints must have references
      if (!data.references) {
        ctx.addIssue({
          code: 'custom',
          message: 'Foreign key constraints must have references field',
          path: ['references']
        });
      }

      // Foreign key constraints must have on_delete
      if (!data.on_delete) {
        ctx.addIssue({
          code: 'custom',
          message: 'Foreign key constraints must have on_delete action',
          path: ['on_delete']
        });
      }

      // Foreign key constraints must have on_update
      if (!data.on_update) {
        ctx.addIssue({
          code: 'custom',
          message: 'Foreign key constraints must have on_update action',
          path: ['on_update']
        });
      }
    } else {
      // Non-foreign key constraints cannot have references
      if (data.references) {
        ctx.addIssue({
          code: 'custom',
          message: 'Only foreign key constraints can have references field',
          path: ['references']
        });
      }

      // Non-foreign key constraints cannot have on_delete
      if (data.on_delete) {
        ctx.addIssue({
          code: 'custom',
          message: 'Only foreign key constraints can have on_delete action',
          path: ['on_delete']
        });
      }

      // Non-foreign key constraints cannot have on_update
      if (data.on_update) {
        ctx.addIssue({
          code: 'custom',
          message: 'Only foreign key constraints can have on_update action',
          path: ['on_update']
        });
      }
    }
  });
