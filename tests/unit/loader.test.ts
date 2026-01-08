import { describe, it, expect } from 'vitest';
import { inferType, inferFormat, inferSchemaFromEnv } from '../../src/core/loader';

describe('loader', () => {
  describe('inferType', () => {
    it('should infer boolean from true/false', () => {
      expect(inferType('true')).toBe('boolean');
      expect(inferType('false')).toBe('boolean');
      expect(inferType('TRUE')).toBe('boolean');
      expect(inferType('FALSE')).toBe('boolean');
    });

    it('should infer boolean from 1/0', () => {
      expect(inferType('1')).toBe('boolean');
      expect(inferType('0')).toBe('boolean');
    });

    it('should infer boolean from yes/no', () => {
      expect(inferType('yes')).toBe('boolean');
      expect(inferType('no')).toBe('boolean');
      expect(inferType('YES')).toBe('boolean');
      expect(inferType('NO')).toBe('boolean');
    });

    it('should infer number from numeric strings', () => {
      expect(inferType('123')).toBe('number');
      expect(inferType('3.14')).toBe('number');
      expect(inferType('-42')).toBe('number');
      expect(inferType('0.5')).toBe('number');
    });

    it('should infer string for everything else', () => {
      expect(inferType('hello')).toBe('string');
      expect(inferType('https://example.com')).toBe('string');
      expect(inferType('user@email.com')).toBe('string');
      expect(inferType('')).toBe('string');
    });
  });

  describe('inferFormat', () => {
    it('should infer url format', () => {
      expect(inferFormat('https://example.com')).toBe('url');
      expect(inferFormat('http://localhost:3000')).toBe('url');
    });

    it('should infer email format', () => {
      expect(inferFormat('user@example.com')).toBe('email');
      expect(inferFormat('admin@company.org')).toBe('email');
    });

    it('should infer uuid format', () => {
      expect(inferFormat('550e8400-e29b-41d4-a716-446655440000')).toBe('uuid');
      expect(inferFormat('123e4567-e89b-12d3-a456-426614174000')).toBe('uuid');
    });

    it('should infer json format', () => {
      expect(inferFormat('{"key":"value"}')).toBe('json');
      expect(inferFormat('[1,2,3]')).toBe('json');
    });

    it('should infer port format for valid ports', () => {
      expect(inferFormat('3000')).toBe('port');
      expect(inferFormat('8080')).toBe('port');
      expect(inferFormat('443')).toBe('port');
    });

    it('should return undefined for unknown formats', () => {
      expect(inferFormat('random string')).toBeUndefined();
      expect(inferFormat('not-a-special-format')).toBeUndefined();
    });
  });

  describe('inferSchemaFromEnv', () => {
    it('should infer schema from env object', () => {
      const env = {
        DATABASE_URL: 'https://db.example.com',
        PORT: '3000',
        DEBUG: 'true',
        API_KEY: 'sk-1234567890',
      };

      const schema = inferSchemaFromEnv(env);

      expect(schema.DATABASE_URL.type).toBe('string');
      expect(schema.DATABASE_URL.format).toBe('url');

      expect(schema.PORT.type).toBe('number');
      expect(schema.PORT.format).toBe('port');

      expect(schema.DEBUG.type).toBe('boolean');

      expect(schema.API_KEY.type).toBe('string');
    });

    it('should set all inferred variables as required', () => {
      const env = {
        VAR1: 'value1',
        VAR2: 'value2',
      };

      const schema = inferSchemaFromEnv(env);

      expect(schema.VAR1.required).toBe(true);
      expect(schema.VAR2.required).toBe(true);
    });

    it('should add placeholder descriptions', () => {
      const env = {
        MY_VAR: 'value',
      };

      const schema = inferSchemaFromEnv(env);

      expect(schema.MY_VAR.description).toContain('MY_VAR');
    });
  });
});
