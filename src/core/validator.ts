import {
  EnvSchema,
  Variable,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../types/index.js';

// ============================================
// Format Validators
// ============================================

const formatValidators: Record<string, (value: string) => boolean> = {
  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  email: (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },

  uuid: (value) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  },

  json: (value) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },

  base64: (value) => {
    return /^[A-Za-z0-9+/]*={0,2}$/.test(value) && value.length % 4 === 0;
  },

  hex: (value) => {
    return /^[0-9a-fA-F]+$/.test(value);
  },

  alphanumeric: (value) => {
    return /^[a-zA-Z0-9]+$/.test(value);
  },

  port: (value) => {
    const num = Number(value);
    return !isNaN(num) && num >= 1 && num <= 65535 && Number.isInteger(num);
  },

  positive: (value) => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  },

  integer: (value) => {
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num);
  },

  percentage: (value) => {
    const num = Number(value);
    return !isNaN(num) && num >= 0 && num <= 100;
  },
};

// ============================================
// Type Coercion
// ============================================

function coerceValue(
  value: string,
  type: Variable['type']
): { success: boolean; value: string | number | boolean; error?: string } {
  switch (type) {
    case 'string':
      return { success: true, value };

    case 'number': {
      const num = Number(value);
      if (isNaN(num)) {
        return {
          success: false,
          value,
          error: `Cannot convert "${value}" to number`,
        };
      }
      return { success: true, value: num };
    }

    case 'boolean': {
      const lower = value.toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(lower)) {
        return { success: true, value: true };
      }
      if (['false', '0', 'no', 'off'].includes(lower)) {
        return { success: true, value: false };
      }
      return {
        success: false,
        value,
        error: `Cannot convert "${value}" to boolean. Use true/false, 1/0, yes/no, or on/off`,
      };
    }

    default:
      return { success: true, value };
  }
}

// ============================================
// Validation
// ============================================

