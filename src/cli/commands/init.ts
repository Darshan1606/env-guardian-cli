import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { loadEnvFile, inferSchemaFromEnv } from '../../core/loader.js';
import { createSchemaFile, getDefaultSchema, findSchemaFile } from '../../core/schema.js';

export const initCommand = new Command('init')
  .description('Initialize a new env.schema.json file')
  .option('-f, --format <format>', 'Output format (json or js)', 'json')
  .option('-o, --output <path>', 'Output path for schema file', 'env.schema.json')
  .option('--no-infer', 'Do not infer schema from existing .env file')
  .option('--force', 'Overwrite existing schema file')
  .action(async (options: { format: string; output: string; infer: boolean; force: boolean }) => {
    logger.header('env-guardian init');

    const format = options.format as 'json' | 'js';
    const outputPath = options.output || (format === 'js' ? 'env.schema.js' : 'env.schema.json');

    // Check if schema already exists
    const existingSchema = findSchemaFile();
    if (existingSchema && !options.force) {
      logger.warning(`Schema file already exists: ${existingSchema}`);
      logger.info('Use --force to overwrite');
      process.exit(1);
    }

    let variables: Record<string, unknown>;

    // Try to infer from existing .env
    if (options.infer) {
      const envPath = path.resolve(process.cwd(), '.env');

      if (fs.existsSync(envPath)) {
        logger.info('Found .env file, inferring schema...');
        const envResult = loadEnvFile('.env');

        if (envResult.success) {
          variables = inferSchemaFromEnv(envResult.env);
          logger.success(`Inferred ${Object.keys(variables).length} variables from .env`);
        } else {
          logger.warning(`Could not parse .env: ${envResult.error}`);
          variables = getDefaultSchema();
        }
      } else {
        logger.info('No .env file found, using default template');
        variables = getDefaultSchema();
      }
    } else {
      variables = getDefaultSchema();
    }

    // Create schema file
    const result = createSchemaFile(outputPath, variables, format);

    if (result.success) {
      logger.success(`Created schema file: ${result.path}`);
      logger.newline();
      logger.info('Next steps:');
      logger.dim('  1. Edit the schema file to define your environment variables');
      logger.dim('  2. Run "npx env-guardian validate" to check your .env');
      logger.dim('  3. Run "npx env-guardian generate" to create TypeScript types');
    } else {
      logger.error(`Failed to create schema: ${result.error}`);
      process.exit(1);
    }
  });
