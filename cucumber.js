module.exports = {
  default: {
    require: ['features/support/**/*.js', 'features/steps/**/*.js'],
    format: ['progress-bar', 'json:reports/cucumber-report.json', 'junit:reports/cucumber-junit.xml'],
    formatOptions: { snippetInterface: 'async-await' },
    publishQuiet: true,
  },
};
