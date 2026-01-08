import { z } from 'zod';

// ============================================
// Schema Types
// ============================================

export const VariableTypeEnum = z.enum(['string', 'number', 'boolean']);
export type VariableType = z.infer<typeof VariableTypeEnum>;

export const StringFormatEnum = z.enum([
  'url',
  'email',
  'uuid',
  'json',
  'base64',
  'hex',
  'alphanumeric',
]);
export type StringFormat = z.infer<typeof StringFormatEnum>;

export const NumberFormatEnum = z.enum(['port', 'positive', 'integer', 'percentage']);
export type NumberFormat = z.infer<typeof NumberFormatEnum>;

export const VariableSchema = z.object({
  type: VariableTypeEnum,
  format: z.string().optional(),
  required: z.boolean().default(true),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  description: z.string().optional(),
  enum: z.array(z.string()).optional(),
  pattern: z.string().optional(), // Custom regex pattern
  min: z.number().optional(), // For numbers
  max: z.number().optional(), // For numbers
  minLength: z.number().optional(), // For strings
  maxLength: z.number().optional(), // For strings
});

export type Variable = z.infer<typeof VariableSchema>;

export const EnvSchemaDefinition = z.object({
  $schema: z.string().optional(),
  variables: z.record(VariableSchema),
});

export type EnvSchema = z.infer<typeof EnvSchemaDefinition>;

// ============================================
// Validation Types
// ============================================

export interface ValidationError {
  variable: string;
  message: string;
  type: 'missing' | 'invalid_type' | 'invalid_format' | 'invalid_enum' | 'invalid_range';
  expected?: string;
  received?: string;
}

export interface ValidationWarning {
  variable: string;
  message: string;
  type: 'unused' | 'default_applied' | 'deprecated';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  parsed: Record<string, string | number | boolean>;
}

// ============================================
// CLI Types
// ============================================

export interface ValidateOptions {
  env?: string;
  schema?: string;
  strict?: boolean;
}

export interface InitOptions {
  format?: 'json' | 'js';
  output?: string;
  infer?: boolean;
}

export interface GenerateOptions {
  schema?: string;
  output?: string;
  namespace?: boolean;
}

export interface SyncOptions {
  schema?: string;
  output?: string;
  comments?: boolean;
}

// ============================================
// Configuration
// ============================================

export const DEFAULT_SCHEMA_PATHS = ['env.schema.json', 'env.schema.js', '.env.schema.json'];

export const DEFAULT_ENV_PATH = '.env';

export const DEFAULT_TYPES_OUTPUT = 'env.d.ts';

export const DEFAULT_EXAMPLE_OUTPUT = '.env.example';
