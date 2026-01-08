import chalk from 'chalk';

export const logger = {
  info: (message: string) => {
    console.log(chalk.blue('ℹ'), message);
  },

  success: (message: string) => {
    console.log(chalk.green('✓'), message);
  },

  warning: (message: string) => {
    console.log(chalk.yellow('⚠'), message);
  },

  error: (message: string) => {
    console.log(chalk.red('✗'), message);
  },

  dim: (message: string) => {
    console.log(chalk.dim(message));
  },

  bold: (message: string) => {
    console.log(chalk.bold(message));
  },

  newline: () => {
    console.log();
  },

  table: (rows: Array<{ label: string; value: string; status?: 'success' | 'error' | 'warning' }>) => {
    const maxLabelLength = Math.max(...rows.map((r) => r.label.length));

    for (const row of rows) {
      const paddedLabel = row.label.padEnd(maxLabelLength);
      let statusIcon = '';

      switch (row.status) {
        case 'success':
          statusIcon = chalk.green('✓');
          break;
        case 'error':
          statusIcon = chalk.red('✗');
          break;
        case 'warning':
          statusIcon = chalk.yellow('⚠');
          break;
        default:
          statusIcon = ' ';
      }

      console.log(`${statusIcon} ${chalk.cyan(paddedLabel)}  ${row.value}`);
    }
  },

  header: (title: string) => {
    console.log();
    console.log(chalk.bold.underline(title));
    console.log();
  },

  box: (title: string, content: string[]) => {
    const maxLength = Math.max(title.length, ...content.map((c) => c.length));
    const border = '─'.repeat(maxLength + 4);

    console.log(chalk.dim(`┌${border}┐`));
    console.log(chalk.dim('│'), chalk.bold(title.padEnd(maxLength + 2)), chalk.dim('│'));
    console.log(chalk.dim(`├${border}┤`));

    for (const line of content) {
      console.log(chalk.dim('│'), line.padEnd(maxLength + 2), chalk.dim('│'));
    }

    console.log(chalk.dim(`└${border}┘`));
  },
};

export function formatValidationResult(
  variable: string,
  status: 'valid' | 'invalid' | 'missing' | 'default',
  details?: string
): string {
  const icons = {
    valid: chalk.green('✓'),
    invalid: chalk.red('✗'),
    missing: chalk.red('✗'),
    default: chalk.yellow('●'),
  };

  const colors = {
    valid: chalk.green,
    invalid: chalk.red,
    missing: chalk.red,
    default: chalk.yellow,
  };

  const icon = icons[status];
  const colorFn = colors[status];
  const statusText = colorFn(status.padEnd(8));
  const detailsText = details ? chalk.dim(` (${details})`) : '';

  return `${icon} ${chalk.cyan(variable.padEnd(20))} ${statusText}${detailsText}`;
}
