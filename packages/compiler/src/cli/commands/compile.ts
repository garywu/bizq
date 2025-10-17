import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { ContentLoader } from '../../core/content-loader';
import { Cache } from '../../cache';
import { adapterRegistry } from '../../adapters';
import { UniversalContent, CompileOptions, CompileResult } from '../../types';

export async function compileCommand(
  source: string,
  target: string,
  options: {
    platform: string;
    designSystem?: string;
    watch?: boolean;
    clean?: boolean;
  }
) {
  const startTime = Date.now();
  const spinner = ora('Initializing compilation...').start();

  try {
    // Initialize components
    const contentLoader = new ContentLoader(source);
    const cache = new Cache();
    await cache.initialize();

    // Load and validate content
    spinner.text = 'Loading content...';
    const content = await contentLoader.loadContent();

    const validation = contentLoader.validateContent(content);
    if (!validation.valid) {
      spinner.fail('Content validation failed');
      validation.errors.forEach(error => {
        console.error(chalk.red(`❌ ${error.section}: ${error.message}`));
      });
      process.exit(1);
    }

    // Check cache for existing compilation
    const cacheKey = `compile-${options.platform}-${content.metadata.checksum}`;
    const cachedResult = await cache.get('compiled-v1', cacheKey);

    if (cachedResult && !options.clean) {
      spinner.succeed('Using cached compilation');
      console.log(chalk.green(`✅ Compiled to ${cachedResult.outputPath}`));
      return;
    }

    // Compile content
    spinner.text = `Compiling for ${options.platform}...`;
    const compileOptions: CompileOptions = {
      platform: options.platform,
      designSystem: options.designSystem,
      output: target,
      watch: options.watch,
      clean: options.clean
    };

    const result = await adapterRegistry.compile(options.platform, content, compileOptions);

    // Cache successful compilation
    if (result.success) {
      await cache.set('compiled-v1', cacheKey, result, 3600); // 1 hour TTL
    }

    const duration = Date.now() - startTime;

    if (result.success) {
      spinner.succeed(`Compiled successfully in ${duration}ms`);
      console.log(chalk.green(`📁 Output: ${result.outputPath}`));
      console.log(chalk.blue(`📄 Files: ${result.files.length}`));

      if (result.warnings.length > 0) {
        console.log(chalk.yellow('⚠️  Warnings:'));
        result.warnings.forEach(warning => {
          console.log(chalk.yellow(`  ${warning}`));
        });
      }
    } else {
      spinner.fail('Compilation failed');
      result.errors.forEach(error => {
        console.error(chalk.red(`❌ ${error}`));
      });
      process.exit(1);
    }

  } catch (error) {
    spinner.fail('Compilation failed');
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

// Compilation logic moved to adapter registry