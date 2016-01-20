#!/usr/bin/env node
var path = require('path');
var serveFolder = require('serve-folder');
var Nightmare = require('nightmare');
var getPort = require('get-port');
var cheerio = require('cheerio');
var fs = require('fs');

var cleanHTML = function (originalHTML, outputHTML) {
  var $original = cheerio.load(originalHTML);
  var $output = cheerio.load(outputHTML);

  var originalIgnores = $original('[data-prerender-ignore]');
  $output('[data-prerender-ignore]').each(function (i) {
    $output(this).html(originalIgnores.eq(i).html());
    return;
  });

  return $output.html();
};

module.exports = function (options, callback) {
  if (arguments.length < 2 || !options.inputFile) {
    return callback(new Error('Must provide options dictionary with `inputFile` and a callback function'));
  }

  var inputHtmlPath = path.resolve(options.inputFile);
  var originalHTML = fs.readFileSync(inputHtmlPath).toString();

  var rootPath;
  var basename;
  if (options.basePath) {
    rootPath = path.resolve(options.basePath);
    basename = path.relative(rootPath, inputHtmlPath);
  } else {
    rootPath = path.dirname(inputHtmlPath);
    basename = path.basename(inputHtmlPath);
  }

  if (!options.port) {
    getPort()
      .then(function (port) {
        options.port = port;
        runPrerender();
      });
  } else {
    runPrerender();
  }

  var runPrerender = function () {
    var server = serveFolder(rootPath, options.port);
    var nightmare = Nightmare();

    nightmare
      // .on('console', function (type, errorMessage, errorStack) {
      //   console.log(errorMessage);
      // })
      .goto('http://localhost:' + options.port + '/' + basename)
      .wait(5000)
      .evaluate(function () {
        return document.documentElement.outerHTML;
      })
      .then(function (htmlOut) {
        htmlOut = cleanHTML(originalHTML, htmlOut);

        callback(null, htmlOut);
        server.close();
        return nightmare.end();
      });
  };
};
