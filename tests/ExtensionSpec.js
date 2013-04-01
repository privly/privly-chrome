/**
 * @fileOverview tests.js Gives testing code for the Chrome Extension.
 * It is currently being used to develope new functionality, but test
 * cases will be added for complete code coverage. It recently changed 
 * to the Jasmine JS testing library, but full integration is not complete.
 * Notably, the testing style is not following Jasmine's conventions on
 * "wait."
 **/
 
describe("Extension", function() {

  beforeEach(function() {
    //pass
  });
  
  /** 
   * Tests modal button functionality. This is a naively implemented
   * test case. Future versions should more gracefully handle Chrome's
   * callbacks. This example indicates that every function may need to 
   * support a callback parameter in order to support asynchronous testing.
   */
  it("should change the modal button", function() {
    
    //Get all the windows so we can get a tab
    chrome.windows.getAll({"populate" : true},
      function(windows){
        
        // Get a valid Tab
        var tab = null;
        for (var i = 0; i < windows.length; i++) {
          if(windows[i].tabs.length > 0) {
            tab = windows[i].tabs[0];
          }
        }
        
        // Get the current setting of the badge text
        // so we can flip it.
        chrome.browserAction.getBadgeText({},
          function(currentText) {
            
            // We define a callback for the function we are testing so we can
            // check the results without needing to use setTimeout
            function testingCallback() {
              if (currentText === "off") {
                chrome.browserAction.getBadgeText({},
                  function(currentText) {
                    expect(currentText).toEqual("on");
                  }
                );
              } else if(currentText === "on") {
                chrome.browserAction.getBadgeText({},
                  function(currentText) {
                    expect(currentText).toEqual("off");
                  }
                );
              } else {
                expect("false").toEqual("true");
              }
              
              // Attempt to toggle the modal button back to its prior state
              modalButtonCallback(tab);
            }
            
            // Now that we have setup the test, it is time to check the
            modalButtonCallback(tab, testingCallback);
            
          }
        );
      }
    );
  });
  
});



(function() {
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 1000;
  
  var htmlReporter = new jasmine.HtmlReporter();
  
  jasmineEnv.addReporter(htmlReporter);
  
  jasmineEnv.specFilter = function(spec) {
    return htmlReporter.specFilter(spec);
  };
  
  var currentWindowOnload = window.onload;
  
  window.onload = function() {
    if (currentWindowOnload) {
      currentWindowOnload();
    }
    execJasmine();
  };
  
  function execJasmine() {
    jasmineEnv.execute();
  }
  
})();

