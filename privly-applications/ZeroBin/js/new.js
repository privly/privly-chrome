/**
 * @fileOverview Manages the form interaction with remote servers.
 **/

/**
 * Attempt to submit the content to the content server, then fire the URL
 * event for the extension to capture.
 */
function submit() {
   var randomkey = sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0);
   var cipherdata = zeroCipher(randomkey, $("#content")[0].value);
   var cipher_json = JSON.parse(cipherdata);
   
   var data_to_send = {
     post:{
       structured_content: cipher_json
     }};
  
  function successCallback(response) {
    receiveUrl(response, randomkey);
  }
  
  privlyNetworkService.sameOriginPostRequest("/posts", 
                                             successCallback, 
                                             data_to_send,
                                             {"format":"json"});
}

/**
 * Callback defined for handling the return of posting new content
 * 
 * @param response object response from remote server.
 */
function receiveUrl(response, randomkey) {
  
  //Form the URL for people to share it.
  var params = {"privlyLinkKey": randomkey,
    "privlyInjectableApplication": "ZeroBin",
    "privlyCiphertextURL": response.jqXHR.getResponseHeader("X-Privly-Url"),
    "privlyInject1": true
  };
  var url = privlyNetworkService.contentServerDomain() + '#' + 
              privlyParameters.hashToParameterString(params);
  
  privlyExtension.firePrivlyURLEvent(url);
}

/**
 * Sets the listeners on the UI elements of the page.
 */
function listeners() {
  //submitting content
  document.querySelector('#save').addEventListener('click', submit);
}

/**
 *
 */
function initPosting() {
  
  function successCallback() {};
  
  // Assign the CSRF token if it is a Privly server. We use the success
  // callback for all callbacks because we don't assume the content
  // server uses the account details endpoint that the Privly content
  // server hosts.
  privlyNetworkService.initPrivlyService(successCallback, successCallback, 
                                         successCallback);
}

// Listen for UI events
document.addEventListener('DOMContentLoaded', listeners);
document.addEventListener('DOMContentLoaded', initPosting);
