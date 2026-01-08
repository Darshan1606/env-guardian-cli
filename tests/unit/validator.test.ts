import { describe, it, expect } from 'vitest';
import { validate, isValid } from '../../src/core/validator';
import type { EnvSchema } from '../../src/types';

describe('validator', () => {
  describe('validate', () => {
    it('should pass for valid required string', () => {
      const schema: EnvSchema = {
        variables: {
          DATABASE_URL: {
            type: 'string',
            required: true,
          },
        },
      };

      const result = validate(schema, { DATABASE_URL: 'postgres://localhost' });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.parsed.DATABASE_URL).toBe('postgres://localhost');
    });

    it('should fail for missing required variable', () => {
      const schema: EnvSchema = {
        variables: {
          API_KEY: {
            type: 'string',
            required: true,
          },
        },
      };

      const result = validate(schema, {});

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('missing');
      expect(result.errors[0].variable).toBe('API_KEY');
    });

    it('should apply default value for missing optional variable', () => {
      const schema: EnvSchema = {
        variables: {
          PORT: {
            type: 'number',
            required: false,
            default: 3000,
          },
        },
      };

      const result = validate(schema, {});

      expect(result.valid).toBe(true);
      expect(result.parsed.PORT).toBe(3000);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('default_applied');
    });

    it('should coerce string to number', () => {
      const schema: EnvSchema = {
        variables: {
          PORT: {
            type: 'number',
            required: true,
          },
        },
      };

      const result = validate(schema, { PORT: '8080' });

      expect(result.valid).toBe(true);
      expect(result.parsed.PORT).toBe(8080);
    });

    it('should fail for invalid number', () => {
      const schema: EnvSchema = {
        variables: {
          PORT: {
            type: 'number',
            required: true,
          },
        },
      };

      const result = validate(schema, { PORT: 'not-a-number' });

      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('invalid_type');
    });

    it('should coerce string to boolean', () => {
      const schema: EnvSchema = {
        variables: {
          ENABLE_CACHE: {
            type: 'boolean',
            required: true,
          },
        },
      };

      const trueValues = ['true', '1', 'yes', 'on', 'TRUE', 'Yes'];
      const falseValues = ['false', '0', 'no', 'off', 'FALSE', 'No'];

      for (const value of trueValues) {
        const result = validate(schema, { ENABLE_CACHE: value });
        expect(result.valid).toBe(true);
        expect(result.parsed.ENABLE_CACHE).toBe(true);
      }

      for (const value of falseValues) {
        const result = validate(schema, { ENABLE_CACHE: value });
        expect(result.valid).toBe(true);
        expect(result.parsed.ENABLE_CACHE).toBe(false);
      }
    });

    it('should validate enum values', () => {
      const schema: EnvSchema = {
        variables: {
          NODE_ENV: {
            type: 'string',
            required: true,
            enum: ['development', 'production', 'test'],
          },
        },
      };

      const validResult = validate(schema, { NODE_ENV: 'production' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(schema, { NODE_ENV: 'staging' });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0].type).toBe('invalid_enum');
    });

    it('should validate URL format', () => {
      const schema: EnvSchema = {
        variables: {
          API_URL: {
            type: 'string',
            required: true,
            format: 'url',
          },
        },
      };

      const validResult = validate(schema, { API_URL: 'https://api.example.com' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(schema, { API_URL: 'not-a-url' });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0].type).toBe('invalid_format');
    });

    it('should validate email format', () => {
      const schema: EnvSchema = {
        variables: {
          ADMIN_EMAIL: {
            type: 'string',
            required: true,
            format: 'email',
          },
        },
      };

      const validResult = validate(schema, { ADMIN_EMAIL: 'admin@example.com' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(schema, { ADMIN_EMAIL: 'not-an-email' });
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate UUID format', () => {
      const schema: EnvSchema = {
        variables: {
          SESSION_ID: {
            type: 'string',
            required: true,
            format: 'uuid',
          },
        },
      };

      const validResult = validate(schema, {
        SESSION_ID: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(schema, { SESSION_ID: 'not-a-uuid' });
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate JSON format', () => {
      const schema: EnvSchema = {
        variables: {
          CONFIG: {
            type: 'string',
            required: true,
            format: 'json',
          },
        },
      };

      const validResult = validate(schema, { CONFIG: '{"key":"value"}' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(schema, { CONFIG: '{invalid json}' });
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate port format', () => {
      const schema: EnvSchema = {
        variables: {
          PORT: {
            type: 'string',
            required: true,
            format: 'port',
          },
        },
      };

      const validResult = validate(schema, { PORT: '8080' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(schema, { PORT: '99999' });
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate number range (min/max)', () => {
      const schema: EnvSchema = {
        variables: {
          RETRY_COUNT: {
            type: 'number',
            required: true,
            min: 1,
            max: 10,
          },
        },
      };

      const validResult = validate(schema, { RETRY_COUNT: '5' });
      expect(validResult.valid).toBe(true);

      const tooLowResult = validate(schema, { RETRY_COUNT: '0' });
      expect(tooLowResult.valid).toBe(false);
      expect(tooLowResult.errors[0].type).toBe('invalid_range');

      const tooHighResult = validate(schema, { RETRY_COUNT: '15' });
      expect(tooHighResult.valid).toBe(false);
    });

    it('should validate string length (minLength/maxLength)', () => {
      const schema: EnvSchema = {
        variables: {
          API_KEY: {
            type: 'string',
            required: true,
            minLength: 10,
            maxLength: 50,
          },
        },
      };

      const validResult = validate(schema, { API_KEY: 'abcdefghij' });
      expect(validResult.valid).toBe(true);

      const tooShortResult = validate(schema, { API_KEY: 'short' });
      expect(tooShortResult.valid).toBe(false);
    });

    it('should validate custom regex pattern', () => {
      const schema: EnvSchema = {
        variables: {
          VERSION: {
            type: 'string',
            required: true,
            pattern: '^\\d+\\.\\d+\\.\\d+$',
          },
        },
      };

      const validResult = validate(schema, { VERSION: '1.2.3' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(schema, { VERSION: 'v1.2.3' });
      expect(invalidResult.valid).toBe(false);
    });

    it('should handle multiple variables', () => {
      const schema: EnvSchema = {
        variables: {
          DATABASE_URL: { type: 'string', required: true },
          PORT: { type: 'number', required: false, default: 3000 },
          NODE_ENV: { type: 'string', required: true, enum: ['dev', 'prod'] },
          DEBUG: { type: 'boolean', required: false, default: false },
        },
      };

      const result = validate(schema, {
        DATABASE_URL: 'postgres://localhost',
        NODE_ENV: 'prod',
      });

      expect(result.valid).toBe(true);
      expect(result.parsed.DATABASE_URL).toBe('postgres://localhost');
      expect(result.parsed.PORT).toBe(3000);
      expect(result.parsed.NODE_ENV).toBe('prod');
      expect(result.parsed.DEBUG).toBe(false);
    });

    it('should report multiple errors', () => {
      const schema: EnvSchema = {
        variables: {
          REQUIRED_1: { type: 'string', required: true },
          REQUIRED_2: { type: 'string', required: true },
          REQUIRED_3: { type: 'string', required: true },
        },
      };

      const result = validate(schema, {});

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('isValid', () => {
    it('should return true for valid env', () => {
      const schema: EnvSchema = {
        variables: {
          KEY: { type: 'string', required: true },
        },
      };

      expect(isValid(schema, { KEY: 'value' })).toBe(true);
    });

    it('should return false for invalid env', () => {
      const schema: EnvSchema = {
        variables: {
          KEY: { type: 'string', required: true },
        },
      };

      expect(isValid(schema, {})).toBe(false);
    });
  });
});
