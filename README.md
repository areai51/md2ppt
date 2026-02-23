# MD2PPT

A CLI tool that converts Markdown to PDF using customizable templates — think Astro, but for PDFs.

## Features

- Convert Markdown to PDF with a single command
- Customizable templates with layout, styling, and components
- Supports multiple output formats (letter, a4, etc.)
- Template inheritance and partials
- Frontmatter support for metadata
- Built-in template engine (Handlebars-like syntax)
- CLI flags for quick customization
- Watch mode for development

## Quick Start

```bash
# Install globally (once published)
npm install -g md2ppt

# Or use npx
npx md2ppt convert input.md -o output.pptx

# With a custom template
md2ppt convert input.md --template my-template.hbs -o output.pptx

# Dev mode with live preview
md2ppt dev input.md
```

## Agent Skill

Install the md2ppt skill for Claude Code, Amp, OpenCode etc:

```bash
npx skills add areai51/md2ppt
```

This adds the skill to your Claude Code environment, enabling intelligent PDF generation with automatic template selection and markdown formatting.

## Dev Mode

Start a live preview server to see your markdown rendered in different templates:

```bash
md2ppt dev input.md --port 3456
```

Opens a browser with:
- **Left pane**: Template selector (switch between templates)
- **Right pane**: Live preview of your markdown

Changes to your `.md` file or templates auto-reload the preview.

### Built-in Templates

- `default` - Clean, professional look
- `modern` - Bold colors, Inter-style typography
- `minimal` - Simple, classic serif
- `newsletter` - Email newsletter style
- `resume` - CV/resume formatting

## Project Structure

```
my-doc/
├── content/
│   └── my-doc.md
├── templates/
│   ├── default.hbs
│   ├── parts/
│   │   └── header.hbs
│   └── styles.css
├── md2ppt.config.js
└── package.json
```

## Templates

Templates use handlebars-like syntax for placeholders and partials:

```handlebars
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>{{{styles}}}</style>
</head>
<body>
  {{> header}}
  <main>
    {{{content}}}
  </main>
</body>
</html>
```

## Configuration

`md2ppt.config.js`:

```js
export default {
  template: './templates/default.hbs',
  style: './templates/styles.css',
  pdfOptions: {
    format: 'A4',
    margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
  }
}
```

## Development

```bash
# Clone and setup
git clone https://github.com/areai51/md2pdf.git
cd md2pdf
npm install

# Build
npm run build

# Test
npm test

# Link for global use
npm link
```

## License

MIT
