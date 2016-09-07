var fs = require('fs'),
  hairballs = require('hairballs'),
  _ = require('lodash'),
  templateUtils = hairballs.templateUtils;

module.exports = function JscsReporter(input) {
  var results;

  this.outputPath = (process.env.DEST_PATH || './') + 'jscs-lint-report.html';

  this.errorAttrs = [
    'filename',
    'rule',
    'line',
    'column',
    'message'
  ];

  this.summarizeFile = function(file, alert) {
    var messages = {
      line: alert.line,
      column: alert.column,
      message: alert.message,
      severity: (alert.rule === 'parseError') ? 'error' : 'warning',
      ruleId: alert.rule
    };

    if (alert.rule === 'parseError') {
      file.errors++;
    } else {
      file.warnings++;
    }

    hairballs.updateAlertSummary(messages);
    hairballs.updateOccurance(messages.ruleId, messages.severity, false);
    file.messages.push(messages);

    return file;
  };

  this.eachFile = function(file) {
    var entry = {
      path: file.filename,
      errors: 0,
      warnings: 0,
      messages: [],
      errorList: []
    },
    alerts = file.errors;

    _.each(alerts, _.partial(this.summarizeFile, entry));

    hairballs.updateFileSummary(entry);
  };

  this.summarizeData = function(files) {
    _.each(files, this.eachFile);
  };

  this.runReport = function(input) {
    this.summarizeData(input);

    hairballs.files.sort(hairballs.sortErrors);
    hairballs.errorOccurances.sort(hairballs.sortOccurances);
    hairballs.warningOccurances.sort(hairballs.sortOccurances);

    return {
      fileSummary: hairballs.fileSummary,
      alertSummary: hairballs.alertSummary,
      files: hairballs.files,
      fullReport: true,
      errorOccurances: hairballs.errorOccurances,
      warningOccurances: hairballs.warningOccurances,
      pageTitle: 'JSCS Results'
    };
  };

  this.saveHandler = function(err) {
    if (err) {
      throw err;
    }
  }

  this.save = function(data) {
    fs.writeFile(this.outputPath, templateUtils.applyTemplates(data), this.saveHandler);
  };

  this.mapError = function(error) {
    return _.pick(error, this.errorAttrs);
  };

  this.mapInput = function(file) {
    return {
      errors: _.map(file._errorList, this.mapError),
      filename: file._file._filename
    };
  };

  _.bindAll(this, [
    'summarizeData',
    'summarizeFile',
    'eachFile',
    'mapError',
    'mapInput'
  ]);

  this.save(this.runReport(_.map(input, this.mapInput)));
};
