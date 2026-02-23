import fm from 'front-matter';
import { marked } from 'marked';
import { readFileAsync } from './utils.js';
import { FrontMatter, Slide, SlideImage } from './types.js';

export class Converter {
  private imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

  constructor() {
    marked.setOptions({
      gfm: true,
      breaks: true
    });
  }

  convert(markdown: string): { slides: Slide[]; frontMatter: FrontMatter } {
    const { attributes, body } = fm(markdown);
    const rawSlides = body.split(/^---$/m).filter(s => s.trim() !== '');

    const slides: Slide[] = rawSlides.map((slideMarkdown, index) => {
      const lines = slideMarkdown.trim().split('\n');

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
      const contentMarkdown = contentLines.join('\n');

      const images = this.extractImages(contentMarkdown);
      const content = marked.parse(contentMarkdown) as string;

      const layout = this.detectLayout(title, contentMarkdown, index);

      return { title, content, layout, images };
    });

    if (slides.length === 0) {
      slides.push({ content: '', layout: 'title' });
    }

    return { slides, frontMatter: attributes as FrontMatter };
  }

  private extractImages(markdown: string): SlideImage[] {
    const images: SlideImage[] = [];
    let match;
    while ((match = this.imageRegex.exec(markdown)) !== null) {
      images.push({
        src: match[2],
        alt: match[1] || ''
      });
    }
    return images;
  }

  private detectLayout(title: string | undefined, contentMarkdown: string, index: number): Slide['layout'] {
    if (index === 0 && !title) return 'title';
    const hasInternalRule = contentMarkdown.split('\n').some(line => line.trim() === '---');
    if (hasInternalRule) return 'twoColumn';
    const plainText = contentMarkdown.replace(/[#*`_\[\]]/g, '').trim();
    if (title && plainText.length < 20) return 'section';
    return 'content';
  }

  async convertFile(filePath: string): Promise<{ slides: Slide[]; frontMatter: FrontMatter }> {
    const content = await readFileAsync(filePath);
    return this.convert(content);
  }
}
