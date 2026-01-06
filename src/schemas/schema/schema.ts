// Package imports
import z from 'zod';

// Project imports
import {
  Schema_CreatedAtProp,
  Schema_DescriptionProp,
  Schema_EngineProp,
  Schema_IdProp,
  Schema_NameProp,
  Schema_UpdatedAtProp,
  Project_IdProp
} from './props';

/**
 * ### Schema_Schema
 *
 * Zod schema validator for schema object (response model).
 *
 * Fields:
 * - `id` - Schema unique identifier - see {@link Schema_IdProp}
 * - `projectId` - Parent project identifier - see {@link Project_IdProp}
 * - `name` - Schema name - see {@link Schema_NameProp}
 * - `engine` - Database engine type - see {@link Schema_EngineProp}
 * - `description` - Optional description - see {@link Schema_DescriptionProp}
 * - `createdAt` - Creation timestamp - see {@link Schema_CreatedAtProp}
 * - `updatedAt` - Last update timestamp - see {@link Schema_UpdatedAtProp}
 */
export const Schema_Schema = z.object({
  id: Schema_IdProp,
  projectId: Project_IdProp,
  name: Schema_NameProp,
  engine: Schema_EngineProp,
  description: Schema_DescriptionProp,
  createdAt: Schema_CreatedAtProp,
  updatedAt: Schema_UpdatedAtProp
});
