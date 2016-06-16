#!/usr/bin/env node
var path = require('path');
var serveFolder = require('serve-folder');
var Nightmare = require('nightmare');
var getPort = require('get-port');
var cheerio = require('cheerio');
var fs = require('fs');
var Q = require('q');
var Promise = Q.Promise;
var SVGO = require('svgo');
var svgo = new SVGO({
  full: true,
  plugins: [{convertPathData: true}]
})

var minifySVG = function ($input, callback) {
  var $svgs = $input('svg[data-prerender-minify]');
  var count = $svgs.length;
  var completed = 0;

  if (count === 0) {
    callback(null, $input);
  }

  $svgs.each(function(i) {
    var svg = $input(this);
    svgo.optimize($input.html(svg), function(result) {
      completed++;
      $input(svg).replaceWith(result.data);
      if (completed === count) {
        callback(null, $input);
      }
    });
  });

};

var cleanHTML = function (originalHTML, outputHTML) {
  var $original = cheerio.load(originalHTML);
  var $output = cheerio.load(outputHTML);

  var originalOptIns = $original('[data-prerender-only]');

  if (originalOptIns.length) {
    var outputOptIns = $output('[data-prerender-only]');
    // If we see at least one 'opt-in' flag, only render the opt in
    originalOptIns.each(function (i) {
      $original(this).html(outputOptIns.eq(i).html());
      return;
    });

    return $original;
  }

  var originalIgnores = $original('[data-prerender-ignore]');
  $output('[data-prerender-ignore]').each(function (i) {
    $output(this).html(originalIgnores.eq(i).html());
    return;
  });

  return $output;
};

module.exports = function (options, callback) {
  if (arguments.length < 2 || !options.inputFile) {
    return callback(new Error('Must provide options dictionary with `inputFile` and a callback function'));
  }

  var inputHtmlPath = path.resolve(options.inputFile);
  var originalHTML = fs.readFileSync(inputHtmlPath).toString();
  if (options.preprocessHTML) {
    fs.writeFileSync(inputHtmlPath, options.preprocessHTML(originalHTML));
  }
  var rootPath;
  var basename;
  if (options.basePath) {
    rootPath = path.resolve(options.basePath);
    basename = path.relative(rootPath, inputHtmlPath);
  } else {
    rootPath = path.dirname(inputHtmlPath);
    basename = path.basename(inputHtmlPath);
  }

  var output;
  var runPrerender = function (port) {
    var server = serveFolder(rootPath, port);
    var nightmare = Nightmare();

    Promise.resolve(nightmare
      .viewport(1920, 1080)
      .on('console', function (type, errorMessage, errorStack) {
        console.log(errorMessage);
      })
      .goto('http://localhost:' + port + '/' + basename)
      .wait(5000)
      .evaluate(function () {
        return document.documentElement.outerHTML;
      })
    ).then(function (htmlOut) {
      if (options.postprocessHTML) {
        htmlOut = options.postprocessHTML(htmlOut);
      }
      return cleanHTML(originalHTML, htmlOut);
    }).then(function ($html) {
      return Q.nfcall(minifySVG, $html);
    }).then(function ($output) {
      output = $output.html();
      server.close();
      return nightmare.end();
    }).then(function () {
      callback(null, output);
    }).catch(function (err) {
      callback(err);
    });
  };


  if (!options.port) {
    getPort()
      .then(function (port) {
        runPrerender(port);
      });
  } else {
    runPrerender(options.port);
  }

};
