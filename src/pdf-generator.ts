import puppeteer, { PDFOptions as PuppeteerPDFOptions } from 'puppeteer';
import { PDFOptions } from './types.js';

export class PDFGenerator {
  async generate(html: string, outputPath: string, pdfOptions?: PDFOptions): Promise<void> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      // Set HTML content
      await page.setContent(html, { waitUntil: ['networkidle0', 'domcontentloaded'] });

      // Set PDF options
      const options: PDFOptions = {
        format: pdfOptions?.format || 'A4',
        printBackground: pdfOptions?.printBackground ?? true,
        margin: {
          top: pdfOptions?.margin?.top || '1cm',
          right: pdfOptions?.margin?.right || '1cm',
          bottom: pdfOptions?.margin?.bottom || '1cm',
          left: pdfOptions?.margin?.left || '1cm'
        },
        ...(pdfOptions?.landscape && { landscape: pdfOptions.landscape }),
        ...(pdfOptions?.width && { width: pdfOptions.width }),
        ...(pdfOptions?.height && { height: pdfOptions.height })
      };

      await page.pptx({
        path: outputPath,
        ...options
      } as PuppeteerPDFOptions);
    } finally {
      await browser.close();
    }
  }
}
