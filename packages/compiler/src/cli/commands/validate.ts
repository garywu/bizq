import chalk from 'chalk';
import ora from 'ora';
import { ContentLoader } from '../../core/content-loader';

export async function validateCommand(
  source: string,
  options: {
    strict?: boolean;
    fix?: boolean;
  }
) {
  const spinner = ora('Validating content...').start();

  try {
    const contentLoader = new ContentLoader(source);
    const content = await contentLoader.loadContent();
    const validation = contentLoader.validateContent(content);

    spinner.stop();

    console.log(chalk.blue(`📊 Content Validation Report`));
    console.log(chalk.gray(`   Source: ${source}`));
    console.log(chalk.gray(`   Sections: ${content.metadata.totalSections}`));
    console.log(chalk.gray(`   Last Modified: ${content.metadata.lastModified.toISOString()}`));
    console.log();

    if (validation.valid) {
      console.log(chalk.green('✅ Content is valid'));

      if (validation.warnings.length > 0) {
        console.log(chalk.yellow('⚠️  Warnings:'));
        validation.warnings.forEach(warning => {
          console.log(chalk.yellow(`   ${warning.section}: ${warning.message}`));
        });
      }

      if (options.strict && validation.warnings.length > 0) {
        console.log(chalk.red('❌ Strict mode: failing due to warnings'));
        process.exit(1);
      }

    } else {
      console.log(chalk.red('❌ Content validation failed'));
      validation.errors.forEach(error => {
        console.log(chalk.red(`   ${error.section}: ${error.message}`));
      });
      process.exit(1);
    }

    // Show content summary
    console.log();
    console.log(chalk.blue('📋 Content Sections:'));
    Object.entries(content.sections).forEach(([id, section]) => {
      const status = validation.errors.some(e => e.section === id) ? chalk.red('❌') :
                    validation.warnings.some(w => w.section === id) ? chalk.yellow('⚠️') :
                    chalk.green('✅');
      console.log(`   ${status} ${id}: ${section.content.split('\n')[0].substring(0, 60)}...`);
    });

  } catch (error) {
    spinner.fail('Validation failed');
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}