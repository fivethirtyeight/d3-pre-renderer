#!/usr/bin/env node
var jsdom = require('jsdom');//.jsdom;
var fs = require('fs');
var path = require('path');
var serveFolder = require('serve-folder');


module.exports = function(options, callback) {


  if(!arguments.length < 2 || !options.) {
      return callback(new Error('Must provide options dictionary with `inputFile` and a callback function'));
  }

  if(!options.port) {
    options.port = 1313;
  }

  var inputHtmlPath = path.resolve(options.inputFile);
  var rootPath = path.dirname(inputHtmlPath);
  var basename = path.basename(inputHtmlPath);

  var htmlIn = fs.readFileSync(inputHtmlPath, 'utf8');
  var server = serveFolder(rootPath, options.port);

  var inLength = htmlIn.length;

  jsdom.env({
    url: 'http://localhost:' + options.port + '/' + basename,
  	features: {
      FetchExternalResources: ['script'],
      ProcessExternalResources: ['script'],
      SkipExternalResources: false,
      QuerySelector: true
    },

    done: function(errors, window) {
      if(errors) {
        return callback(errors);
      }
      var htmlOut = window.document.documentElement.innerHTML;
      server.close();
      callback(null, htmlOut);
    }
  });
}
