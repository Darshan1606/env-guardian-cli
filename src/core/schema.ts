import * as fs from 'fs';
import * as path from 'path';
import { EnvSchema, EnvSchemaDefinition, DEFAULT_SCHEMA_PATHS } from '../types/index.js';

export interface LoadSchemaResult {
  success: boolean;
  schema?: EnvSchema;
  error?: string;
  path: string;
}

/**
 * Find schema file in project
 */
export function findSchemaFile(customPath?: string): string | null {
  if (customPath) {
    const absolutePath = path.resolve(process.cwd(), customPath);
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
    return null;
  }

  for (const schemaPath of DEFAULT_SCHEMA_PATHS) {
    const absolutePath = path.resolve(process.cwd(), schemaPath);
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
  }

  return null;
}

/**
 * Load and parse schema file
 */
export function loadSchema(schemaPath: string): LoadSchemaResult {
  const absolutePath = path.resolve(process.cwd(), schemaPath);

  if (!fs.existsSync(absolutePath)) {
    return {
      success: false,
      error: `Schema file not found: ${absolutePath}`,
      path: absolutePath,
    };
  }

  try {
    const content = fs.readFileSync(absolutePath, 'utf-8');
    const ext = path.extname(absolutePath).toLowerCase();

    let rawSchema: unknown;

    if (ext === '.json') {
      rawSchema = JSON.parse(content);
    } else if (ext === '.js') {
      // For .js files, we need to evaluate them
      // This is a simple approach - in production you might want to use require()
      const moduleContent = content.replace(/module\.exports\s*=\s*/, '');
      rawSchema = JSON.parse(moduleContent);
    } else {
      return {
        success: false,
        error: `Unsupported schema file format: ${ext}. Use .json or .js`,
        path: absolutePath,
      };
    }

    // Validate schema structure
    const parseResult = EnvSchemaDefinition.safeParse(rawSchema);

    if (!parseResult.success) {
      const errors = parseResult.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return {
        success: false,
        error: `Invalid schema structure: ${errors}`,
        path: absolutePath,
      };
    }

    return {
      success: true,
      schema: parseResult.data,
      path: absolutePath,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse schema: ${error instanceof Error ? error.message : String(error)}`,
      path: absolutePath,
    };
  }
}

/**
 * Create a new schema file
 */
export function createSchemaFile(
  outputPath: string,
  variables: Record<string, unknown>,
  format: 'json' | 'js' = 'json'
): { success: boolean; error?: string; path: string } {
  const absolutePath = path.resolve(process.cwd(), outputPath);

  const schema = {
    $schema: 'https://env-guardian-cli.dev/schema.json',
    variables,
  };

  try {
    let content: string;

    if (format === 'json') {
      content = JSON.stringify(schema, null, 2);
    } else {
      content = `module.exports = ${JSON.stringify(schema, null, 2)};`;
    }

    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(absolutePath, content, 'utf-8');

    return {
      success: true,
      path: absolutePath,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create schema file: ${error instanceof Error ? error.message : String(error)}`,
      path: absolutePath,
    };
  }
}

/**
 * Get default/template schema
 */
export function getDefaultSchema(): Record<
  string,
  { type: string; required: boolean; description: string; default?: unknown; enum?: string[] }
> {
  return {
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production', 'test'],
      required: true,
      description: 'Application environment',
    },
    PORT: {
      type: 'number',
      required: false,
      default: 3000,
      description: 'Server port',
    },
    DATABASE_URL: {
      type: 'string',
      required: true,
      description: 'Database connection string',
    },
    LOG_LEVEL: {
      type: 'string',
      enum: ['debug', 'info', 'warn', 'error'],
      required: false,
      default: 'info',
      description: 'Logging level',
    },
  };
}
