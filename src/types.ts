// Configuration interface for md2ppt
export interface MD2PPTConfig {
  // Path to a configuration module (default: './md2ppt.config.js')
  config?: string;

  // Presentation options (overrides from config file)
  title?: string;
  author?: string;
  slideWidth?: number;   // in inches (default: 10)
  slideHeight?: number;  // in inches (default: 7.5)
  slideLayout?: SlideLayoutOptions;

  // Default text styles
  titleFont?: FontProps;
  bodyFont?: FontProps;

  // Background
  backgroundColor?: string;
  backgroundImage?: string;

  // Slide defaults
  defaultLayout?: 'title' | 'content' | 'section' | 'blank';
}

export interface SlideLayoutOptions {
  titleSlide?: boolean;   // Use title slide layout for first slide?
  titleAndContent?: boolean;
  sectionHeader?: boolean;
  twoColumn?: boolean;
  // etc.
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
  titleFont: { name: 'Arial', size: 32, bold: true, color: '333333' },
  bodyFont: { name: 'Arial', size: 18, color: '444444' },
  backgroundColor: 'FFFFFF',
  defaultLayout: 'content'
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
  content: string; // HTML or plain text
  layout?: 'title' | 'content' | 'section' | 'blank';
  notes?: string;
}

// Conversion result
export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}
