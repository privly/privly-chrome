/* function run_tests should:
    load testing library files
    read meta tags on the page
    load spec defined in meta tag
    run tests -> send output to console
*/

function loadjs(filename){
  var fileref= document.createElement('script');
  fileref.setAttribute("type","text/javascript");
  fileref.setAttribute("src",filename);
}

function getMetaValue(meta_name){
  var metas = document.getElementsByTagName("meta");
  for (var i = 0; i < matas.length; i++){
    if(metas[i].getAttribute('name') == meta_name){
      return metas[i].getAttribute('content');
    }
  }
  return "none";
}

var testlibs = new Array();
testlibs[0] = "vendor/jasmine/lib/jasmine-1.3.1/jasmine.js";
testlibs[1] = "vendor/jasmine/lib/jasmine-1.3.1/jasmine-html.js";
testlibs[2] = "vendor/jasmine/src/jasmine.console_reporter.js";

for (var i = 0; i < testlibs.length; i++){
  loadjs(testlibs[i]);
}
var path = window.location.pathname;
var current_html = path.substring(path.lastIndexOf('/'+1));
var spec_to_load = getMetaValue(current_html);

if (spec_to_load !== "none"){
  loadjs(spec_to_load);
}
else{
  console.log("Failed to load spec");
}
