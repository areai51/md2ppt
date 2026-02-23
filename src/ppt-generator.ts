import PptxGenJS from 'pptxgenjs';
import { MD2PPTConfig, Slide, SlideLayout } from './types.js';

function normalizeColor(color?: string): string {
  if (!color) return '000000';
  return color.replace(/^#/, '');
}

export class PPTGenerator {
  private config: MD2PPTConfig;

  constructor(config: MD2PPTConfig) {
    this.config = config;
  }

  async generate(slides: Slide[], outputPath: string): Promise<void> {
    const pptx = new PptxGenJS() as any;

    // Slide size
    if (this.config.slideWidth) pptx.slideWidth = this.config.slideWidth;
    if (this.config.slideHeight) pptx.slideHeight = this.config.slideHeight;

    // Document properties
    if (this.config.title) pptx.title = this.config.title;
    if (this.config.author) pptx.author = this.config.author;

    if (this.config.backgroundColor) {
      pptx.background = { color: normalizeColor(this.config.backgroundColor) };
    }

    for (const slideData of slides) {
      this.addSlide(pptx, slideData);
    }

    await pptx.writeFile({ fileName: outputPath });
  }

  private addSlide(pptx: any, slideData: Slide): void {
    const layout = this.mapLayout(slideData.layout || this.config.defaultLayout || 'content');
    const slide = pptx.addSlide({ layout: layout });

    const titleFont = this.config.titleFont || {};
    const bodyFont = this.config.bodyFont || {};

    // Title
    if (slideData.title) {
      this.addTitle(slide, slideData.title, titleFont);
    }

    // Content based on layout
    switch (slideData.layout) {
      case 'title':
        break;
      case 'twoColumn':
        this.addTwoColumnContent(slide, slideData.content, bodyFont);
        break;
      case 'imageLeft':
      case 'imageRight':
        this.addImageTextLayout(slide, slideData, bodyFont);
        break;
      default:
        // content, section, blank
        if (slideData.content) {
          try {
            slide.addText(slideData.content, {
              placeholder: 'body',
              fontSize: bodyFont.size || 18,
              fontFace: bodyFont.name || 'Arial',
              color: normalizeColor(bodyFont.color || '444444'),
              valign: 'top'
            });
          } catch (e) {
            slide.addText(this.stripHtml(slideData.content), {
              x: 0.5,
              y: slideData.title ? 1.5 : 0.5,
              w: pptx.slideWidth - 1,
              h: pptx.slideHeight - (slideData.title ? 2 : 1),
              fontSize: bodyFont.size || 18,
              fontFace: bodyFont.name || 'Arial',
              color: normalizeColor(bodyFont.color || '444444'),
              valign: 'top'
            });
          }
        }
    }
  }

  private addTitle(slide: any, title: string, titleFont: any): void {
    try {
      slide.addText(title, {
        placeholder: 'title',
        fontSize: titleFont.size || 32,
        fontFace: titleFont.name || 'Arial',
        bold: titleFont.bold !== false,
        color: normalizeColor(titleFont.color || '333333'),
        align: 'center'
      });
    } catch (e) {
      slide.addText(title, {
        x: 0.5,
        y: 0.5,
        w: this.config.slideWidth! - 1,
        h: 1,
        fontSize: titleFont.size || 32,
        fontFace: titleFont.name || 'Arial',
        bold: titleFont.bold !== false,
        color: normalizeColor(titleFont.color || '333333')
      });
    }
  }

  private addTwoColumnContent(slide: any, content: string, bodyFont: any): void {
    // Split by <hr> (from marked)
    const parts = content.split(/<hr\s*\/?>/i).map(p => this.stripHtml(p).trim()).filter(p => p);
    if (parts.length < 2) parts.push(this.stripHtml(content).trim());

    const slideW = this.config.slideWidth!;
    const slideH = this.config.slideHeight!;
    const x1 = 0.5;
    const x2 = slideW / 2 + 0.25;
    const colW = slideW / 2 - 0.75;
    const yStart = 1.5;
    const availH = slideH - yStart - 0.5;

    // Left column
    try {
      slide.addText(parts[0], {
        x: x1,
        y: yStart,
        w: colW,
        h: availH,
        fontSize: bodyFont.size || 18,
        fontFace: bodyFont.name || 'Arial',
        color: normalizeColor(bodyFont.color || '444444'),
        valign: 'top'
      });
    } catch (e) {}

    // Right column
    if (parts[1]) {
      try {
        slide.addText(parts[1], {
          x: x2,
          y: yStart,
          w: colW,
          h: availH,
          fontSize: bodyFont.size || 18,
          fontFace: bodyFont.name || 'Arial',
          color: normalizeColor(bodyFont.color || '444444'),
          valign: 'top'
        });
      } catch (e) {}
    }
  }

  private addImageTextLayout(slide: any, slideData: Slide, bodyFont: any): void {
    const slideW = this.config.slideWidth!;
    const slideH = this.config.slideHeight!;
    const isImageLeft = slideData.layout === 'imageLeft';
    const imgW = 4; const imgH = 4;
    const textX = isImageLeft ? 5 : 0.5;
    const imgX = isImageLeft ? 0.5 : slideW - 4.5;

    // Text
    try {
      slide.addText(this.stripHtml(slideData.content), {
        x: textX,
        y: 1.5,
        w: isImageLeft ? slideW - 6 : 4,
        h: 5,
        fontSize: bodyFont.size || 18,
        fontFace: bodyFont.name || 'Arial',
        color: normalizeColor(bodyFont.color || '444444'),
        valign: 'top'
      });
    } catch (e) {
      try {
        slide.addText(this.stripHtml(slideData.content), { placeholder: 'body' });
      } catch (e2) {}
    }
  }

  private mapLayout(layout: string): string {
    switch (layout) {
      case 'title': return 'TITLE';
      case 'content': return 'TITLE_AND_CONTENT';
      case 'section': return 'SECTION_HEADER';
      case 'blank': return 'BLANK';
      case 'twoColumn': return 'TITLE_AND_CONTENT';
      case 'imageLeft':
      case 'imageRight': return 'TITLE_AND_CONTENT';
      default: return 'TITLE_AND_CONTENT';
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }
}
