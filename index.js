#!/usr/bin/env node
var jsdom = require('jsdom');//.jsdom;
var fs = require('fs');
var path = require('path');
var serveFolder = require('serve-folder');



module.exports = function(options) {

  options = options || {};
  if(!options.inputFile) {
    console.warn('must supply an input file');
    return;
  }

  if(!options.outputFile) {
    options.outputFile = options.inputFile;
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
        console.log(errors);
        return;
      }
      var htmlOut = window.document.documentElement.innerHTML;
      server.close();
      fs.writeFile(options.outputFile, htmlOut, function(err) {
  			if(err) {
  				console.log('error saving document', err)
  			} else {
  				console.log('The file was saved!')
  			}
  		});
    }
  });
}
