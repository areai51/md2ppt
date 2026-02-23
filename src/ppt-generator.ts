import PptxGenJS from 'pptxgenjs';
import { MD2PPTConfig, Slide } from './types.js';

function normalizeColor(color?: string): string {
  if (!color) return '000000';
  // Remove leading # if present
  return color.replace(/^#/, '');
}

export class PPTGenerator {
  private config: MD2PPTConfig;

  constructor(config: MD2PPTConfig) {
    this.config = config;
  }

  async generate(slides: Slide[], outputPath: string): Promise<void> {
    const pptx = new PptxGenJS() as any;

    // Set slide size (in inches)
    if (this.config.slideWidth) pptx.slideWidth = this.config.slideWidth;
    if (this.config.slideHeight) pptx.slideHeight = this.config.slideHeight;

    // Set document properties
    if (this.config.title) pptx.title = this.config.title;
    if (this.config.author) pptx.author = this.config.author;

    // Background
    if (this.config.backgroundColor) {
      pptx.background = { color: normalizeColor(this.config.backgroundColor) };
    }

    // Add slides
    for (const slideData of slides) {
      this.addSlide(pptx, slideData);
    }

    // Save
    await pptx.writeFile({ fileName: outputPath });
  }

  private addSlide(pptx: any, slideData: Slide): void {
    const layoutName = this.mapLayout(slideData.layout || this.config.defaultLayout || 'content');
    const slide = pptx.addSlide({ layout: layoutName });

    const titleFont = this.config.titleFont || {};
    const bodyFont = this.config.bodyFont || {};

    // Add title if provided
    if (slideData.title) {
      try {
        slide.addText(slideData.title, {
          placeholder: 'title',
          fontSize: titleFont.size || 32,
          fontFace: titleFont.name || 'Arial',
          bold: titleFont.bold !== false,
          color: normalizeColor(titleFont.color || '333333'),
          align: 'center'
        });
      } catch (e) {
        // Fallback if placeholder not available
        slide.addText(slideData.title, {
          x: 0.5,
          y: 0.5,
          w: '90%',
          h: 1,
          fontSize: titleFont.size || 32,
          fontFace: titleFont.name || 'Arial',
          bold: titleFont.bold !== false,
          color: normalizeColor(titleFont.color || '333333')
        });
      }
    }

    // Add content
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
        // Fallback
        slide.addText(slideData.content, {
          x: 0.5,
          y: slideData.title ? 1.5 : 0.5,
          w: '90%',
          h: 5,
          fontSize: bodyFont.size || 18,
          fontFace: bodyFont.name || 'Arial',
          color: normalizeColor(bodyFont.color || '444444'),
          valign: 'top'
        });
      }
    }
  }

  private mapLayout(layout: string): string {
    switch (layout) {
      case 'title': return 'TITLE';
      case 'content': return 'TITLE_AND_CONTENT';
      case 'section': return 'SECTION_HEADER';
      case 'blank': return 'BLANK';
      default: return 'TITLE_AND_CONTENT';
    }
  }
}
