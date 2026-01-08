// env-guardian-cli - Validate, document, and type-check your environment variables
// Programmatic API

// Core types
export type {
  EnvSchema,
  Variable,
  VariableType,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidateOptions,
  InitOptions,
  GenerateOptions,
  SyncOptions,
} from './types/index.js';

// Schema operations
export { loadSchema, findSchemaFile, createSchemaFile, getDefaultSchema } from './core/schema.js';

// Validation
export { validate, isValid } from './core/validator.js';

// Env file operations
export {
  loadEnvFile,
  loadProcessEnv,
  mergeEnv,
  inferType,
  inferFormat,
  inferSchemaFromEnv,
} from './core/loader.js';

// Type generation
export {
  generateTypeScript,
  writeTypeScriptFile,
  generateEnvExample,
  writeEnvExample,
} from './core/generator.js';

// ============================================
// Convenience Functions
// ============================================

import { loadSchema as _loadSchema, findSchemaFile as _findSchemaFile } from './core/schema.js';
import { loadEnvFile as _loadEnvFile, loadProcessEnv as _loadProcessEnv } from './core/loader.js';
import { validate as _validate } from './core/validator.js';
import type { ValidationResult } from './types/index.js';

/**
 * Validate environment variables in one call
 *
 * @example
 * ```typescript
 * import { validateEnv } from 'env-guardian-cli';
 *
 * const result = validateEnv();
 *
 * if (!result.valid) {
 *   console.error('Invalid environment:', result.errors);
 *   process.exit(1);
 * }
 *
 * // Access typed env
 * const port = result.parsed.PORT; // number
 * ```
 */
export function validateEnv(options: {
  schemaPath?: string;
  envPath?: string;
  useProcessEnv?: boolean;
  strict?: boolean;
} = {}): ValidationResult & { schemaPath?: string } {
  // Find schema
  const schemaPath = _findSchemaFile(options.schemaPath);

  if (!schemaPath) {
    return {
      valid: false,
      errors: [
        {
          variable: '_schema',
          message: 'No schema file found. Run "npx env-guardian-cli init" to create one.',
          type: 'missing',
        },
      ],
      warnings: [],
      parsed: {},
    };
  }

  // Load schema
  const schemaResult = _loadSchema(schemaPath);

  if (!schemaResult.success || !schemaResult.schema) {
    return {
      valid: false,
      errors: [
        {
          variable: '_schema',
          message: schemaResult.error || 'Failed to load schema',
          type: 'missing',
        },
      ],
      warnings: [],
      parsed: {},
      schemaPath,
    };
  }

  // Load env
  let env: Record<string, string> = {};

  if (options.useProcessEnv) {
    env = _loadProcessEnv();
  }

  if (options.envPath || !options.useProcessEnv) {
    const envResult = _loadEnvFile(options.envPath || '.env');
    if (envResult.success) {
      env = { ...env, ...envResult.env };
    }
  }

  // Validate
  const result = _validate(schemaResult.schema, env, { strict: options.strict });

  return {
    ...result,
    schemaPath,
  };
}

/**
 * Guard function - throws if env is invalid
 *
 * @example
 * ```typescript
 * import { guardEnv } from 'env-guardian-cli';
 *
 * // At app startup
 * const env = guardEnv();
 * // Throws if invalid
 *
 * console.log(env.DATABASE_URL); // typed!
 * ```
 */
export function guardEnv<T extends Record<string, unknown> = Record<string, string | number | boolean>>(
  options: {
    schemaPath?: string;
    envPath?: string;
    useProcessEnv?: boolean;
  } = {}
): T {
  const result = validateEnv(options);

  if (!result.valid) {
    const errorMessages = result.errors.map((e) => `  - ${e.variable}: ${e.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  return result.parsed as T;
}
