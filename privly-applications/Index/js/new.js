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
 * 4. postSubmit: The user submitted the form so the content is being
 *    sent to the remote server. Once it is returned, the URL will
 *    be messaged to the extension (if present) by calling the
 *    "postCompleted" callback.
 * 5. Error creating post: The remote server would not accept the user's
 *    content. The app should display an error message.
 *    Callback=createError
 * 6. Completed post: The remote server has returned a URL. This app should
 *    display it and fire the URL event.
 *    Callback=postCompleted
 */
var callbacks = {
  
  /**
   * Initialize the whole application.
   */
  pendingLogin: function() {
    
    // Set the nav bar to the proper domain
    privlyNetworkService.initializeNavigation();
    
    // Initialize message pathway to the extension.
    messaging.initialize();
    
    // Show or hide the posting button depending on whether
    // there is likely an extension watching for its events.
    if( privlyNetworkService.platformName() === "HOSTED" ) {
      $("#message_link_button")[0].setAttribute("style","display:none");
    } else {
      document.getElementById("message_link_button").addEventListener(
        'click', postUrl, false);
    }
    
    // Watch for the preview iframe's messages so it can be resized
    window.addEventListener('message', resizeIframePostedMessage, false);
    
    // Add listeners to show loading animation while making ajax requests
    $(document).ajaxStart(function() {
      $('#loadingDiv').show(); 
    });
    $(document).ajaxStop(function() { 
      $('#loadingDiv').hide(); 
    });
    
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
   * Tell the user they can create their post by updating the UI.
   */
  pendingPost: function() {
    
    privlyNetworkService.showLoggedInNav();
    
    privlyNetworkService.sameOriginGetRequest(
      privlyNetworkService.contentServerDomain() + "/posts", 
      callbacks.postCompleted);
    
    $("#messages").text("");
  },
  
  /**
   * Submit the posting form and await the return of the post.
   */
  postSubmit: function() {
    //pass
  },
  
  /**
   * Tell the user that there was a problem.
   */
  createError: function() {
    $("#messages").text("There was an error fetching your posts.");
  },
  
  /**
   * Display the table of posts stored at the server.
   */
  postCompleted: function(response) {
    
    var tableBody = document.getElementById("table_body");
    for(var i = 0; i < response.json.length; i++) {
      
      var href = response.json[i].privly_URL;
      var params = href.substr(href.indexOf("?") + 1);
      var app = privlyParameters.parameterStringToHash(params).privlyApp;
      
      var tr = document.createElement('tr');
      
      var td1 = document.createElement('td');
      var td1a = document.createElement('a');
      td1a.setAttribute("href", "#");
      td1a.setAttribute("class", "view_link");
      td1a.setAttribute("data-privly-app-name", app);
      td1a.setAttribute("data-privly-app-parameters", params);
      td1a.setAttribute("data-canonical-href", href);
      td1a.textContent = response.json[i].privly_application;
      td1.appendChild(td1a);
      tr.appendChild(td1);
      
      var td2 = document.createElement('td');
      var td2a = document.createElement('a');
      td2a.setAttribute("href", "../" + response.json[i].privly_application + "/show.html?" + params);
      td2a.setAttribute("target", "_blank");
      td2a.textContent = "open";
      td2.appendChild(td2a);
      tr.appendChild(td2);
      
      var td3 = document.createElement('td');
      td3.textContent = response.json[i].created_at;
      tr.appendChild(td3);
      
      var td4 = document.createElement('td');
      td4.textContent = response.json[i].burn_after_date;
      tr.appendChild(td4);
      
      var td5 = document.createElement('td');
      td5.textContent = response.json[i].updated_at;
      tr.appendChild(td5);
      
      var td6 = document.createElement('td');
      td6.textContent = response.json[i].content;
      tr.appendChild(td6);
      
      tableBody.appendChild(tr)
      
    }
    
    var dataTable = $('#posts').dataTable();
    
    // Hide the markdown column after initialisation
    dataTable.fnSetColumnVis( 5, false );
    
    $('body').on('click', 'a.view_link', function() {
      
      $('#table_col').removeClass('col-lg-12');
      $('#iframe_col').addClass('col-lg-4');
      $('#table_col').addClass('col-lg-8');
      $('#iframe_col').css('display', 'inherit');
      
      var app = $(this).attr("data-privly-app-name");
      if(/^[a-zA-Z]+$/.test(app)) {
        
        var iFrame = document.createElement('iframe');

        // Styling and display attributes that mirror those
        // of the privly.js content script
        iFrame.setAttribute("frameborder","0");
        iFrame.setAttribute("vspace","0");
        iFrame.setAttribute("hspace","0");
        iFrame.setAttribute("width","100%");
        iFrame.setAttribute("marginwidth","0");
        iFrame.setAttribute("marginheight","0");
        iFrame.setAttribute("height","1px");
        iFrame.setAttribute("frameborder","0");
        iFrame.setAttribute("style","width: 100%; height: 32px; " +
          "overflow: hidden;");
        iFrame.setAttribute("scrolling","no");
        iFrame.setAttribute("overflow","hidden");
        iFrame.setAttribute("data-privly-accept-resize","true");
        
        // The href of the original link as dictated by the remote server
        var canonicalHref = $(this).attr("data-canonical-href");
        iFrame.setAttribute("data-canonical-href", canonicalHref);
        
        //Set the source URL
        var localParams = $(this).attr("data-privly-app-parameters");
        iFrame.setAttribute("src", "../" + 
                                    app + "/show.html?" + localParams);
        
        //The id and the name are the same so that the iframe can be 
        //uniquely identified and resized by resizeIframePostedMessage()
        iFrame.setAttribute("id", "ifrm0");
        iFrame.setAttribute("name", "ifrm0");
        
        // Clear the old iframe and insert the new one
        $(".privly_iframe").html("");                          
        $(".privly_iframe").append(iFrame);
        
        // Label the iframe
        $("#privly_iframe_title").text(app);
        $("#privly_iframe_meta").text("The App's contents are below.");
      }
    });
  }
}

/**
 * Message handlers for integration with extension framworks.
 */
var messaging = {
  
  /**
   * Attach the message listeners to the interface between the extension
   * and the injectable application.
   */
  initialize: function() {
      privlyExtension.initialContent = messaging.initialContent;
      privlyExtension.messageSecret = messaging.messageSecret;
      
      // Initialize message pathway to the extension.
      privlyExtension.firePrivlyMessageSecretEvent();
  },
  
  
  /**
   * Listener for the initial content that should be dropped into the form.
   * This may be sent by a browser extension.
   *
   * @param {json} data A json document containing the initial content for
   * the form.
   */
  initialContent: function(data) {},

  /**
   * Request the initial content from the extension. This callback is executed
   * after the extension successfully messages the secret message back to the
   * application.
   * 
   * @param {json} data A json document that is ignored by this function.
   */
  messageSecret: function(data) {}
  
}

/**
 * Resize eligible iframes to the proper height based on their contents.
 *
 * @param {message} e The message posted by an iframe. 
 */
function resizeIframePostedMessage(e) {
  if(e.origin == window.location.origin) {
    document.getElementById("ifrm0").style.height = e.data.split(",")[1] + "px";
  }
}

/**
 * Sends the currently displayed URL to the extension or mobile framework
 * running the applicaiton so it can be submitted to a host page webform.
 */
function postUrl() {
  privlyExtension.firePrivlyURLEvent(
    document.getElementById("ifrm0").getAttribute("data-canonical-href"));
}

// Initialize the application
document.addEventListener('DOMContentLoaded', callbacks.pendingLogin);
