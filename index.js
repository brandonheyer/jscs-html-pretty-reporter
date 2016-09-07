var fs = require('fs'),
  hairballs = require('hairballs'),
  _ = require('lodash'),
  templateUtils = hairballs.templateUtils;

module.exports = function JscsReporter(input) {
  var results;

  this.outputPath = 'jscs-lint-report.html';

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

  this.summarizeData = function(files) {
    _.each(files, _.bind(function eachFile(file) {
      var entry = {
        path: file.filename,
        errors: 0,
        warnings: 0,
        messages: [],
        errorList: []
      },
      alerts = file.errors;

      _.each(alerts, _.bind(function eachAlert(alert) {
        entry = this.summarizeFile(entry, alert);
      }, this));

      hairballs.updateFileSummary(entry);
    }, this));
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

  this.save = function(data) {
    fs.writeFile(this.outputPath, templateUtils.applyTemplates(data), function writeHandler(err) {
      if (err) {
        throw err;
      }
    });
  };

  results = _.map(input, function inputMapper(file) {
    return {
      errors: _.map(file._errorList, function errorMapper(error) {
        return _.pick(error, [
          'filename',
          'rule',
          'line',
          'column',
          'message'
        ]);
      }),
      filename: file._file._filename
    };
  });

  this.save(this.runReport(results));
};
