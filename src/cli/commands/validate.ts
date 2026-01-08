import { Command } from 'commander';
import { logger, formatValidationResult } from '../utils/logger.js';
import { loadEnvFile, loadProcessEnv, mergeEnv } from '../../core/loader.js';
import { loadSchema, findSchemaFile } from '../../core/schema.js';
import { validate } from '../../core/validator.js';

export const validateCommand = new Command('validate')
  .description('Validate environment variables against schema')
  .option('-e, --env <path>', 'Path to .env file', '.env')
  .option('-s, --schema <path>', 'Path to schema file')
  .option('--strict', 'Warn about env vars not defined in schema')
  .option('--ci', 'CI mode - exit with error code on validation failure')
  .option('--process-env', 'Also validate process.env (merged with .env)')
  .action(
    async (options: {
      env: string;
      schema?: string;
      strict?: boolean;
      ci?: boolean;
      processEnv?: boolean;
    }) => {
      logger.header('env-guardian-cli validate');

      // Find and load schema
      const schemaPath = findSchemaFile(options.schema);

      if (!schemaPath) {
        logger.error('No schema file found');
        logger.info('Run "npx env-guardian-cli init" to create one');
        process.exit(2);
      }

      logger.dim(`Using schema: ${schemaPath}`);

      const schemaResult = loadSchema(schemaPath);

      if (!schemaResult.success || !schemaResult.schema) {
        logger.error(`Failed to load schema: ${schemaResult.error}`);
        process.exit(2);
      }

      // Load environment variables
      let env: Record<string, string> = {};

      const envResult = loadEnvFile(options.env);

      if (envResult.success) {
        logger.dim(`Using env file: ${envResult.path}`);
        env = envResult.env;
      } else {
        logger.warning(`No .env file found at ${options.env}`);

        if (!options.processEnv) {
          logger.info('Use --process-env to validate from process.env instead');
        }
      }

      // Merge with process.env if requested
      if (options.processEnv) {
        const processEnv = loadProcessEnv();
        env = mergeEnv(processEnv, env);
        logger.dim('Merged with process.env');
      }

      logger.newline();

      // Validate
      const result = validate(schemaResult.schema, env, { strict: options.strict });

      // Output results
      const variableNames = Object.keys(schemaResult.schema.variables);

      for (const name of variableNames) {
        const error = result.errors.find((e) => e.variable === name);
        const warning = result.warnings.find((w) => w.variable === name);

        if (error) {
          console.log(formatValidationResult(name, error.type === 'missing' ? 'missing' : 'invalid', error.message));
        } else if (warning && warning.type === 'default_applied') {
          console.log(formatValidationResult(name, 'default', warning.message));
        } else if (result.parsed[name] !== undefined) {
          const spec = schemaResult.schema.variables[name];
          const details = spec.format ? spec.format : spec.type;
          console.log(formatValidationResult(name, 'valid', details));
        }
      }

      // Show unused warnings in strict mode
      const unusedWarnings = result.warnings.filter((w) => w.type === 'unused');
      if (unusedWarnings.length > 0) {
        logger.newline();
        logger.warning('Variables not in schema:');
        for (const warning of unusedWarnings) {
          logger.dim(`  - ${warning.variable}`);
        }
      }

      // Summary
      logger.newline();

      if (result.valid) {
        logger.success(`Validation passed (${variableNames.length} variables)`);

        if (result.warnings.length > 0) {
          logger.warning(`${result.warnings.length} warning(s)`);
        }

        process.exit(0);
      } else {
        logger.error(`Validation failed: ${result.errors.length} error(s)`);

        if (options.ci) {
          process.exit(1);
        } else {
          logger.newline();
          logger.info('Fix the errors above and run validate again');
          process.exit(1);
        }
      }
    }
  );
