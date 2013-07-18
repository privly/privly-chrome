/**
 * @fileOverview Manages the form interaction with remote servers.
 **/

 /**
  * The callbacks assign the state of the application.
  *
  * This application can be placed into the following states:
  * 1. Pending Login Check: The app is currently requesting the CSRF
  *    token from the remote server. Callback=pendingLogin
  * 2. Failure to login: The user is not currently authenticated with the
  *    remote server. In this state the user is prompted to login.
  *    Callback=loginFailure
  * 3. Pending post: The user can make the post at this point.
  *    Callback=pendingPost
  * 4. Error creating post: The remote server would not accept the user's
  *    content. The app should display an error message.
  *    Callback=createError
  * 5. Completed post: The remote server has returned a URL. This app should
  *    display it and fire the URL event.
  *    Callback=postCompleted
  */
 var callbacks = {

   /**
    * Assign the CSRF token if it is a Privly server.
    */
   pendingLogin: function() {
     privlyNetworkService.initPrivlyService(true, callbacks.pendingPost, 
                                             callbacks.loginFailure, 
                                             callbacks.loginFailure);
   },

   /**
    * Prompt the user to sign into their server. This assumes the remote
    * server's sign in endpoint is at "/users/sign_in".
    */
   loginFailure: function() {
     var message = "We were unable to sign you into your content server please " + 
                   "<a href='" + privlyNetworkService.contentServerDomain() + "/users/sign_in' target='_blank'>sign in</a> to " +
                   "<a href=''>continue</a>";
     $("#messages").html(message);
   },

   /**
    * Tell the user they can create their post
    */
   pendingPost: function() {
     $("#messages").text("Login successful, you may create a post.");
   },

   /**
    * This is not currently used.
    */
   createError: function() {
     $("#messages").text("There was an error creating your post.");
   },

   /**
    * Send the URL to the extension or mobile device if it exists and display
    * it to the end user.
    */
   postCompleted: function(response) {
     var url = response.jqXHR.getResponseHeader("X-Privly-Url");
     privlyExtension.firePrivlyURLEvent(url);
     $("#messages").text("Copy the address found above to any website you want to share this information through");
     $(".privlyUrl").text(url);
     $(".privlyUrl").attr("href", url);
   }
 }

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
  
  $("#messages").text("Copy the address found above to any website you want to share this information through");
  $(".privlyUrl").text(url);
  $(".privlyUrl").attr("href", url);
}

/**
 * Get the CSRF token and starting content for the form element. 
 */
function initPosting() {
  
  document.querySelector('#save').addEventListener('click', submit);
  
  var domain = privlyNetworkService.contentServerDomain();
  $(".home_domain").attr("href", domain);
  $(".home_domain").text(domain.split("/")[2]);
  
  // Assign the CSRF token if it is a Privly server. We use the success
  // callback for all callbacks because we don't assume the content
  // server uses the account details endpoint that the Privly content
  // server hosts.
  privlyNetworkService.initPrivlyService(true, callbacks.pendingPost, 
                                          callbacks.loginFailure, 
                                          callbacks.loginFailure);
                                         
  // Listener for the extension sending initial content
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
  
  callbacks.pendingLogin();
  
}

document.addEventListener('DOMContentLoaded', initPosting);
