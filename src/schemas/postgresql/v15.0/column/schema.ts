// Package imports
import z from 'zod';

// Project imports
import {
  Psql15_0_Column_BaseConstraints,
  Psql15_0_Column_DefaultProp,
  Psql15_0_Column_DescriptionProp,
  Psql15_0_Column_IdProp,
  Psql15_0_Column_IntegerConstraints,
  Psql15_0_Column_NameProp,
  Psql15_0_Column_TextConstraints,
  Psql15_0_Column_TypeEnum
} from './props';

/**
 * ### Psql15_0_ColumnSchema
 *
 * Zod schema validator for PostgreSQL column definition with type-specific constraints and validation rules.
 *
 * Fields:
 * - `id` - Column unique identifier (required) - see {@link Psql15_0_Column_IdProp}
 * - `name` - Column name - see {@link Psql15_0_Column_NameProp}
 * - `type` - Column data type - see {@link Psql15_0_Column_TypeEnum}
 * - `description` - Column description (optional) - see {@link Psql15_0_Column_DescriptionProp}
 * - `default` - Default value (optional, type depends on column type) - see {@link Psql15_0_Column_DefaultProp}
 * - `constraints` - Column constraints (optional, type depends on column type)
 */
export const Psql15_0_ColumnSchema = z
  .object({
    id: Psql15_0_Column_IdProp,
    name: Psql15_0_Column_NameProp,
    type: Psql15_0_Column_TypeEnum,
    description: Psql15_0_Column_DescriptionProp.optional(),
    default: Psql15_0_Column_DefaultProp.optional(),
    constraints: z
      .union([
        Psql15_0_Column_BaseConstraints,
        Psql15_0_Column_TextConstraints,
        Psql15_0_Column_IntegerConstraints
      ])
      .optional()
  })
  .strict()
  .superRefine((data, ctx) => {
    // Type-specific default value validation
    if (data.default !== undefined) {
      // Text column: default must be string or null
      if (
        data.type === 'text' &&
        typeof data.default !== 'string' &&
        data.default !== null
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Text column default must be string or null',
          path: ['default']
        });
      }

      // Integer column: default must be integer or null
      if (
        data.type === 'integer' &&
        typeof data.default !== 'number' &&
        data.default !== null
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Integer column default must be integer or null',
          path: ['default']
        });
      }

      // Boolean column: default must be boolean or null
      if (
        data.type === 'boolean' &&
        typeof data.default !== 'boolean' &&
        data.default !== null
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Boolean column default must be boolean or null',
          path: ['default']
        });
      }

      // Date column: default must be "current_date" or null
      if (data.type === 'date') {
        if (data.default !== 'current_date' && data.default !== null) {
          ctx.addIssue({
            code: 'custom',
            message: 'Date column default must be "current_date" or null',
            path: ['default']
          });
        }
      }

      // Timestamp column: default must be "current_timestamp" or null
      if (data.type === 'timestamp') {
        if (data.default !== 'current_timestamp' && data.default !== null) {
          ctx.addIssue({
            code: 'custom',
            message:
              'Timestamp column default must be "current_timestamp" or null',
            path: ['default']
          });
        }
      }

      // Serial column: default must be false (no default allowed)
      if (data.type === 'serial' && data.default !== false) {
        ctx.addIssue({
          code: 'custom',
          message: 'Serial columns cannot have default values',
          path: ['default']
        });
      }
    }

    // Default null requires nullable=true (cannot have default=null with nullable=false)
    if (data.default === null && data.constraints?.nullable === false) {
      ctx.addIssue({
        code: 'custom',
        message: 'Cannot have default=null with nullable=false',
        path: ['default']
      });
    }

    // Type-specific constraint validation (text constraints only for text type)
    if (
      data.constraints &&
      'min_length' in data.constraints &&
      data.type !== 'text'
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'min_length constraint is only valid for text columns',
        path: ['constraints', 'min_length']
      });
    }

    if (
      data.constraints &&
      'max_length' in data.constraints &&
      data.type !== 'text'
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'max_length constraint is only valid for text columns',
        path: ['constraints', 'max_length']
      });
    }

    // Type-specific constraint validation (integer constraints only for integer type)
    if (
      data.constraints &&
      'min_value' in data.constraints &&
      data.type !== 'integer'
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'min_value constraint is only valid for integer columns',
        path: ['constraints', 'min_value']
      });
    }

    if (
      data.constraints &&
      'max_value' in data.constraints &&
      data.type !== 'integer'
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'max_value constraint is only valid for integer columns',
        path: ['constraints', 'max_value']
      });
    }
  });
