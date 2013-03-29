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
  
  /** 
   * Tests whether the NSS library has been implemented on this platform.
   * NSS has never been compiled for Google's Native Client. Feel free to
   * take up the task before Privly reaches Pygmy:
   * https://github.com/privly/privly-organization/wiki/Version-List
   */
  it("should be able to make requests to NSS", function() {
    console.warn("NSS has not been added to this platform.");
    expect(true).toEqual(true);
  });
  
  /** 
   * Tests whether the libTomCrypt successfully does a "hello world" of 
   * encryption. It passes a string into the cryptography library for
   * encryption, which is then sent back for decryption 
   */
  it("should encrypt and decrypt with libTomCrypt", function() {
    
    // Callback executed on the cleartext. This is the second callback
    // executed in the exchange.
    function decryptedCallback(json) {
      expect(json.cleartext).toEqual("Hello world");
      callbacks.delayedDelete(json.callback);
    }
    
    // Callback executed on the ciphertext. This is the first callback
    // executed in the exchange.
    function encryptedCallback(json) {
      if ( typeof(json.ciphertext) === "string" ) {
        postLibraryMessage(
          json,
          decryptedCallback
        );
        callbacks.delayedDelete(json.callback);
      } else {
        console.error("libTomCryptHelloWorld failed. " + 
                      "Encryption response does not have ciphertext.");
      }
    }
    
    // Send the string for encryption.
    postLibraryMessage(
      {"libraryFunction": "libTomCryptHelloWorldEncrypt", 
       "cleartext": "Hello world"},
      encryptedCallback
    );
  });
  
  /** 
   * Tests whether the compiled library responds with the hello
   * world message.
   */
  it("should complete NaCl hello world", function() {
    postLibraryMessage({"libraryFunction": "helloWorld", "hello": "world"}, 
      function(json) {
        expect(json.cleartext).toEqual("world");
        callbacks.delayedDelete(json.callback);
    });
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

