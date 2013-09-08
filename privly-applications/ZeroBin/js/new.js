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
  * 4. submit: the user has submitted the posting form.
  *    Callback=submit
  * 5. Completed post: The remote server has returned a URL. This app should
  *    display it and fire the URL event.
  *    Callback=postCompleted
  */
 var callbacks = {

   /**
    * Assign the CSRF token if it is a Privly server.
    */
   pendingLogin: function() {
     
     // Set the nav bar to the proper domain
     privlyNetworkService.initializeNavigation();
     
   },

   /**
    * Prompt the user to sign into their server. This assumes the remote
    * server's sign in endpoint is at "/users/sign_in".
    */
   loginFailure: function() {
     var message = "You are not currently signed into your content server. " + 
       "Please login then refresh the page.";
     $("#messages").text(message);
   },

   /**
    * Tell the user they can create their post
    */
   pendingPost: function() {
     
     privlyNetworkService.showLoggedInNav();
     
     // Monitor the submit button
     document.querySelector('#save').addEventListener('click', callbacks.submit);
     $("#save").prop('disabled', false);
     $("#messages").text("Login successful, you may create a post.");
   },

   /**
    * The user hit the submit button.
    */
   submit: function() {
      var randomkey = sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0);
      var cipherdata = zeroCipher(randomkey, $("#content")[0].value);
      var cipher_json = JSON.parse(cipherdata);

      var data_to_send = {
        post:{
          structured_content: cipher_json,
           "privly_application":"ZeroBin",
           "public":true
        }};

     function successCallback(response) {
       callbacks.postCompleted(response, randomkey);
     }
     
     privlyNetworkService.sameOriginPostRequest(
       privlyNetworkService.contentServerDomain() + "/posts", 
       successCallback, 
       data_to_send,
       {"format":"json"});
   },

   /**
    * Send the URL to the extension or mobile device if it exists and display
    * it to the end user.
    *
    * @param {response} response The response object returned from the remote server
    * @param {string} randomkey The key used to encrypt the data.
    *
    */
   postCompleted: function(response, randomkey) {
     var url = response.jqXHR.getResponseHeader("X-Privly-Url");
     if( url.indexOf("#") > 0 ) {
       url = url.replace("#", "#privlyLinkKey="+randomkey);
     } else {
       url = url + "#privlyLinkKey=" + randomkey;
     }
     privlyExtension.firePrivlyURLEvent(url);

     $("#messages").text("Copy the address found below to any website you want to share this information through");
     $(".privlyUrl").text(url);
     $(".privlyUrl").attr("href", url);
   }
 }


/**
 * Get the CSRF token and starting content for the form element. 
 */
function initPosting() {
  
  // Assign the CSRF token if it is a Privly server. We use the success
  // callback for all callbacks because we don't assume the content
  // server uses the account details endpoint that the Privly content
  // server hosts.
  privlyNetworkService.initPrivlyService(
    privlyNetworkService.contentServerDomain(), 
    callbacks.pendingPost, 
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

//Add listeners to show loading animation while making ajax requests
$(document).ajaxStart(function() {
  $('#loadingDiv').show(); 
});
$(document).ajaxStop(function() { 
  $('#loadingDiv').hide(); 
});
