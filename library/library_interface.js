/**
 * @fileOverview This file manages the message interface with the compiled
 * cryptography library from the JavaScript side. It's counterpart in the
 * C++ world is cryptography_library.cc. All messages sent to or from the 
 * compiled library pass through this script.
 **/

/**
 * Cryptography Module Object. It is initialized by
 * the loaded function.
 *
 * @see loaded()
 **/
var CryptographyLibraryModule = null;

/**
 * @namespace
 *
 * When posting a message to the cryptography library we need a function to
 * execute upon its return. This object defines numerically identified
 * callbacks for the purposes of executing code with library results.
 *
 * callbacks are added by the postLibraryMessage function.
 *
 * Callbacks should be removed from this object by calling the
 * delayedDelete function with the callback's identifier.
 *
 * Todo: run performance tests to determine whether the browser
 * effectively garbage collects these objects. -SBM
 **/
var callbacks = {
  
  /** 
   * This is the currently used unique identifier for function callbacks.
   * Functions are assigned by incrementing this value then assigning to
   * the resulting value.
   */
  usedIdentifier: 0,
  
  /**
   * Default callback if the function callback is not defined
   */
  errorCallback: function(message_json) {
    console.error("There was a problem with a request " + 
                  "to the cryptography library: Unkown callback id");
  },
  
  /**
   * Delete a callback in 5 seconds. We must delay destruction until after the 
   * callback would have completed. In some cases the callback may
   * chain together calls, so a reasonable delay is necessary.
   * 
   *
   * Todo: Read and understand this
   * http://perfectionkills.com/understanding-delete/
   * It is bad practice to leave these functions lying around
   * and I have not extensively tested this apprach. 
   * It will likely run into trouble when we start chaining 
   * library calls.-SBM
   */
  delayedDelete: function(callbackID) {
    setTimeout(function(){
      if (!(delete callbacks[callbackID])) {
        console.warn("was unable to destroy cryptography callback object");
      }
    }, 5000);
    
  }
};

/** 
 * The 'message' event handler.  This handler is fired when the library
 * posts a message to the browser by calling PPB_Messaging.PostMessage()
 * (in C) or pp::Instance.PostMessage() (in C++).
 *
 * @param {event} message_event The message sent by the library. It has the
 * attribute data, that is a JSON formatted string. The JSON formatted string
 * may define "callback" that contains the name of a function in the callback
 * object. If the callback is defined, it will execute it and pass in the JSON
 * object.
 *
 **/
function handleMessage(message_event) {
  
  var message_json = JSON.parse(message_event.data);
  var callback = callbacks[message_json.callback];
  if(typeof(callback) === "function") {
    callback(message_json);
  } else {
    callbacks.errorCallback(message_json);
  }
}

/**
 * Listener for when the page is loaded. It adds a listener to the
 * library's div to capture message events.
 */
function loaded() {
  CryptographyLibraryModule = document.getElementById('cryptography_library');
  var listener = document.getElementById('listener');
  listener.addEventListener('message', handleMessage, true);
}

/**
 * Sends the library a JSON request.
 *
 * @param {json} message a JSON document requesting a cryptographic operation
 * @param {function} callback The function to execute once the library returns
 * the result of the cryptographic operation. The callback will receive the JSON
 * object from the library as its parameter.
 */
function postLibraryMessage(message, callback) {
  
  // Get the callbacks identifier
  var currentIdentifier = ++callbacks.usedIdentifier;
  
  // Name the callback in the message
  message.callback = "callback" + currentIdentifier;
  
  // Create the callback for the resulting message
  callbacks[message.callback] = callback;
  
  // Construct the message to the library
  var jsonString = JSON.stringify(message);
  
  // Message the library
  CryptographyLibraryModule.postMessage(jsonString);
}

// Watch for the page to load
window.addEventListener("load", loaded, true);
