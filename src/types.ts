// Configuration interface for md2ppt
export interface MD2PPTConfig {
  // Path to a configuration module (default: './md2ppt.config.js')
  config?: string;

  // Presentation options
  title?: string;
  author?: string;
  slideWidth?: number;   // in inches (default: 10)
  slideHeight?: number;  // in inches (default: 7.5)
  defaultLayout?: SlideLayout;

  // Text styles
  titleFont?: FontProps;
  bodyFont?: FontProps;

  // Background
  backgroundColor?: string;

  // Advanced: pptxgenjs master slide configuration
  master?: MasterConfig;
}

export type SlideLayout = 'title' | 'content' | 'section' | 'blank' | 'twoColumn' | 'imageLeft' | 'imageRight';

export interface MasterConfig {
  // Future: define custom master slides based on theme
}

export interface FontProps {
  name?: string;
  size?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
}

// Default configuration
export const DEFAULT_CONFIG: MD2PPTConfig = {
  slideWidth: 10,
  slideHeight: 7.5,
  defaultLayout: 'content',
  titleFont: { name: 'Arial', size: 44, bold: true, color: '1E3A8A' },
  bodyFont: { name: 'Arial', size: 24, color: '1F2937' },
  backgroundColor: 'FFFFFF'
};

// Frontmatter interface
export interface FrontMatter {
  title?: string;
  author?: string;
  date?: string;
  [key: string]: any;
}

// Slide data structure
export interface Slide {
  title?: string;
  content: string; // HTML string
  layout?: SlideLayout;
  notes?: string;
  images?: SlideImage[]; // extracted images from markdown
}

export interface SlideImage {
  src: string;
  alt?: string;
  width?: number; // inches
  height?: number;
}

// Conversion result
export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}
