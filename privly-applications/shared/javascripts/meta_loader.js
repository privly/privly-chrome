/** 
 * @fileOverview This file defines functions for loading testing specs,
 * Javascripts, and CSS files.  The files are specified using a custom meta tag
 *
 * `PrivlySpec` defines testings specs
 *
 * `PrivlyTopCSS` defines CSS files that should be loaded when the application
 * is viewed as the top application on the page.
 *
 * Note on testing: Currently this file assumes that the only way
 * to run the tests is when manually executed from the javascript console.
 *
 **/

/**
 * Loads a javascript file whose path is passed as an argument.
 * @param filename string path to the JS file that should be added to the 
 * HTML.
 */
function loadJs(filename){
  var fileref= document.createElement('script');
  fileref.setAttribute("type", "text/javascript");
  fileref.setAttribute("src", filename);
  if (typeof fileref !== "undefined"){
    document.getElementsByTagName("head")[0].appendChild(fileref);
  }
}

/**
 * Loads a CSS file whose path is passed as an argument.
 *
 * @param filename string path to the CSS file that should be added to the 
 * HTML.
 *
 */
function loadCSS(filename){
  var fileref= document.createElement('link');
  fileref.setAttribute("rel", "stylesheet");
  fileref.setAttribute("type", "text/css");
  fileref.setAttribute("href", filename);
  if (typeof fileref !== "undefined"){
    document.getElementsByTagName("head")[0].appendChild(fileref);
  }
}

/**
 * Returns the content of a meta tag whose name is passed as an argument.
 */
function getMetaValue(metaName){
  var metas = document.getElementsByTagName("meta");
  for (var i = 0; i < metas.length; i++){
    if(metas[i].getAttribute('name') == metaName){
      return metas[i].getAttribute('content');
    }
  }
  return "none";
}

/**
 * Loads test libraries, runs tests defined in spec file.
 */
function runTests(){
  var specToLoad = getMetaValue("PrivlySpec");
  if (specToLoad === "none"){
    return "Failed to load spec";
  }
  var testFiles= new Array();
  testFiles[0] = "../vendor/jasmine/lib/jasmine-1.3.1/jasmine.js";
  testFiles[1] = "../vendor/jasmine/src/jasmine.console_reporter.js";
  testFiles[2] = specToLoad;
  
  // Ensures the testing scripts are loaded in the proper order
  function timedFunction(filename) {
    return function(){
      loadJs(filename);
    }
  }
  
  for (var i = 0; i < testFiles.length; i++){
    setTimeout(timedFunction(testFiles[i]), 100 * i);
  }
  return "Libraries and spec file loaded. Now running tests.";
}

/**
 * Loads CSS files targeted for the top application.
 */
function loadTopCSS(){
  var cssToLoad = getMetaValue("PrivlyTopCSS");
  if (cssToLoad === "none"){
    return "no CSS defined";
  }
  var cssFiles = cssToLoad.split(";");

  for (var i = 0; i < cssFiles.length; i++){
    loadCSS(cssFiles[i]);
  }
  return "Top CSS files loaded.";
}

/**
 * Loads CSS files targeted for an injected application.
 */
function loadInjectedCSS(){
  var cssToLoad = getMetaValue("PrivlyInjectedCSS");
  if (cssToLoad === "none"){
    return "no Injected CSS defined";
  }
  var cssFiles = cssToLoad.split(";");

  for (var i = 0; i < cssFiles.length; i++){
    loadCSS(cssFiles[i]);
  }
  return "Top CSS files loaded.";
}