#!/usr/bin/env node
var path = require('path');
var serveFolder = require('serve-folder');
var Nightmare = require('nightmare');

module.exports = function (options, callback) {
  if (arguments.length < 2 || !options.inputFile) {
    return callback(new Error('Must provide options dictionary with `inputFile` and a callback function'));
  }

  if (!options.port) {
    options.port = 1313;
  }

  var inputHtmlPath = path.resolve(options.inputFile);
  var rootPath = path.dirname(inputHtmlPath);
  var basename = path.basename(inputHtmlPath);

  var server = serveFolder(rootPath, options.port);

  var nightmare = Nightmare();

  nightmare
    .goto('http://localhost:' + options.port + '/' + basename)
    .evaluate(function () {
      return document.documentElement.outerHTML;
    })
    .then(function (htmlOut) {
      callback(null, htmlOut);
      return nightmare.end();
    })
    .then(function (results) {
      server.close();
    });
};
