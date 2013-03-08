/**
 * @fileOverview tests.js Gives testing code for the Chrome Extension.
 * It is currently being used to develope new functionality, but test
 * cases will be added for complete code coverage. The options.html page will
 * have a function on it to report the testing results so users can give bug
 * reports. This file is particularly important for checking integration
 * with the compiled cryptography library.
 **/
 
/**
 * @namespace
 * Testing code
 */
var tests = {
  
  /** 
   * Tests modal button functionality. This is a naively implemented
   * test case. Future versions should more gracefully handle Chrome's
   * callbacks. This example indicates that every function may need to 
   * support a callback parameter in order to support asynchronous testing.
   */
  modalButtonCallback: function() {
    
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
                    if (currentText === "off") {
                      console.error("Modal button failed to change.");
                    } else if(currentText === "on") {
                      console.log("Modal Button Test Passed.");
                    } else {
                      console.error("Unknown modal button state.");
                    }
                  }
                );
              } else if(currentText === "on") {
                chrome.browserAction.getBadgeText({},
                  function(currentText) {
                    if (currentText === "off") {
                      console.log("Modal Button Test Passed.");
                    } else if(currentText === "on") {
                      console.error("Modal button failed to change.");
                    } else {
                      console.error("Unknown modal button state.");
                    }
                  }
                );
              } else {
                console.error("Unknown modal button state.");
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
  },
  
  /**
   * Run all tests 
   */
  runAll: function() {
    tests.modalButtonCallback();
  }
}
