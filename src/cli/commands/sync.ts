import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { loadSchema, findSchemaFile } from '../../core/schema.js';
import { writeEnvExample } from '../../core/generator.js';
import { DEFAULT_EXAMPLE_OUTPUT } from '../../types/index.js';

export const syncCommand = new Command('sync')
  .description('Generate .env.example from schema')
  .option('-s, --schema <path>', 'Path to schema file')
  .option('-o, --output <path>', 'Output path for .env.example', DEFAULT_EXAMPLE_OUTPUT)
  .option('--no-comments', 'Do not include comments in output')
  .action(async (options: { schema?: string; output: string; comments: boolean }) => {
    logger.header('env-guardian-cli sync');

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
      process.exit(1);
    }

    // Generate .env.example
    const result = writeEnvExample(schemaResult.schema, options.output, {
      comments: options.comments,
    });

    if (result.success) {
      const varCount = Object.keys(schemaResult.schema.variables).length;
      logger.success(`Generated: ${result.path}`);
      logger.dim(`  ${varCount} variable(s) documented`);
      logger.newline();
      logger.info('Share this file with your team to document required environment variables');
    } else {
      logger.error(`Failed to generate .env.example: ${result.error}`);
      process.exit(1);
    }
  });
