import PptxGenJS from 'pptxgenjs';
import { MD2PPTConfig, Slide } from './types.js';

export class PPTGenerator {
  private config: MD2PPTConfig;

  constructor(config: MD2PPTConfig) {
    this.config = config;
  }

  async generate(slides: Slide[], outputPath: string): Promise<void> {
    const pptx = new PptxGenJS();

    // Set slide size (in inches)
    pptx.slideWidth = this.config.slideWidth || 10;
    pptx.slideHeight = this.config.slideHeight || 7.5;

    // Set global defaults
    pptx.author = this.config.title || 'Unknown';
    pptx.title = this.config.title || 'Presentation';

    if (this.config.titleFont) {
      pptx.title = {
        fontFace: this.config.titleFont.name || 'Arial',
        fontSize: this.config.titleFont.size || 32,
        bold: this.config.titleFont.bold || false,
        color: this.config.hex(this.config.titleFont.color || '000000')
      };
    }

    // Background
    if (this.config.backgroundColor) {
      pptx.background = { color: this.config.hex(this.config.backgroundColor) };
    }

    // Add slides
    for (const slideData of slides) {
      const slide = this.addSlide(pptx, slideData);
    }

    // Save
    await pptx.writeFile({ fileName: outputPath });
  }

  private addSlide(pptx: any, slideData: Slide): any {
    const layout = this.mapLayout(slideData.layout || this.config.defaultLayout || 'content');
    const slide = pptx.addSlide({ layout });

    // Add title if provided
    if (slideData.title) {
      try {
        slide.addText(slideData.title, {
          placeholder: 'title',
          fontSize: this.config.titleFont?.size || 32,
          fontFace: this.config.titleFont?.name || 'Arial',
          bold: this.config.titleFont?.bold !== false,
          color: this.config.hex(this.config.titleFont?.color || '333333'),
          align: 'center'
        });
      } catch (e) {
        // If placeholder doesn't exist, just add at a default position
        slide.addText(slideData.title, {
          x: 0.5,
          y: 0.5,
          w: '90%',
          h: 1,
          fontSize: 32,
          bold: true
        });
      }
    }

    // Add content
    if (slideData.content) {
      try {
        slide.addText(slideData.content, {
          placeholder: 'body',
          fontSize: this.config.bodyFont?.size || 18,
          fontFace: this.config.bodyFont?.name || 'Arial',
          color: this.config.hex(this.config.bodyFont?.color || '444444'),
          valign: 'top'
        });
      } catch (e) {
        // Fallback: add text box
        slide.addText(slideData.content, {
          x: 0.5,
          y: slideData.title ? 1.5 : 0.5,
          w: '90%',
          h: 5,
          fontSize: 18,
          valign: 'top'
        });
      }
    }

    return slide;
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

// Extend PptxGenJS type to include hex helper if missing
declare module 'pptxgenjs' {
  interface PptxGenJS {
    hex(color: string): string;
  }
}
