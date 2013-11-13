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
     state.jsonURL = state.parameters["privlyDataURL"];
    } else {
     //deprecated
     state.jsonURL = state.webApplicationURL.replace("format=iframe", "format=json");
    }
    
    $(".meta_source_domain").text("Source URL: " + state.jsonURL);
    
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

      // Creates a tooptip which indicates the content is not a 
      // natural element of the page
      privlyTooltip.tooltip();

      // Send the height of the iframe everytime the window size changes.
      // This usually results from the user resizing the window.
      // This causes performance issues on Firefox.
      if( privlyNetworkService.platformName() !== "FIREFOX" ) {
        $(window).resize(function(){
          privlyHostPage.resizeToWrapper();
        });
      }
      
      // Display the domain of the content in the glyph
      var dataDomain = privlyNetworkService.getProtocolAndDomain(state.jsonURL);
      privlyTooltip.updateMessage(dataDomain + " PlainPost: Read Only");

      // Load CSS to show the tooltip and other injected styling
      loadInjectedCSS();

    } else {

      // Check whether the user is signed into their content server
      privlyNetworkService.initPrivlyService(
        privlyNetworkService.contentServerDomain(), 
        privlyNetworkService.showLoggedInNav, 
        function(){}, // otherwise assume they are logged out
        function(){} // otherwise assume they are logged out
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
      var serverMarkdown = null;
      
      if( json !== null ) {
        
        // Assign the HTML from the JSON
        if( json.content ) {
          serverMarkdown = json.content;
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
      
      if( privlyNetworkService.permissions.canUpdate || 
        privlyNetworkService.permissions.canDestroy ) {
          // Check whether the user is signed into their content server
          privlyNetworkService.initPrivlyService(
            state.jsonURL, 
            function(){
              // Initialize the form for updating the post
              // if the user has permission.
              if( privlyNetworkService.permissions.canUpdate) {
                $("#edit_text").val(json.content);
                $("#edit_link").show();
                $("#no_permissions_nav").hide();
                $("#permissions_nav").show();
                
                var dataDomain = privlyNetworkService.getProtocolAndDomain(state.jsonURL);
                privlyTooltip.updateMessage(dataDomain + " PlainPost: Editable");
                $(".meta_canupdate").text("You can update this content.");
              }

              // Initialize the form for destroying the post
              // if the user has permission.
              if( privlyNetworkService.permissions.canDestroy) {
                $("#destroy_link").show();
                $("#no_permissions_nav").hide();
                $("#permissions_nav").show();
                $(".meta_candestroy").text("You can destroy this content.");
              }
            }, 
            function(){}, // otherwise assume no permissions
            function(){} // otherwise assume no permissions
          );
      }
      
      if( json.created_at ) {
        var createdDate = new Date(json.created_at);
        $(".meta_created_at").text("Created Around " + 
          createdDate.toDateString() + ". ");
      }
      
      if( json.burn_after_date ) {
        var destroyedDate = new Date(json.burn_after_date);
        $(".meta_destroyed_around").text("Destroyed Around " + 
          destroyedDate.toDateString() + ". ");
      }
      
      if( serverMarkdown === null ) {
        sandboxedContentFrame(response.jqXHR.responseText);
      } else {
        var markdownHTML = markdown.toHTML(serverMarkdown);

        $("#post_content").html(markdownHTML);

        // Make all user-submitted links open a new window
        $('#post_content a').attr("target", "_blank");
      }
      
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
    privlyNetworkService.sameOriginDeleteRequest(state.jsonURL, callbacks.destroyed, {});
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
    privlyNetworkService.sameOriginPutRequest(state.jsonURL, 
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

/**
 * Load content inside a sanboxed iframe.
 * The iframe will be surrounded by the Privly glyph in order to indicate that 
 * the content is not a normal element of the page. Normally the Glyph would 
 * be loaded as a tooltip, but in this case we are deactivating scripting
 * inside the content area as a security measure, which prohibits the loading
 * of the gyph as a tooltip.
 *
 * The sandbox settings are currently: allow-top-navigation allow-same-origin
 * Since we are setting the document using a string, we can script it from
 * outside the iframe when the allow-same-origin is set. Combined with
 * allow-top-navigation, which allows the iframe to change the window that is
 * being viewed, we can integrate the apps properly.
 *
 * Warning: Never set the sandbox flag "allow-scripts". It will totally remove
 * any security guarantees of this method.
 * 
 * This is only used for more suspicious circumstances like when the returned 
 * content is not in markdown. The Markdown parser includes a built in 
 * sanitizer, but this method does not. It relies on the HTML5 iframe sandbox 
 * property to secure the content. Since the content is loaded via the srcdoc 
 * attribute, this content method will not work for older browsers, which is 
 * desired because iframe sandboxing is a newer web standard. 
 *
 * @param {string} unstrustedHTML The HTML we are going to put in a sandbox.
 *
 */
function sandboxedContentFrame(untrustedHTML) {
    
    $("#cleartext").hide();
    
    // Start the trusted region of the page
    var glyph = privlyTooltip.glyphHTML();
    $("#post_content").append("<p>Start of Unkown Content</p>" + glyph);
    
    var iFrame = document.createElement('iframe');
    
    //Styling and display attributes
    iFrame.setAttribute("sandbox", "allow-top-navigation allow-same-origin");
    
    iFrame.setAttribute("frameborder","0");
    iFrame.setAttribute("vspace","0");
    iFrame.setAttribute("hspace","0");
    iFrame.setAttribute("width","100%");
    iFrame.setAttribute("marginwidth","0");
    iFrame.setAttribute("marginheight","0");
    iFrame.setAttribute("frameborder","0");
    iFrame.setAttribute("style","width: 100%;" +
      "overflow: hidden;height:2px;");
    iFrame.setAttribute("scrolling","no");
    iFrame.setAttribute("overflow","hidden");
    
    // Make all user-submitted links open a new window
    $(untrustedHTML).attr("target", "_blank");
    
    //Set the source URL
    iFrame.setAttribute("srcdoc", untrustedHTML);
    iFrame.setAttribute("id", "UntrustedIframe");
    
    // Put the content in the page
    $("#post_content").append(iFrame);
    
    // End the trusted region of the page
    $("#post_content").append(glyph + "<p>End of Unknown Content</p>");
    
    // Gives the doc time to render
    setTimeout(function(){
      iFrame = document.getElementById("UntrustedIframe");
      
      // set all links to open in the current window
      $(iFrame.contentDocument).find('a').attr("target", "_top");
      $(iFrame.contentDocument).find("img").remove();
      $(iFrame.contentDocument).find("link").remove();
      var height = iFrame.contentDocument.height;
      iFrame.style.height = height + "px";
      privlyHostPage.resizeToWrapper();
    }, 0)
}

// Initialize the application
document.addEventListener('DOMContentLoaded', callbacks.pendingContent);
