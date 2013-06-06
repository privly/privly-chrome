/** 
 * @fileOverview This file defines a function which when called loads the
 * needed testing libraries and a testing spec file.  The testing spec file
 * is loaded from a meta tag defined from the HTML page in which the runTests
 * command is run.  Currently this file assumes that the only way to run the
 * tests is when manually executed from the javascript console.
 *
 **/

/**
 * Loads a javascript whose path is passed as an argument.
 */
function loadJs(filename){
  var fileref= document.createElement('script');
  fileref.setAttribute("type","text/javascript");
  fileref.setAttribute("src",filename);
  document.head.appendChild(fileref);
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
  var testLibs = new Array();
  testLibs[0] = chrome.extension.getURL("vendor/jasmine/lib/jasmine-1.3.1/jasmine.js");
  testLibs[1] = chrome.extension.getURL("vendor/jasmine/lib/jasmine-1.3.1/jasmine-html.js");
  testLibs[2] = chrome.extension.getURL("vendor/jasmine/src/jasmine.console_reporter.js");

  for (var i = 0; i < testLibs.length; i++){
    loadJs(testLibs[i]);
  }
  var specToLoad = getMetaValue("PrivlySpec");
  console.log(specToLoad);
  if (specToLoad !== "none"){
    loadJs(specToLoad);
  } else{
    console.log("Failed to load spec");
  }
  return "Running Tests";
}
