#!/usr/bin/env node

import { Command } from 'commander';
import { readFileAsync, writeFileAsync, fileExists, resolvePath, getFileName } from './utils.js';
import { Converter } from './converter.js';
import { PPTGenerator } from './ppt-generator.js';
import { MD2PPTConfig, DEFAULT_CONFIG } from './types.js';

const program = new Command();

program
  .name('md2ppt')
  .description('Convert Markdown to PowerPoint presentations using templates')
  .version('0.1.0');

program
  .command('convert')
  .description('Convert a Markdown file to PowerPoint')
  .argument('<input>', 'Input Markdown file')
  .option('-o, --output <file>', 'Output PPTX file')
  .option('-c, --config <file>', 'Configuration file (md2ppt.config.js)')
  .action(async (input, options) => {
    try {
      // Load configuration
      const config = await loadConfig(options);

      // Validate input file
      if (!(await fileExists(input))) {
        console.error(`Error: Input file not found: ${input}`);
        process.exit(1);
      }

      // Read and convert markdown to slides
      const converter = new Converter();
      const { slides, frontMatter } = await converter.convertFile(input);

      // Apply frontmatter defaults to config
      if (frontMatter.title && !config.title) config.title = frontMatter.title;
      if (frontMatter.author && !config.author) config.author = frontMatter.author;

      // Determine output path
      const outputPath = options.output || (await getOutputPath(input));

      // Generate PowerPoint
      const generator = new PPTGenerator(config);
      await generator.generate(slides, outputPath);
      console.log(`✓ PowerPoint generated: ${outputPath}`);

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

async function loadConfig(options: any): Promise<MD2PPTConfig> {
  const config: MD2PPTConfig = { ...DEFAULT_CONFIG };

  if (options.config && await fileExists(options.config)) {
    const configModule = await import(resolvePath(process.cwd(), options.config));
    const userConfig = configModule.default || configModule;
    Object.assign(config, userConfig);
  }

  return config;
}

function getOutputPath(inputPath: string): string {
  const baseName = getFileName(inputPath);
  return `${baseName}.pptx`;
}

// Dev server could be added later if needed
// For now, only convert command

program.parse();
