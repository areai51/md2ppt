// md2ppt configuration file
// Copy this to your project root and customize

export default {
  // Path to the Handlebars template
  template: './templates/default.hbs',

  // Path to CSS styles (optional)
  style: './templates/styles.css',

  // PDF generation options (passed to Puppeteer)
  pdfOptions: {
    format: 'A4',
    margin: {
      top: '1cm',
      right: '1cm',
      bottom: '1cm',
      left: '1cm'
    },
    printBackground: true,
    landscape: false
  },

  // Additional Handlebars partials (optional)
  // partials: {
  //   header: './templates/parts/header.hbs',
  //   footer: './templates/parts/footer.hbs'
  // }
};
