# md2ppt

A CLI tool that converts Markdown to PowerPoint presentations — fast, template-driven, and easy to use.

## Features

- Convert Markdown to PPTX with a single command
- Slide separation using `---` delimiters
- Automatic title/content detection from headings
- Frontmatter support for presentation metadata
- Customizable configuration (slide size, fonts, colors, layouts)
- Simple CLI, no GUI required
- Built on pptxgenjs for reliable PowerPoint generation

## Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Convert a markdown file
npm start convert examples/demo.md -o slides.pptx

# Or use npx directly
npx md2ppt convert examples/demo.md -o slides.pptx
```

## How It Works

Write your presentation in Markdown:

```markdown
---
title: "My Presentation"
author: "Jane Doe"
---

# Introduction

This is the title slide. Frontmatter title is used if present.

---

# First Content Slide

- Bullet point 1
- Bullet point 2

---

# Section Header

A slide with only a title (section header).

---

# Another Slide

More content here.

## Sub-point

- Nested bullet
```

Slides are separated by `---` on a line by itself.

- A heading (`#`, `##`, `###`) becomes the slide title.
- Remaining text (including other headings) becomes the slide body.

## Configuration

Create an `md2ppt.config.js` in your project to customize the output:

```js
export default {
  title: 'Presentation Title',
  author: 'Your Name',
  slideWidth: 10,      // inches
  slideHeight: 7.5,    // inches
  defaultLayout: 'content', // 'title' | 'content' | 'section' | 'blank'
  titleFont: {
    name: 'Arial',
    size: 44,
    bold: true,
    color: '1E3A8A'
  },
  bodyFont: {
    name: 'Arial',
    size: 24,
    color: '1F2937'
  },
  backgroundColor: 'FFFFFF'
};
```

Use it with the CLI:

```bash
md2ppt convert talk.md -o talk.pptx -c md2ppt.config.js
```

## CLI Options

```
md2ppt convert <input> [options]

Options:
  -o, --output <file>     Output PPTX file path
  -c, --config <file>     Path to configuration module (JS)
```

## Project Structure

```
my-presentation/
├── slides.md
├── md2ppt.config.js
├── node_modules/
└── templates/ (future)
```

## Development

```bash
# Clone the repository
git clone https://github.com/areai51/md2ppt.git
cd md2ppt

# Install dependencies
npm install

# Build
npm run build

# Test with the demo
npm test
```

## Roadmap

- [ ] Dev server with live preview (HTML slide deck)
- [ ] More slide layouts (two column, comparison, image+text)
- [ ] Template system (DSL for slide masters)
- [ ] Image embedding from markdown
- [ ] Export to PDF via HTML conversion
- [ ] Theme presets

## License

MIT