function validateVariable(
  name: string,
  value: string | undefined,
  spec: Variable
): { error?: ValidationError; warning?: ValidationWarning; parsed?: string | number | boolean } {
  // Check if required and missing
  if (value === undefined || value === '') {
    if (spec.required) {
      // Check for default
      if (spec.default !== undefined) {
        return {
          warning: {
            variable: name,
            message: `Using default value: ${spec.default}`,
            type: 'default_applied',
          },
          parsed: spec.default,
        };
      }
      return {
        error: {
          variable: name,
          message: `Required variable is missing`,
          type: 'missing',
        },
      };
    }

    // Optional and missing - use default if available
    if (spec.default !== undefined) {
      return {
        warning: {
          variable: name,
          message: `Using default value: ${spec.default}`,
          type: 'default_applied',
        },
        parsed: spec.default,
      };
    }

    return {}; // Optional and no default - skip
  }

  // Type coercion
  const coerced = coerceValue(value, spec.type);
  if (!coerced.success) {
    return {
      error: {
        variable: name,
        message: coerced.error || 'Type conversion failed',
        type: 'invalid_type',
        expected: spec.type,
        received: value,
      },
    };
  }

  // Enum validation
  if (spec.enum && spec.enum.length > 0) {
    if (!spec.enum.includes(value)) {
      return {
        error: {
          variable: name,
          message: `Value must be one of: ${spec.enum.join(', ')}`,
          type: 'invalid_enum',
          expected: spec.enum.join(' | '),
          received: value,
        },
      };
    }
  }

  // Format validation
  if (spec.format) {
    // Check for custom regex pattern
    if (spec.format.startsWith('regex:')) {
      const pattern = spec.format.slice(6);
      try {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
          return {
            error: {
              variable: name,
              message: `Value does not match pattern: ${pattern}`,
              type: 'invalid_format',
              expected: pattern,
              received: value,
            },
          };
        }
      } catch {
        return {
          error: {
            variable: name,
            message: `Invalid regex pattern: ${pattern}`,
            type: 'invalid_format',
          },
        };
      }
    } else {
      // Built-in format validator
      const validator = formatValidators[spec.format];
      if (validator && !validator(value)) {
        return {
          error: {
            variable: name,
            message: `Invalid ${spec.format} format`,
            type: 'invalid_format',
            expected: spec.format,
            received: value,
          },
        };
      }
    }
  }

  // Range validation for numbers
  if (spec.type === 'number') {
    const numValue = coerced.value as number;

    if (spec.min !== undefined && numValue < spec.min) {
      return {
        error: {
          variable: name,
          message: `Value ${numValue} is less than minimum ${spec.min}`,
          type: 'invalid_range',
          expected: `>= ${spec.min}`,
          received: String(numValue),
        },
      };
    }

    if (spec.max !== undefined && numValue > spec.max) {
      return {
        error: {
          variable: name,
          message: `Value ${numValue} is greater than maximum ${spec.max}`,
          type: 'invalid_range',
          expected: `<= ${spec.max}`,
          received: String(numValue),
        },
      };
    }
  }

  // Length validation for strings
  if (spec.type === 'string') {
    const strValue = coerced.value as string;

    if (spec.minLength !== undefined && strValue.length < spec.minLength) {
      return {
        error: {
          variable: name,
          message: `Value length ${strValue.length} is less than minimum ${spec.minLength}`,
          type: 'invalid_range',
          expected: `length >= ${spec.minLength}`,
          received: String(strValue.length),
        },
      };
    }

    if (spec.maxLength !== undefined && strValue.length > spec.maxLength) {
      return {
        error: {
          variable: name,
          message: `Value length ${strValue.length} is greater than maximum ${spec.maxLength}`,
          type: 'invalid_range',
          expected: `length <= ${spec.maxLength}`,
          received: String(strValue.length),
        },
      };
    }
  }

  // Custom pattern validation
  if (spec.pattern) {
    try {
      const regex = new RegExp(spec.pattern);
      if (!regex.test(value)) {
        return {
          error: {
            variable: name,
            message: `Value does not match pattern: ${spec.pattern}`,
            type: 'invalid_format',
            expected: spec.pattern,
            received: value,
          },
        };
      }
    } catch {
      // Invalid pattern - skip validation
    }
  }

  return { parsed: coerced.value };
}

/**
 * Validate environment variables against schema
 */
export function validate(
  schema: EnvSchema,
  env: Record<string, string | undefined>,
  options: { strict?: boolean } = {}
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const parsed: Record<string, string | number | boolean> = {};

  // Validate each variable in schema
  for (const [name, spec] of Object.entries(schema.variables)) {
    const result = validateVariable(name, env[name], spec);

    if (result.error) {
      errors.push(result.error);
    }

    if (result.warning) {
      warnings.push(result.warning);
    }

    if (result.parsed !== undefined) {
      parsed[name] = result.parsed;
    }
  }

  // In strict mode, warn about env vars not in schema
  if (options.strict) {
    const schemaKeys = new Set(Object.keys(schema.variables));

    for (const key of Object.keys(env)) {
      // Skip common system env vars
      if (isSystemEnvVar(key)) continue;

      if (!schemaKeys.has(key)) {
        warnings.push({
          variable: key,
          message: 'Variable not defined in schema',
          type: 'unused',
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    parsed,
  };
}

/**
 * Check if a variable is a common system env var
 */
function isSystemEnvVar(key: string): boolean {
  const systemVars = [
    'PATH',
    'HOME',
    'USER',
    'SHELL',
    'TERM',
    'LANG',
    'LC_ALL',
    'PWD',
    'OLDPWD',
    'HOSTNAME',
    'LOGNAME',
    'EDITOR',
    'VISUAL',
    '_',
    'SHLVL',
    'XDG_',
    'SSH_',
    'GPG_',
    'DISPLAY',
    'COLORTERM',
  ];

  return systemVars.some((prefix) => key.startsWith(prefix) || key === prefix);
}

/**
 * Quick validation - just check if valid, don't return details
 */
export function isValid(schema: EnvSchema, env: Record<string, string | undefined>): boolean {
  const result = validate(schema, env);
  return result.valid;
}
