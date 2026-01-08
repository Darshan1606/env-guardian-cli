import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { loadEnvFile, loadProcessEnv, mergeEnv } from '../../core/loader.js';
import { loadSchema, findSchemaFile } from '../../core/schema.js';
import { isValid } from '../../core/validator.js';

export const checkCommand = new Command('check')
  .description('Quick validation check (for CI/pre-commit hooks)')
  .option('-e, --env <path>', 'Path to .env file', '.env')
  .option('-s, --schema <path>', 'Path to schema file')
  .option('--process-env', 'Validate process.env instead of .env file')
  .option('-q, --quiet', 'Suppress all output')
  .action(
    async (options: { env: string; schema?: string; processEnv?: boolean; quiet?: boolean }) => {
      const log = options.quiet ? () => {} : logger.error;

      // Find and load schema
      const schemaPath = findSchemaFile(options.schema);

      if (!schemaPath) {
        log('No schema file found');
        process.exit(2);
      }

      const schemaResult = loadSchema(schemaPath);

      if (!schemaResult.success || !schemaResult.schema) {
        log(`Schema error: ${schemaResult.error}`);
        process.exit(2);
      }

      // Load environment variables
      let env: Record<string, string> = {};

      if (options.processEnv) {
        env = loadProcessEnv();
      } else {
        const envResult = loadEnvFile(options.env);
        if (envResult.success) {
          env = envResult.env;
        }
      }

      // Validate
      const valid = isValid(schemaResult.schema, env);

      if (valid) {
        if (!options.quiet) {
          logger.success('Environment valid');
        }
        process.exit(0);
      } else {
        if (!options.quiet) {
          logger.error('Environment invalid');
          logger.info('Run "npx env-guardian-cli validate" for details');
        }
        process.exit(1);
      }
    }
  );
