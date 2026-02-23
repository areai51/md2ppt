import fm from 'front-matter';
import { marked } from 'marked';
import { FrontMatter, Slide } from './types.js';

export class Converter {
  constructor() {
    marked.setOptions({
      gfm: true,
      breaks: true
    });
  }

  /**
   * Convert markdown to an array of slides.
   * Slides are separated by '---' on a line by itself.
   */
  convert(markdown: string): { slides: Slide[]; frontMatter: FrontMatter } {
    const { attributes, body } = fm(markdown);

    // Split into slides by horizontal rule (---)
    const rawSlides = body.split(/^---$/m).filter(s => s.trim() !== '');

    const slides: Slide[] = rawSlides.map((slideMarkdown, index) => {
      const lines = slideMarkdown.trim().split('\n');

      // If first line is a heading (# or ##), use it as title
      let title: string | undefined;
      let contentStart = 0;

      if (lines[0].startsWith('# ')) {
        title = lines[0].slice(2).trim();
        contentStart = 1;
      } else if (lines[0].startsWith('## ')) {
        title = lines[0].slice(3).trim();
        contentStart = 1;
      } else if (lines[0].startsWith('### ')) {
        title = lines[0].slice(4).trim();
        contentStart = 1;
      }

      const contentLines = lines.slice(contentStart);
      const content = marked(contentLines.join('\n'), { async: false }) as string;

      // Determine layout based on presence of title and content
      let layout: Slide['layout'] = 'content';
      if (index === 0 && !title) {
        layout = 'title'; // First slide without a heading becomes title slide
      } else if (title && !content.trim()) {
        layout = 'section';
      }

      return { title, content, layout };
    });

    // Ensure at least one slide
    if (slides.length === 0) {
      slides.push({ content: '', layout: 'title' });
    }

    return { slides, frontMatter: attributes as FrontMatter };
  }

  async convertFile(filePath: string): Promise<{ slides: Slide[]; frontMatter: FrontMatter }> {
    const { readFileAsync } = await import('./utils.js');
    const content = await readFileAsync(filePath);
    return this.convert(content);
  }
}
