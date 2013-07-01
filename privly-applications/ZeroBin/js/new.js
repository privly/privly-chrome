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
       structured_content: cipher_json,
        "privly_application":"ZeroBin"
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
  var url = response.jqXHR.getResponseHeader("X-Privly-Url");
  if( url.indexOf("#") > 0 ) {
    url = url.replace("#", "#privlyLinkKey="+randomkey);
  } else {
    url = url + "#privlyLinkKey=" + randomkey;
  }
  privlyExtension.firePrivlyURLEvent(url);
}

/**
 * Sets the listeners on the UI elements of the page.
 */
function listeners() {
  //submitting content
  document.querySelector('#save').addEventListener('click', submit);
  
  initPosting();
}

/**
 * Get the CSRF token and starting content for the form element. 
 */
function initPosting() {
  
  function successCallback() {};
  
  // Assign the CSRF token if it is a Privly server. We use the success
  // callback for all callbacks because we don't assume the content
  // server uses the account details endpoint that the Privly content
  // server hosts.
  privlyNetworkService.initPrivlyService(true, successCallback, successCallback, 
                                         successCallback);
  // Listener for 
  privlyExtension.initialContent = function(data) {
    $("#content")[0].value = data.initialContent;
  }
  
  // Once the message pathway is established, it will immediatly ask for any
  // starting content.
  privlyExtension.messageSecret = function(data) {
    privlyExtension.messageExtension("initialContent", "");
  }
  
  // Initialize message pathway to the extension.
  privlyExtension.firePrivlyMessageSecretEvent();
  
}

document.addEventListener('DOMContentLoaded', listeners);
