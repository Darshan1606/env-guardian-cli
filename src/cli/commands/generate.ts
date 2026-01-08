import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { loadSchema, findSchemaFile } from '../../core/schema.js';
import { writeTypeScriptFile } from '../../core/generator.js';
import { DEFAULT_TYPES_OUTPUT } from '../../types/index.js';

export const generateCommand = new Command('generate')
  .description('Generate TypeScript type declarations from schema')
  .option('-s, --schema <path>', 'Path to schema file')
  .option('-o, --output <path>', 'Output path for TypeScript file', DEFAULT_TYPES_OUTPUT)
  .option('--no-namespace', 'Do not generate NodeJS.ProcessEnv augmentation')
  .action(async (options: { schema?: string; output: string; namespace: boolean }) => {
    logger.header('env-guardian generate');

    // Find and load schema
    const schemaPath = findSchemaFile(options.schema);

    if (!schemaPath) {
      logger.error('No schema file found');
      logger.info('Run "npx env-guardian init" to create one');
      process.exit(2);
    }

    logger.dim(`Using schema: ${schemaPath}`);

    const schemaResult = loadSchema(schemaPath);

    if (!schemaResult.success || !schemaResult.schema) {
      logger.error(`Failed to load schema: ${schemaResult.error}`);
      process.exit(1);
    }

    // Generate TypeScript
    const result = writeTypeScriptFile(schemaResult.schema, options.output, {
      namespace: options.namespace,
    });

    if (result.success) {
      const varCount = Object.keys(schemaResult.schema.variables).length;
      logger.success(`Generated TypeScript types: ${result.path}`);
      logger.dim(`  ${varCount} variable(s) typed`);
      logger.newline();
      logger.info('Add to your tsconfig.json "include" or import in a .d.ts file');
    } else {
      logger.error(`Failed to generate types: ${result.error}`);
      process.exit(1);
    }
  });
