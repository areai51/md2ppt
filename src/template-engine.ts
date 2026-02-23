import Handlebars from 'handlebars';
import { readFileAsync } from './utils.js';
import { MD2PPTConfig } from './types.js';

export class TemplateEngine {
  private template!: HandlebarsTemplateDelegate;
  private partials: Record<string, HandlebarsTemplateDelegate> = {};

  constructor(config: MD2PPTConfig) {
    // Register built-in helpers
    this.registerHelpers();

    // Load partials from config if provided
    if (config.partials) {
      this.loadPartialsFromConfig(config.partials);
    }
  }

  private registerHelpers(): void {
    Handlebars.registerHelper('hasPartial', (name: string) => {
      return !!this.partials[name];
    });
    Handlebars.registerHelper('currentDate', () => {
      return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    });
    Handlebars.registerHelper('slice', (str: string, start: number, end?: number) => {
      if (typeof str !== 'string') return '';
      return str.slice(start, end);
    });
  }

  private async loadPartialsFromConfig(partialsConfig: Record<string, string>): Promise<void> {
    for (const [name, path] of Object.entries(partialsConfig)) {
      try {
        const content = await readFileAsync(path);
        this.partials[name] = Handlebars.compile(content);
      } catch (error) {
        console.warn(`Warning: Could not load partial "${name}" from ${path}: ${error}`);
      }
    }
  }

  async loadTemplate(templatePath: string): Promise<void> {
    const templateContent = await readFileAsync(templatePath);
    this.template = this.compileTemplate(templateContent);
  }

  loadDefaultTemplate(): void {
    const defaultTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 2rem;
      margin-bottom: 1rem;
      line-height: 1.25;
    }
    p { margin-bottom: 1rem; }
    code {
      background: #f4f4f4;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: monospace;
    }
    pre {
      background: #f4f4f4;
      padding: 1rem;
      border-radius: 5px;
      overflow-x: auto;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1rem;
      margin-left: 0;
      color: #666;
    }
    @media print { body { padding: 1cm; } }
  </style>
</head>
<body>
  {{#if (hasPartial "header")}}{{> header}}{{/if}}
  <main>{{{content}}}</main>
  {{#if (hasPartial "footer")}}{{> footer}}{{/if}}
</body>
</html>`;
    this.template = this.compileTemplate(defaultTemplate);
  }

  private compileTemplate(content: string): HandlebarsTemplateDelegate {
    return Handlebars.compile(content, { strict: true });
  }

  registerPartial(name: string, content: string): void {
    this.partials[name] = Handlebars.compile(content);
  }

  render(content: string, frontMatter: Record<string, any>, styles: string): string {
    return this.template({
      content,
      frontMatter,
      styles,
      partials: this.partials,
      ...frontMatter
    });
  }
}
