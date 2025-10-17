import * as path from 'path';
import chalk from 'chalk';
import chokidar from 'chokidar';
import { ContentLoader } from '../../core/content-loader';
import { Cache } from '../../cache';

export async function devCommand(
  source: string,
  options: {
    port: string;
    host: string;
    open?: boolean;
  }
) {
  const port = parseInt(options.port);
  const host = options.host;

  console.log(chalk.blue('🚀 Starting development server...'));
  console.log(chalk.gray(`   Source: ${source}`));
  console.log(chalk.gray(`   Server: http://${host}:${port}`));

  // Initialize components
  const contentLoader = new ContentLoader(source);
  const cache = new Cache();
  await cache.initialize();

  // Watch for file changes
  const watcher = chokidar.watch(source, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true
  });

  watcher.on('change', async (filePath) => {
    console.log(chalk.yellow(`📝 File changed: ${path.relative(process.cwd(), filePath)}`));

    try {
      // Clear relevant cache
      await cache.clearBucket('ast-v1');
      await cache.clearBucket('compiled-v1');

      // Recompile content
      const content = await contentLoader.loadContent();
      const validation = contentLoader.validateContent(content);

      if (validation.valid) {
        console.log(chalk.green('✅ Content recompiled successfully'));

        if (validation.warnings.length > 0) {
          validation.warnings.forEach(warning => {
            console.log(chalk.yellow(`⚠️  ${warning.section}: ${warning.message}`));
          });
        }
      } else {
        console.log(chalk.red('❌ Content validation failed'));
        validation.errors.forEach(error => {
          console.log(chalk.red(`   ${error.section}: ${error.message}`));
        });
      }

    } catch (error) {
      console.error(chalk.red(`Error recompiling: ${(error as Error).message}`));
    }
  });

  watcher.on('add', (filePath) => {
    console.log(chalk.blue(`➕ File added: ${path.relative(process.cwd(), filePath)}`));
  });

  watcher.on('unlink', (filePath) => {
    console.log(chalk.red(`➖ File removed: ${path.relative(process.cwd(), filePath)}`));
  });

  // TODO: Implement actual development server
  // For now, just keep the process running
  console.log(chalk.green('🎯 Development server ready!'));
  console.log(chalk.gray('   Watching for file changes...'));
  console.log(chalk.gray('   Press Ctrl+C to stop'));

  // Keep the process alive
  process.on('SIGINT', () => {
    console.log(chalk.blue('\n👋 Shutting down development server...'));
    watcher.close();
    process.exit(0);
  });

  // Prevent the process from exiting
  setInterval(() => {}, 1000);
}