#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { compileCommand } from './commands/compile';
import { devCommand } from './commands/dev';
import { validateCommand } from './commands/validate';
import { cacheCommand } from './commands/cache';

const program = new Command();

// Basic CLI setup
program
  .name('ucc')
  .description('Universal Content Compiler - Transform content folders into websites')
  .version('0.1.0')
  .option('-v, --verbose', 'enable verbose output')
  .option('-q, --quiet', 'suppress all output except errors')
  .option('-c, --config <path>', 'path to config file')
  .option('--cache-dir <dir>', 'cache directory path');

// Main commands
program
  .command('compile')
  .description('Compile content to target platform')
  .argument('[source]', 'source content directory', './Content')
  .argument('[target]', 'output directory', './dist')
  .option('-p, --platform <platform>', 'target platform (html, cloudflare-pages, cloudflare-workers)', 'html')
  .option('-d, --design-system <system>', 'design system to use')
  .option('-w, --watch', 'watch for changes and recompile')
  .option('--clean', 'clean output directory before compiling')
  .action(compileCommand);

program
  .command('dev')
  .description('Start development server with hot reload')
  .argument('[source]', 'source content directory', './Content')
  .option('-p, --port <port>', 'port to run server on', '3000')
  .option('-h, --host <host>', 'host to bind server to', 'localhost')
  .option('--open', 'open browser automatically')
  .action(devCommand);

program
  .command('validate')
  .description('Validate content structure and configuration')
  .argument('[source]', 'source content directory', './Content')
  .option('--strict', 'fail on warnings')
  .option('--fix', 'attempt to fix validation issues')
  .action(validateCommand);

// Cache management
program
  .command('cache')
  .description('Manage compilation cache')
  .addCommand(
    new Command('clean')
      .description('Clean cache')
      .option('-b, --bucket <bucket>', 'specific bucket to clean')
      .option('-f, --force', 'force clean without confirmation')
      .action((options) => cacheCommand('clean', options))
  )
  .addCommand(
    new Command('stats')
      .description('Show cache statistics')
      .action(() => cacheCommand('stats', {}))
  )
  .addCommand(
    new Command('prune')
      .description('Remove expired cache entries')
      .action(() => cacheCommand('prune', {}))
  );

// Error handling
program.exitOverride();

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message);
  if (program.opts().verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

// Parse and run
program.parse();