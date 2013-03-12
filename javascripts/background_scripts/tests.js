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
   * Tests whether the compiled library responds with the hello
   * world message.
   */
  naclHelloWorld: function() {
    postLibraryMessage({"libraryFunction": "helloWorld", "hello": "world"}, 
      function(json) {
        if ( json.hello === "world" ) {
          console.log("naclHelloWorld passed");
          callbacks.delayedDelete(json.callback);
        } else {
          console.error("naclHelloWorld failed");
        }
    });
  },
  
  /** 
   * Tests whether the libTomCrypt successfully does a "hello world" of 
   * encryption. It passes a string into the cryptography library for
   * encryption, which is then sent back for decryption 
   */
  libTomCryptHelloWorld: function() {
    
    // Callback executed on the cleartext. This is the second callback
    // executed in the exchange.
    function decryptedCallback(json) {
      if( json.cleartext !== "Hello world") {
        console.error("libTomCryptHelloWorld failed, the decrypted ciphertext " + 
                      "did not equal the original cleartext");
      } else {
        console.log("libTomCryptHelloWorld passed");
        callbacks.delayedDelete(json.callback);
      }
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
  },
  
  /** 
   * Tests whether the NSS library has been implemented on this platform.
   * NSS has never been compiled for Google's Native Client. Feel free to
   * take up the task before Privly reaches Pygmy:
   * https://github.com/privly/privly-organization/wiki/Version-List
   */
  nssHelloWorld: function() {
    console.warn("NSS has not been added to this platform.");
  },
  
  /**
   * Run all tests.
   */
  runAll: function() {
    tests.modalButtonCallback();
    tests.naclHelloWorld();
    tests.libTomCryptHelloWorld();
    tests.nssHelloWorld();
  },
  
  /**
   * Listener waits for the cryptography library to load before
   * executing all the test cases.
   */
  onLoad: function() {
    var listener = document.getElementById('listener');
    listener.addEventListener('load', tests.runAll, true);
  }
}

window.addEventListener("load", tests.onLoad, true);
