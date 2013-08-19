/**
 * @fileOverview
 * This JavaScript acts as the driver for the PlainPost injectable application.
 * It defines the behavior specifc to this application. For more information
 * about the PlainPost application, view the README.
 **/

/**
 * @namespace
 *
 * State variables used accross all the callbacks.
 *
 */
var state = {

  /**
  * The parameters found on the app's URL as parsed by the parameter script.
  */
  parameters: {},

  /**
  * The URL of the application when accessed via the remote server. This
  * parameter is usually assigned by the extension since the original URL
  * is replaced by one served from the extension.
  */
  webApplicationURL: "",

  /**
  * The URL of the data endpoint for this application.
  */
  jsonURL: ""
}


/**
* The callbacks assign the state of the application.
*
* This application can be placed into the following states:
* 1. Pending Content: The app is currently requesting the content.
*    Callback=pendingContent
* 2. Unauthorized: The user does not have access to the content
*    Callback=unauthorized
* 3. Error: The server returned an error (500 code).
*    Callback=error
* 4. Pending Login: The user needs to login to the server storing the
*    content. After login, they may have access.
*    Callback=pendingLogin
* 5. Content Returned: The server returned the content for display.
*    Callback=contentReturned
* 6. click: The user clicked the application. This is primarily used when
*    the application is injected into the context of a host page.
*    Callback=click
*/
var callbacks = {

  /**
  * Initialize the whole application.
  */
  pendingContent: function() {
    
   // Set the application and data URLs
   var href = window.location.href;
   state.webApplicationURL = privlyParameters.getApplicationUrl(href);
   state.parameters = privlyParameters.getParameterHash(state.webApplicationURL);
   if (state.parameters["privlyDataURL"] !== undefined) {
     state.jsonURL = decodeURIComponent(state.parameters["privlyDataURL"]);
   } else if(state.parameters["privlyCiphertextURL"] !== undefined) {
     state.jsonURL = decodeURIComponent(state.parameters["privlyCiphertextURL"]); // deprecated
   }
   
   // Register the click listener.
   jQuery("body").on("click", callbacks.click);
   
   // Set the nav bar to the proper domain
   privlyNetworkService.initializeNavigation();
   
   if(privlyHostPage.isInjected()) {
     
     // Creates a tooptip which indicates the content is not a 
     // natural element of the page
     privlyTooltip.tooltip();
     
     // Send the height of the iframe everytime the window size changes.
     // This usually results from the user resizing the window.
     $(window).resize(function(){
       privlyHostPage.resizeToWrapper();
     });
     
     // Display the domain of the content in the glyph
     var dataDomain = state.jsonURL.split("/")[2];
     privlyTooltip.updateMessage(dataDomain + " ZeroBin: Read Only");
     
     // Load CSS to show the tooltip and other injected styling
     loadInjectedCSS();
     
   } else {
     
     //todo, the user is not necessarily logged in but the post does not currently have
     //a universal method for checking.
     privlyNetworkService.showLoggedInNav();
     
     // Load CSS to show the nav and the rest of the non-injected page
     loadTopCSS();
   }
   
   // Make the cross origin request as if it were on the same origin.
   // The "same origin" requirement is only possible on extension frameworks
   privlyNetworkService.initPrivlyService(false);
   privlyNetworkService.sameOriginGetRequest(state.jsonURL, callbacks.contentReturned);
  },
  
  /**
  * The user, who is logged in, does not have access to the content. This callback is
  * currently only called from the contentReturned callback.
  */
  unauthorized: function() {
    
    $("#post_content").html("<p>Your current user account does not have access to this.</p>");
    
    // Tells the parent document how tall the iframe is so that
    // the iframe height can be changed to its content's height
    privlyHostPage.resizeToWrapper();
  },

  /**
  * The remote server returned an error.
  */
  error: function() {
    $("#post_content").html("<p>You do not have access to this.</p>");
    
    // Tells the parent document how tall the iframe is so that
    // the iframe height can be changed to its content's height
    privlyHostPage.resizeToWrapper();
  },

  /**
  * The user may have access to the content if they login to the server
  * hosting the content.
  */
  pendingLogin: function() {
    $("#post_content").html("<p>You do not have access to this.</p>");
    
    // Tells the parent document how tall the iframe is so that
    // the iframe height can be changed to its content's height
    privlyHostPage.resizeToWrapper();
  },

  /**
  * Process the post's content returned from the remote server.
  *
  * @param {object} response The response from the remote server. In cases
  * without error, the response body will be in response.response.
  */
  contentReturned: function(response) {
   if( response.jqXHR.status === 200 ) {
     
      var url = window.location.href;
      var key = privlyParameters.getParameterHash(url).privlyLinkKey;
      var json = response.json;

      if (key === undefined) {
        $('div#cleartext').text("You do not have the key required to decrypt this content.");
      } else if(json.structured_content !== undefined) {
        var cleartext = zeroDecipher(pageKey(key), json.structured_content);
        $('div#cleartext').text(cleartext);
        urls2links($('div#cleartext')); // Convert URLs to clickable links.
      } else {
        $('div#cleartext').text("The data behind this link is corrupted.");
      }

      // Tells the parent document how tall the iframe is so that
      // the iframe height can be changed to its content's height
      privlyHostPage.resizeToWrapper();
      
    } else if(response.jqXHR.status === 403) {
      callbacks.unauthorized();
    } else {
      callbacks.error();
    }
  },
  
  /**
  * This is an event listener for click events. When the applicaiton is injected
  * into the context of a host page, the app will be opened in a new window.
  */
  click: function(evt) {
   if(privlyHostPage.isInjected()) {
     if(evt.target.nodeName !== "A" || evt.target.href === ""){
       window.open(location.href, '_blank');
     }
   }
  }
 
}

// Initialize the application
document.addEventListener('DOMContentLoaded', callbacks.pendingContent);
