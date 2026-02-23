---
title: "Introduction to md2ppt"
author: "Vinci Rufus"
date: "2026-02-23"
---

# Welcome to md2ppt

A CLI tool that converts Markdown to PowerPoint presentations using templates.

## Features

- Simple slide syntax using `---` separators
- Customizable layout per slide
- Frontmatter support for metadata
- Configurable text styles, colors, and slide dimensions
- Easy to use CLI

## How to Use

```bash
# Install dependencies
npm install

# Build
npm run build

# Convert a markdown file
npm start convert examples/demo.md -o output.pptx
```

## Slide Layouts

### Title Slide

First slide automatically becomes title slide if it has no heading.

### Content Slides

Use headings for slide titles.

### Section Headers

Slides with title but no content become section headers.

---

# Thank You!

Questions?
