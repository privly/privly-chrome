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
 * 2. Pending Login: The user needs to login to the server storing the
 *    content. After login, they may have access.
 *    Callback=pendingLogin
 * 3. Content Returned: The server returned the content for display.
 *    Callback=contentReturned
 * 4. Destroy: The user clicked the "destroy" button.
 * 5. Destroyed: The server returned a response from the destroy command.
 * 6. Edit: The user clicked the "edit" button.
 * 7. Update: The user submitted the "edit" form.
 * 8. click: The user clicked the application. This is primarily used when
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
    } else {
     //deprecated
     state.jsonURL = state.webApplicationURL.replace("format=iframe", "format=json");
    }

    // Register the click listener.
    $("body").on("click", callbacks.click);

    // Register the link and button listeners.
    $("#destroy_link").click(callbacks.destroy);
    $("#cancel_button").click(function(){$("#edit_form").slideUp()});
    document.getElementById("update").addEventListener('click', callbacks.update);
    $("#edit_link").click(callbacks.edit);

    // Set the nav bar to the proper domain
    privlyNetworkService.initializeNavigation();

    if(privlyHostPage.isInjected()) {

      // Log the user in if the app is served from an extension
      privlyNetworkService.initPrivlyService(false);

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
      privlyTooltip.updateMessage(dataDomain + " PlainPost: Read Only");

      // Load CSS to show the tooltip and other injected styling
      loadInjectedCSS();

    } else {

      // Get the CSRF token and other items to support updating the content.
      privlyNetworkService.initPrivlyService(true, 
        privlyNetworkService.showLoggedInNav, 
        function(){},
        function(){}
      );

      // Load CSS to show the nav and the rest of the non-injected page
      loadTopCSS();
   }
   
   // Ensure whitelist compliance of the data parameter when the content is
   // injected
   if( !privlyHostPage.isInjected() || 
    privlyNetworkService.isWhitelistedDomain(state.jsonURL) ) {
     // Make the cross origin request as if it were on the same origin.
     // The "same origin" requirement is only possible on extension frameworks
     privlyNetworkService.sameOriginGetRequest(state.jsonURL, 
       callbacks.contentReturned);
   } else {
     $("#post_content").html("<p>Click to view this content.</p>");
   }
   
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
      
      privlyNetworkService.permissions.canShow = true;
      
      var json = response.json;
      var html = null;
      

      if( json !== null ) {
        
        // Assign the HTML from the JSON
        if( json.rendered_markdown ) {
          html = json.rendered_markdown;
        }
        
        // Assign the permissions
        if( json.permissions ) {
          privlyNetworkService.permissions.canShare = (
            json.permissions.canshare === true);
          privlyNetworkService.permissions.canUpdate = (
            json.permissions.canupdate === true);
          privlyNetworkService.permissions.canDestroy = (
            json.permissions.candestroy === true);
        }
      }
      
      // Initialize the form for updating the post
      // if the user has permission.
      if( privlyNetworkService.permissions.canUpdate) {
        $("#edit_text").val(json.content);
        $("#edit_link").show();
        $("#no_permissions_nav").hide();
        $("#permissions_nav").show();
      }
      
      // Initialize the form for destroying the post
      // if the user has permission.
      if( privlyNetworkService.permissions.canDestroy) {
        $("#destroy_link").show();
        $("#no_permissions_nav").hide();
        $("#permissions_nav").show();
      }
      
      // If the response did not include JSON, then we can simply display
      // the returned HTML.
      if( html === null ) {
        html = response.jqXHR.responseText;
      }
      
      // Google Caja clean the remote HTML of anything potentially harmful.
      // All http URLs are allowed in hyperlinks.
      function urlX(url) { if(/^https?:\/\//.test(url)) { return url }}
      function idX(id) { return id }
      var sanitizedHTML = html_sanitize(html, urlX, idX);
      
      // Put the content in the page
      $("#post_content").html(sanitizedHTML);
      
      // Make all user-submitted links open a new window
      $('#post_content a').attr("target", "_blank");
      
      // Tells the parent document how tall the iframe is so that
      // the iframe height can be changed to its content's height
      privlyHostPage.resizeToWrapper();
      
    } else if(response.jqXHR.status === 403) {
      $("#post_content").html(
        "<p>Your current user account does not have access to this. " + 
        "It is also possible that the content was destroyed at the source.</p>");

      // Tells the parent document how tall the iframe is so that
      // the iframe height can be changed to its content's height
      privlyHostPage.resizeToWrapper();
    } else {
      $("#post_content").html("<p>You do not have access to this.</p>");

      // Tells the parent document how tall the iframe is so that
      // the iframe height can be changed to its content's height
      privlyHostPage.resizeToWrapper();
    }
  },
  
  /**
   * The destroy button was just pushed. Ask the remote server to destroy 
   * the content associated with the post, then notify the user of the results
   * in callbacks.destroyed.
   */
  destroy: function() {
    
    $("#edit_form").slideUp("slow");
    
    var path = state.jsonURL.substr(state.jsonURL.indexOf("//") + 2);
    path = "/" + path.substr(path.indexOf("/") + 1);
    
    privlyNetworkService.initPrivlyService(true, function() {
        privlyNetworkService.sameOriginDeleteRequest(path, callbacks.destroyed, {});
      }, 
      callbacks.destroyed, 
      callbacks.destroyed);
  },
  
  /**
  * Process the content returned from the server on a destroy request.
  *
  * @param {object} response The response from the remote server.
  */
  destroyed: function(response) {
    if( response.jqXHR.status === 200 ) {
      
      // Tell the user the content was probably destroyed
      $("#post_content").html(
        "<p>The remote server says it destroyed the content. " + 
        "If the server cannot be trusted, then it may have coppies.</p>");
      
      // Hide the drop down menu
      $("#no_permissions_nav").show();
      $("#permissions_nav").hide();
      
      // Tells the parent document how tall the iframe is so that
      // the iframe height can be changed to its content's height
      privlyHostPage.resizeToWrapper();
      
    } else {
      $("#post_content").html("<p>You do not have permission to destroy this.</p>");

      // Tells the parent document how tall the iframe is so that
      // the iframe height can be changed to its content's height
      privlyHostPage.resizeToWrapper();
    }
  },
  
  /**
   * Display the form for editing the post. This callback is not currently
   * supported in injected mode.
   */
  edit: function() {
    $("#edit_form").slideDown("slow");
  },
  
  /**
   * Update the remote server's content with the new value.
   * This function should only be called if the remote server's
   * initial response had the permission object, and the update
   * flag was set to true. This prevents some CSRF issues.
   */
  update: function() {
    var path = state.jsonURL.substr(state.jsonURL.indexOf("//") + 2);
    path = "/" + path.substr(path.indexOf("/") + 1);
    
    privlyNetworkService.sameOriginPutRequest(path, 
      callbacks.contentReturned, 
      {post: {content: $("#edit_text").val()}});
      
    // Close the editing form
    $("#edit_form").slideUp("slow");
  },
  
  /**
  * This is an event listener for click events. When the applicaiton is injected
  * into the context of a host page, the app will be opened in a new window.
  *
  * @param {event} evt The event triggered by the window being clicked.
  *
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
