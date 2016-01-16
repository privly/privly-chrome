/**
 * @fileOverview This file defines a function which loads the
 * needed testing libraries and a testing spec file.  The testing spec file
 * is loaded from the PrivlySpec meta tag defined from the HTML page in which
 * the runTests command is run.  Currently this file assumes that the only way
 * to run the tests is when manually executed from the javascript console.
 *
 **/
/**
 * Loads a javascript file whose path is passed as an argument.
 */
'use strict';

var i = 0;

function loadJs(filename) {
  var fileref = document.createElement('script');
  fileref.setAttribute("type", "text/javascript");
  fileref.setAttribute("src", filename);
  //fileref.onload = callback(filename);
  if (typeof fileref !== "undefined") {
    document.getElementsByTagName("head")[0].appendChild(fileref);
  }
}

/**
 * Returns the content of a meta tag whose name is passed as an argument.
 */
function getMetaValue(metaName) {
  var metas = document.getElementsByTagName("meta");
  for (i = 0; i < metas.length; i += 1) {
    if (metas[i].getAttribute('name') === metaName) {
      return metas[i].getAttribute('content');
    }
  }
  return "none";
}

/**
 * Loads test libraries, runs tests defined in spec file.
 */
function runTests() {
  var specToLoad, testFiles;
  specToLoad = getMetaValue("PrivlySpec");
  if (specToLoad === "none") {
    return "Failed to load spec";
  }
  testFiles = [];
  testFiles[0] = "/vendor/jasmine/lib/jasmine-1.3.1/jasmine.js";
  testFiles[1] = "/vendor/jasmine/src/jasmine.console_reporter.js";
  testFiles[2] = specToLoad;

  // Ensures the testing scripts are loaded in the proper order
  function timedFunction(filename) {
    return function () {
      loadJs(filename);
    };
  }

  for (i = 0; i < testFiles.length; i += 1) {
    setTimeout(timedFunction(testFiles[i]), 100 * i);
  }
  return "Libraries and spec file loaded. Now running tests.";
}