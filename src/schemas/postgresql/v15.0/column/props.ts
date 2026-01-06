// Package imports
import z from 'zod';

/**
 * ### Psql15_0_Column_IdProp
 *
 * Zod schema validator for column unique local identifier.
 */
export const Psql15_0_Column_IdProp = z.int().positive();

/**
 * ### Psql15_0_Column_NameProp
 *
 * Zod schema validator for column name (1-63 lowercase characters with underscores).
 */
export const Psql15_0_Column_NameProp = z
  .string()
  .min(1)
  .max(63)
  .regex(/^[a-z][a-z0-9_]*$/);

/**
 * ### Psql15_0_Column_TypeEnum
 *
 * PostgreSQL column data type options.
 *
 * Variants:
 * - `text` - Text/string column type
 * - `integer` - Integer number column type
 * - `serial` - Auto-incrementing integer column type
 * - `boolean` - Boolean column type
 * - `date` - Date column type
 * - `timestamp` - Timestamp column type
 */
export const Psql15_0_Column_TypeEnum = z.enum([
  'text',
  'integer',
  'serial',
  'boolean',
  'date',
  'timestamp'
]);

/**
 * ### Psql15_0_Column_DescriptionProp
 *
 * Zod schema validator for optional column description (max 256 characters).
 */
export const Psql15_0_Column_DescriptionProp = z.string().max(256);

/**
 * ### Psql15_0_Column_DefaultProp
 *
 * Zod schema validator for column default value (string, integer, boolean, or null).
 */
export const Psql15_0_Column_DefaultProp = z.union([
  z.string(),
  z.int(),
  z.boolean(),
  z.null()
]);

/**
 * ### Psql15_0_Column_ConstraintNameProp
 *
 * Zod schema validator for constraint name (1-63 lowercase characters with underscores).
 */
export const Psql15_0_Column_ConstraintNameProp = z
  .string()
  .min(1)
  .max(63)
  .regex(/^[a-z][a-z0-9_]*$/);

/**
 * ### Psql15_0_Column_NullableProp
 *
 * Zod schema validator for nullable constraint (defaults to true).
 */
export const Psql15_0_Column_NullableProp = z.boolean().default(true);

/**
 * ### Psql15_0_Column_MinLengthConstraint
 *
 * Minimum length constraint for text columns.
 *
 * Fields:
 * - `name` - Constraint name - see {@link Psql15_0_Column_ConstraintNameProp}
 * - `value` - Minimum length value
 */
export const Psql15_0_Column_MinLengthConstraint = z
  .object({
    name: Psql15_0_Column_ConstraintNameProp,
    value: z.int()
  })
  .strict();

/**
 * ### Psql15_0_Column_MaxLengthConstraint
 *
 * Maximum length constraint for text columns.
 *
 * Fields:
 * - `name` - Constraint name - see {@link Psql15_0_Column_ConstraintNameProp}
 * - `value` - Maximum length value
 */
export const Psql15_0_Column_MaxLengthConstraint = z
  .object({
    name: Psql15_0_Column_ConstraintNameProp,
    value: z.int()
  })
  .strict();

/**
 * ### Psql15_0_Column_MinValueConstraint
 *
 * Minimum value constraint for integer columns.
 *
 * Fields:
 * - `name` - Constraint name - see {@link Psql15_0_Column_ConstraintNameProp}
 * - `value` - Minimum value
 */
export const Psql15_0_Column_MinValueConstraint = z
  .object({
    name: Psql15_0_Column_ConstraintNameProp,
    value: z.int()
  })
  .strict();

/**
 * ### Psql15_0_Column_MaxValueConstraint
 *
 * Maximum value constraint for integer columns.
 *
 * Fields:
 * - `name` - Constraint name - see {@link Psql15_0_Column_ConstraintNameProp}
 * - `value` - Maximum value
 */
export const Psql15_0_Column_MaxValueConstraint = z
  .object({
    name: Psql15_0_Column_ConstraintNameProp,
    value: z.int()
  })
  .strict();

/**
 * ### Psql15_0_Column_BaseConstraints
 *
 * Base constraints available for all column types.
 *
 * Fields:
 * - `nullable` - Whether column can be null (defaults to true) - see {@link Psql15_0_Column_NullableProp}
 */
export const Psql15_0_Column_BaseConstraints = z
  .object({
    nullable: Psql15_0_Column_NullableProp
  })
  .strict();

/**
 * ### Psql15_0_Column_TextConstraints
 *
 * Constraints for text column types.
 *
 * Fields:
 * - `nullable` - Whether column can be null (defaults to true) - see {@link Psql15_0_Column_NullableProp}
 * - `min_length` - Minimum length constraint (optional) - see {@link Psql15_0_Column_MinLengthConstraint}
 * - `max_length` - Maximum length constraint (optional) - see {@link Psql15_0_Column_MaxLengthConstraint}
 */
export const Psql15_0_Column_TextConstraints = z
  .object({
    nullable: Psql15_0_Column_NullableProp,
    min_length: Psql15_0_Column_MinLengthConstraint.optional(),
    max_length: Psql15_0_Column_MaxLengthConstraint.optional()
  })
  .strict();

/**
 * ### Psql15_0_Column_IntegerConstraints
 *
 * Constraints for integer column types.
 *
 * Fields:
 * - `nullable` - Whether column can be null (defaults to true) - see {@link Psql15_0_Column_NullableProp}
 * - `min_value` - Minimum value constraint (optional) - see {@link Psql15_0_Column_MinValueConstraint}
 * - `max_value` - Maximum value constraint (optional) - see {@link Psql15_0_Column_MaxValueConstraint}
 */
export const Psql15_0_Column_IntegerConstraints = z
  .object({
    nullable: Psql15_0_Column_NullableProp,
    min_value: Psql15_0_Column_MinValueConstraint.optional(),
    max_value: Psql15_0_Column_MaxValueConstraint.optional()
  })
  .strict();
