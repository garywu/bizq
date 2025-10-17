import chalk from 'chalk';
import ora from 'ora';
import { Cache } from '../../cache';

export async function cacheCommand(
  action: string,
  options: {
    bucket?: string;
    force?: boolean;
  }
) {
  const cache = new Cache();
  await cache.initialize();

  switch (action) {
    case 'clean':
      await handleClean(cache, options);
      break;

    case 'stats':
      await handleStats(cache);
      break;

    case 'prune':
      await handlePrune(cache);
      break;

    default:
      console.error(chalk.red(`Unknown cache action: ${action}`));
      process.exit(1);
  }
}

async function handleClean(cache: Cache, options: { bucket?: string; force?: boolean }) {
  if (options.bucket) {
    if (!options.force) {
      console.log(chalk.yellow(`Are you sure you want to clean cache bucket '${options.bucket}'? (y/N)`));
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', async (key) => {
        if (key.toString().toLowerCase() === 'y') {
          await cache.clearBucket(options.bucket!);
          console.log(chalk.green(`✅ Cleared cache bucket: ${options.bucket}`));
        } else {
          console.log(chalk.gray('Operation cancelled'));
        }
        process.exit(0);
      });
    } else {
      await cache.clearBucket(options.bucket);
      console.log(chalk.green(`✅ Cleared cache bucket: ${options.bucket}`));
    }
  } else {
    if (!options.force) {
      console.log(chalk.yellow('Are you sure you want to clean all cache? (y/N)'));
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', async (key) => {
        if (key.toString().toLowerCase() === 'y') {
          await cache.clearAll();
          console.log(chalk.green('✅ Cleared all cache'));
        } else {
          console.log(chalk.gray('Operation cancelled'));
        }
        process.exit(0);
      });
    } else {
      await cache.clearAll();
      console.log(chalk.green('✅ Cleared all cache'));
    }
  }
}

async function handleStats(cache: Cache) {
  const spinner = ora('Calculating cache statistics...').start();

  try {
    const stats = await cache.getStats();

    spinner.stop();

    console.log(chalk.blue('📊 Cache Statistics'));
    console.log();

    let totalEntries = 0;
    let totalSize = 0;

    Object.entries(stats).forEach(([bucket, bucketStats]: [string, any]) => {
      console.log(chalk.cyan(`${bucket}:`));
      console.log(`  Entries: ${bucketStats.entries}`);
      console.log(`  Size: ${formatBytes(bucketStats.size)}`);
      console.log();

      totalEntries += bucketStats.entries;
      totalSize += bucketStats.size;
    });

    console.log(chalk.green('Total:'));
    console.log(`  Entries: ${totalEntries}`);
    console.log(`  Size: ${formatBytes(totalSize)}`);

  } catch (error) {
    spinner.fail('Failed to get cache statistics');
    console.error(chalk.red(`Error: ${(error as Error).message}`));
  }
}

async function handlePrune(cache: Cache) {
  const spinner = ora('Pruning expired cache entries...').start();

  try {
    await cache.cleanup();
    spinner.succeed('Cache pruned successfully');
  } catch (error) {
    spinner.fail('Failed to prune cache');
    console.error(chalk.red(`Error: ${(error as Error).message}`));
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}