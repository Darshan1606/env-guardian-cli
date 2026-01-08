#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { validateCommand } from './commands/validate.js';
import { generateCommand } from './commands/generate.js';
import { syncCommand } from './commands/sync.js';
import { checkCommand } from './commands/check.js';

const program = new Command();

program
  .name('env-guardian-cli')
  .description('Validate, document, and type-check your environment variables')
  .version('1.0.0');

// Register commands
program.addCommand(initCommand);
program.addCommand(validateCommand);
program.addCommand(generateCommand);
program.addCommand(syncCommand);
program.addCommand(checkCommand);

// Parse arguments
program.parse();
