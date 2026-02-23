#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import { readFileAsync, fileExists, resolvePath, getFileName } from './utils.js';
import { Converter } from './converter.js';
import { PPTGenerator } from './ppt-generator.js';
import { startDevServer } from './dev-server.js';
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
      const config = await loadConfig(options);

      if (!(await fileExists(input))) {
        console.error(`Error: Input file not found: ${input}`);
        process.exit(1);
      }

      const converter = new Converter();
      const { slides, frontMatter } = await converter.convertFile(input);

      if (frontMatter.title && !config.title) config.title = frontMatter.title;
      if (frontMatter.author && !config.author) config.author = frontMatter.author;

      const outputPath = options.output || (await getOutputPath(input));

      const generator = new PPTGenerator(config);
      await generator.generate(slides, outputPath);
      console.log(`✓ PowerPoint generated: ${outputPath}`);

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('dev')
  .description('Start dev server with live HTML preview')
  .argument('<input>', 'Input Markdown file')
  .option('-p, --port <port>', 'Dev server port', '3456')
  .option('-c, --config <file>', 'Configuration file')
  .action(async (input, options) => {
    try {
      if (!(await fileExists(input))) {
        console.error(`Error: Input file not found: ${input}`);
        process.exit(1);
      }
      await startDevServer({
        input,
        port: parseInt(options.port, 10),
        config: options.config
      });
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

program.parse();
