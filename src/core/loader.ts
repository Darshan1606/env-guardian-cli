import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export interface LoadEnvResult {
  success: boolean;
  env: Record<string, string>;
  error?: string;
  path: string;
}

/**
 * Load environment variables from a .env file
 */
export function loadEnvFile(envPath: string): LoadEnvResult {
  const absolutePath = path.resolve(process.cwd(), envPath);

  if (!fs.existsSync(absolutePath)) {
    return {
      success: false,
      env: {},
      error: `File not found: ${absolutePath}`,
      path: absolutePath,
    };
  }

  try {
    const content = fs.readFileSync(absolutePath, 'utf-8');
    const parsed = dotenv.parse(content);

    return {
      success: true,
      env: parsed,
      path: absolutePath,
    };
  } catch (error) {
    return {
      success: false,
      env: {},
      error: `Failed to parse env file: ${error instanceof Error ? error.message : String(error)}`,
      path: absolutePath,
    };
  }
}

/**
 * Load environment variables from process.env
 */
export function loadProcessEnv(): Record<string, string> {
  const env: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }

  return env;
}

/**
 * Merge multiple env sources (later sources override earlier ones)
 */
export function mergeEnv(...sources: Record<string, string>[]): Record<string, string> {
  return Object.assign({}, ...sources);
}

/**
 * Infer variable types from string values
 */
export function inferType(value: string): 'string' | 'number' | 'boolean' {
  // Check for boolean
  if (['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase())) {
    return 'boolean';
  }

  // Check for number
  if (/^-?\d+(\.\d+)?$/.test(value) && !isNaN(Number(value))) {
    return 'number';
  }

  return 'string';
}

/**
 * Infer format from string value
 */
export function inferFormat(
  value: string
): 'url' | 'email' | 'uuid' | 'json' | 'port' | undefined {
  // URL
  if (/^https?:\/\//.test(value)) {
    return 'url';
  }

  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'email';
  }

  // UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return 'uuid';
  }

  // JSON (basic check)
  if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
    try {
      JSON.parse(value);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  // Port number
  const num = Number(value);
  if (!isNaN(num) && num >= 1 && num <= 65535 && Number.isInteger(num)) {
    return 'port';
  }

  return undefined;
}

/**
 * Infer schema from existing env variables
 */
export function inferSchemaFromEnv(
  env: Record<string, string>
): Record<string, { type: string; format?: string; required: boolean; description: string }> {
  const variables: Record<
    string,
    { type: string; format?: string; required: boolean; description: string }
  > = {};

  for (const [key, value] of Object.entries(env)) {
    const type = inferType(value);
    const format = inferFormat(value);

    variables[key] = {
      type,
      ...(format && { format }),
      required: true,
      description: `TODO: Add description for ${key}`,
    };
  }

  return variables;
}
