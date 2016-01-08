/* global it */
'use strict';

var expect = require('expect.js');
var render = require('..');
var fs = require('fs');
var path = require('path');

it('should prerender the SVGs', function (done) {
  render({inputFile: __dirname + '/data/input.html'}, function (err, output) {
    expect(err).to.be(null);
    var expected = fs.readFileSync(path.resolve(__dirname + '/data/expected.html')).toString();
    expect(output).to.be(expected);
    done();
  });
});
