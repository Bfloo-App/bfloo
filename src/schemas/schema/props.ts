// Package imports
import z from 'zod';

// Project imports
import { SUPPORTED_DATABASE_ENGINES } from '../../constants/databaseRegistry';

/**
 * ### Schema_IdProp
 *
 * Zod schema validator for database schema unique identifier.
 */
export const Schema_IdProp = z.uuidv4();

/**
 * ### Schema_NameProp
 *
 * Zod schema validator for database schema name (1-64 characters).
 * Allows letters, numbers, spaces, hyphens, underscores, and dots.
 */
export const Schema_NameProp = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9 ._-]+$/);

/**
 * ### Schema_EngineProp
 *
 * Zod schema validator for database engine type identifier.
 *
 * See {@link SUPPORTED_DATABASE_ENGINES} for supported engines.
 */
export const Schema_EngineProp = z.enum(SUPPORTED_DATABASE_ENGINES);

/**
 * ### Schema_DescriptionProp
 *
 * Zod schema validator for optional database schema description (max 256 characters).
 */
export const Schema_DescriptionProp = z.string().trim().max(256).nullable();

/**
 * ### Schema_CreatedAtProp
 *
 * Zod schema validator for database schema creation timestamp.
 */
export const Schema_CreatedAtProp = z.coerce.date();

/**
 * ### Schema_UpdatedAtProp
 *
 * Zod schema validator for database schema last update timestamp.
 */
export const Schema_UpdatedAtProp = z.coerce.date();

/**
 * ### Project_IdProp
 *
 * Project unique identifier validation schema.
 */
export const Project_IdProp = z.uuidv4();
