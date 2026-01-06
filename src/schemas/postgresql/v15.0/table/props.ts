// Package imports
import z from 'zod';

// Project imports
import { Psql15_0_ColumnSchema } from '../column';
import { Psql15_0_ConstraintSchema } from '../constraint';

/**
 * ### Psql15_0_Table_IdProp
 *
 * Zod schema validator for table unique local identifier.
 */
export const Psql15_0_Table_IdProp = z.int().positive();

/**
 * ### Psql15_0_Table_NameProp
 *
 * Zod schema validator for table name (1-63 lowercase characters with underscores).
 */
export const Psql15_0_Table_NameProp = z
  .string()
  .min(1)
  .max(63)
  .regex(/^[a-z][a-z0-9_]*$/);

/**
 * ### Psql15_0_Table_DescriptionProp
 *
 * Zod schema validator for optional table description (max 256 characters).
 */
export const Psql15_0_Table_DescriptionProp = z.string().max(256);

/**
 * ### Psql15_0_Table_ColumnsProp
 *
 * Zod schema validator for array of column definitions (at least one column required).
 */
export const Psql15_0_Table_ColumnsProp = z.array(Psql15_0_ColumnSchema).min(1);

/**
 * ### Psql15_0_Table_ConstraintsProp
 *
 * Zod schema validator for array of constraint definitions.
 */
export const Psql15_0_Table_ConstraintsProp = z.array(
  Psql15_0_ConstraintSchema
);
