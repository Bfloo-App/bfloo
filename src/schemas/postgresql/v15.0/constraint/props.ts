// Package imports
import z from 'zod';

/**
 * ### Psql15_0_Constraint_IdProp
 *
 * Zod schema validator for constraint unique local identifier.
 */
export const Psql15_0_Constraint_IdProp = z.int().positive();

/**
 * ### Psql15_0_Constraint_NameProp
 *
 * Zod schema validator for constraint name (1-63 lowercase characters with underscores).
 */
export const Psql15_0_Constraint_NameProp = z
  .string()
  .min(1)
  .max(63)
  .regex(/^[a-z][a-z0-9_]*$/);

/**
 * ### Psql15_0_Constraint_TypeEnum
 *
 * PostgreSQL constraint type options.
 *
 * Variants:
 * - `foreign_key` - Foreign key constraint
 * - `unique` - Unique constraint
 * - `primary_key` - Primary key constraint
 */
export const Psql15_0_Constraint_TypeEnum = z.enum([
  'foreign_key',
  'unique',
  'primary_key'
]);

/**
 * ### Psql15_0_Constraint_DescriptionProp
 *
 * Zod schema validator for optional constraint description (max 256 characters).
 */
export const Psql15_0_Constraint_DescriptionProp = z.string().max(256);

/**
 * ### Psql15_0_Constraint_ColumnNameProp
 *
 * Zod schema validator for column name (1-63 lowercase characters with underscores).
 */
export const Psql15_0_Constraint_ColumnNameProp = z
  .string()
  .min(1)
  .max(63)
  .regex(/^[a-z][a-z0-9_]*$/);

/**
 * ### Psql15_0_Constraint_ColumnsProp
 *
 * Zod schema validator for array of column names that constraint applies to.
 */
export const Psql15_0_Constraint_ColumnsProp = z.array(
  Psql15_0_Constraint_ColumnNameProp
);

/**
 * ### Psql15_0_Constraint_TableNameProp
 *
 * Zod schema validator for referenced table name (1-63 lowercase characters with underscores).
 */
export const Psql15_0_Constraint_TableNameProp = z
  .string()
  .min(1)
  .max(63)
  .regex(/^[a-z][a-z0-9_]*$/);

/**
 * ### Psql15_0_Constraint_ReferentialActionEnum
 *
 * PostgreSQL referential action options for foreign key constraints.
 *
 * Variants:
 * - `cascade` - Cascade changes to referencing rows
 * - `set_null` - Set referencing columns to null
 * - `set_default` - Set referencing columns to default values
 * - `restrict` - Prevent deletion/update if references exist
 * - `no_action` - Same as restrict but check can be deferred
 */
export const Psql15_0_Constraint_ReferentialActionEnum = z.enum([
  'cascade',
  'set_null',
  'set_default',
  'restrict',
  'no_action'
]);

/**
 * ### Psql15_0_Constraint_References
 *
 * Table and columns that foreign key constraint references.
 *
 * Fields:
 * - `table` - Referenced table name - see {@link Psql15_0_Constraint_TableNameProp}
 * - `columns` - Array of referenced column names - see {@link Psql15_0_Constraint_ColumnsProp}
 */
export const Psql15_0_Constraint_References = z
  .object({
    table: Psql15_0_Constraint_TableNameProp,
    columns: Psql15_0_Constraint_ColumnsProp
  })
  .strict();

/**
 * ### Psql15_0_Constraint_OnDeleteProp
 *
 * Zod schema validator for action when referenced row is deleted.
 */
export const Psql15_0_Constraint_OnDeleteProp =
  Psql15_0_Constraint_ReferentialActionEnum;

/**
 * ### Psql15_0_Constraint_OnUpdateProp
 *
 * Zod schema validator for action when referenced row is updated.
 */
export const Psql15_0_Constraint_OnUpdateProp =
  Psql15_0_Constraint_ReferentialActionEnum;
