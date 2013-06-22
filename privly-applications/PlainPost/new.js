/**
 * @fileOverview Manages the form interaction with remote servers.
 **/

/**
 * Attempt to submit the content to the content server, then fire the URL
 * event for the extension to capture.
 */
function submit() {
  
  function successCallback() {
    privlyNetworkService.sameOriginPostRequest("/posts", 
                                          receiveUrl, 
                                          {"post":
                                          {"content":$("#content")[0].value},
                                          "format":"json"});
  }
  
  
  // Assign the CSRF token if it is a Privly server. We use the success
  // callback for all callbacks because we don't assume the content
  // server uses the account details endpoint that the Privly content
  // server hosts.
  privlyNetworkService.initPrivlyService(successCallback, successCallback, 
                                         successCallback);
  

}

/**
 * Callback defined for handling the return of posting new content
 * 
 * @param json json response from remote server.
 */
function receiveUrl(response) {
  privlyExtension.firePrivlyURLEvent(response.json["X-Privly-Url"]);
}

/**
 * Sets the listeners on the UI elements of the page.
 */
function listeners() {
  //submitting content
  document.querySelector('#save').addEventListener('click', submit);
}

// Listen for UI events
document.addEventListener('DOMContentLoaded', listeners);
