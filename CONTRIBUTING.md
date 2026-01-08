# Contributing to env-guardian-cli

Thank you for your interest in contributing to env-guardian-cli! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/yourusername/env-guardian-cli.git
cd env-guardian-cli
```

2. **Install dependencies**

```bash
npm install
```

3. **Run tests**

```bash
npm test
```

4. **Build the project**

```bash
npm run build
```

## Project Structure

```
env-guardian-cli/
├── src/
│   ├── cli/              # CLI implementation
│   │   ├── commands/     # Individual CLI commands
│   │   ├── utils/        # CLI utilities (logger, etc.)
│   │   └── index.ts      # CLI entry point
│   ├── core/             # Core logic
│   │   ├── loader.ts     # .env file loading
│   │   ├── schema.ts     # Schema parsing
│   │   ├── validator.ts  # Validation logic
│   │   └── generator.ts  # TypeScript/example generation
│   ├── types/            # TypeScript types
│   └── index.ts          # Library entry point
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── fixtures/         # Test fixtures
└── templates/            # Default templates
```

## Development Workflow

### Running Locally

```bash
# Run CLI in development mode
npm run local -- validate

# Watch mode for development
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- validator.test.ts
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format
```

### Type Checking

```bash
npm run typecheck
```

## Making Changes

1. **Create a branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**

- Write tests for new functionality
- Update documentation if needed
- Follow the existing code style

3. **Run checks**

```bash
npm run typecheck
npm run lint
npm test
```

4. **Commit your changes**

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add new validation format"
git commit -m "fix: handle empty env files"
git commit -m "docs: update README examples"
```

5. **Push and create a Pull Request**

```bash
git push origin feature/your-feature-name
```

## Pull Request Guidelines

- Provide a clear description of the changes
- Link any related issues
- Ensure all tests pass
- Update documentation if needed
- Keep changes focused and atomic

## Adding New Features

### Adding a New Format Validator

1. Add the format to `src/types/index.ts`:

```typescript
export const StringFormatEnum = z.enum([
  // ... existing formats
  'your-new-format',
]);
```

2. Add the validator to `src/core/validator.ts`:

```typescript
const formatValidators: Record<string, (value: string) => boolean> = {
  // ... existing validators
  'your-new-format': (value) => {
    // validation logic
    return true;
  },
};
```

3. Add tests in `tests/unit/validator.test.ts`

4. Update the README

### Adding a New CLI Command

1. Create the command file in `src/cli/commands/`:

```typescript
// src/cli/commands/your-command.ts
import { Command } from 'commander';
import { logger } from '../utils/logger.js';

export const yourCommand = new Command('your-command')
  .description('Description of your command')
  .option('-o, --option <value>', 'Option description')
  .action(async (options) => {
    // Implementation
  });
```

2. Register in `src/cli/index.ts`:

```typescript
import { yourCommand } from './commands/your-command.js';
program.addCommand(yourCommand);
```

3. Add tests and documentation

## Code Style

- Use TypeScript strict mode
- Prefer functional programming patterns
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused

## Questions?

Feel free to open an issue for questions or discussions!
