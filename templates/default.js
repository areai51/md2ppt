// Default configuration for md2ppt
// You can override any of these options

export default {
  // Presentation metadata
  title: 'Presentation',
  author: '',

  // Slide dimensions (in inches)
  slideWidth: 10,
  slideHeight: 7.5,

  // Default layout for slides without explicit layout
  defaultLayout: 'content', // 'title' | 'content' | 'section' | 'blank'

  // Title slide layout
  titleFont: {
    name: 'Arial',
    size: 44,
    bold: true,
    color: '1E3A8A' // dark blue
  },

  // Content text style
  bodyFont: {
    name: 'Arial',
    size: 24,
    color: '1F2937' // dark gray
  },

  // Background
  backgroundColor: 'FFFFFF',

  // You can also define custom slide layouts via pptxgenjs if needed
};
