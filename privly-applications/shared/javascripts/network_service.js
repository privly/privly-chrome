/**
 * @fileOverview Interfaces the application with its current architecture.
 * This could be an extension, mobile app, or a hosted web server.
 *
 **/
 
/**
 * @namespace
 */
var privlyNetworkService = {
  
  /**
   * If this variable is assigned, it will be appended as a get parameter
   * on all requests, eg, `?auth_token=AUTH_TOKEN_HERE`. This should never
   * be referenced by anything but the auth token setters.
   */
  authToken: "",
  
  /**
   * Set the authentication token if a parameter is supplied, or the
   * current platform has a setter function. This may be called from the
   * context of mobile applications or browser extensions.
   */
  setAuthTokenString: function(authTokenString) {
    if (authTokenString !== undefined) {
      privlyNetworkService.authToken = "auth_token=" + authTokenString;
    } else if(privlyNetworkService.platformName() === "ANDROID") {
      privlyNetworkService.authToken = "auth_token=" + 
                                              androidJsBridge.fetchAuthToken();
    }
  },
  
  /**
   * Adds the auth token to the current URL. If the auth token has not been
   * assigned, nothing is added. If the auth token is assigned, it is added
   * as a get parameter.
   *
   * @param string url the URL that may need an auth token added.
   *
   */
  getAuthenticatedUrl: function(url) {
    privlyNetworkService.setAuthTokenString();
    if(privlyNetworkService.authToken === "") {
      return url;
    }
    
    // if query parameters already exist on the URL
    if (url.indexOf("?") >= 0 && (url.indexOf("?") < url.indexOf("#") ||
      url.indexOf("#") === -1)) {
      return url.replace("?", "?" + privlyNetworkService.authToken + "&");
      
    // else if there is an anchor
    } else if(url.indexOf("#") >= 0) {
      return url.replace("#", "?" + privlyNetworkService.authToken + "#");
    } else {
      return url + "?" + privlyNetworkService.authToken;
    }
  },
  
  /**
   * Determines which platform the script is runing on. This helps determine
   * which request function should be used. The current values are "CHROME"
   * for the Google Chrome extension, and "HOSTED" for all other architectures.
   * HOSTED functions use standard same-origin AJAX requests.
   *
   * @return {string} the name of the platform.
   */
  platformName: function() {
    if (navigator.userAgent.indexOf("iPhone") >= 0 || navigator.userAgent.indexOf("iPad") >= 0) {
      return "IOS";
    } else if(typeof androidJsBridge !== "undefined") {
      return "ANDROID";
    }  else if (typeof chrome !== "undefined" && typeof chrome.extension !== "undefined") {
      return "CHROME";
    } else {
      return "HOSTED";
    }
  },
  
  /**
   * This function is specific to the privly content server available on GitHub.
   * It initializes a CSRF token, and checks whether the user is logged in.
   * Since the application is not necessarily tied to the privly content 
   * server, the failure callback should not necessarily be interpreted as
   * a failure.
   *
   * @param setCSRF boolean indicates whether it should get the CSRF token.
   *
   * @param canPostCallback function the function to execute when
   * initialization is successful.
   *
   * @param loginCallback function the function to execute if the user is 
   * not logged in.
   *
   * @param errorCallback function the function to execute if the remote 
   * server is not available.
   */
  initPrivlyService: function(setCSRF, canPostCallback, loginCallback, errorCallback) {
    var csrfTokenAddress = privlyNetworkService.contentServerDomain() + 
                           "/posts/user_account_data";
    
    csrfTokenAddress =  privlyNetworkService.getAuthenticatedUrl(csrfTokenAddress);
    
    if (setCSRF) {
      $.ajax({
        url: csrfTokenAddress,
        dataType: "json",
        success: function (json, textStatus, jqXHR) {
          $.ajaxSetup({
            beforeSend: function(xhr) {
              xhr.setRequestHeader('X-CSRF-Token', json.csrf);
              xhr.setRequestHeader('Accept', 'application/json');
          }});
          
          if(json.signedIn && json.canPost) {
            canPostCallback(json, textStatus, jqXHR);
          } else if(json.signedIn) {
            cantPostLoginCallback(json, textStatus, jqXHR);
          } else {
            loginCallback(json, textStatus, jqXHR);
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          errorCallback(jqXHR, textStatus, errorThrown);
        }
      });
    } else {
      $.ajaxSetup({
        beforeSend: function(xhr) {
          xhr.setRequestHeader('Accept', 'application/json');
      }});
    }
  },
  
  /**
   * Gives the domain all requests are associated with.
   * 
   * @return {string} The domain content is associated with.
   */
  contentServerDomain: function() {
    var protocolDomainPort = location.protocol + 
                             '//'+location.hostname + 
                             (location.port ? ':'+location.port: '');
    
    if (privlyNetworkService.platformName() === "HOSTED") {
      return protocolDomainPort;
    } else if (privlyNetworkService.platformName() === "CHROME" ||
              (privlyNetworkService.platformName() === "IOS")) {
      return localStorage["posting_content_server_url"];
    } else if (privlyNetworkService.platformName() === "ANDROID") {
      return androidJsBridge.fetchDomainName();	
    } else {
      return protocolDomainPort;
    }
  },
  
  /**
   * Make a same-origin get request for content.
   *
   * This request should always proceed a post request to ensure the post
   * endpoint is expecting integration with the extension.
   *
   * @param {string} url The URL to make a cross domain request for.
   * @param {function} callback The function to execute after the response
   * returns.
   */
  sameOriginGetRequest: function(url, callback) {
    
    // Add the auth token if the get request is on the user's content
    // server
    if( url.indexOf(privlyNetworkService.contentServerDomain()) === 0 ) {
      url = privlyNetworkService.getAuthenticatedUrl(url);
    }
    
    $.ajax({
      url: url,
      dataType: "json",
      success: function (json, textStatus, jqXHR) {
        callback({json: json, textStatus: textStatus, jqXHR: jqXHR});
      },
      error: function (jqXHR, textStatus, errorThrown) {
        callback({json: {}, textStatus: textStatus, jqXHR: jqXHR});
      }
    });
  },
  
  /**
   * Make a same-origin post request to the specified server.
   *
   * Warning: Do not use this function without first checking the data returned
   * by a get request for conformance with the application's signature.
   * Basically, you need to see whether the data at the URL expects to interface
   * with your application. The easiest way to do this is to have a version
   * string for your application in the JSON stored on the content server.
   * This prevents some rather nasty cross-site-scripting attacks.
   *
   * @param {string} path The relative path to make a cross domain request for.
   * @param {function} callback The function to execute after the response
   * returns.
   * @param {object} data The data to be sent with the post request.
   */
  sameOriginPostRequest: function(path, callback, data) {
    
    var url = privlyNetworkService.contentServerDomain() + path;
    url = privlyNetworkService.getAuthenticatedUrl(url);
    $.ajax({
      url: url,
      cache: false,
      type: "POST",
      data: data,
      dataType: "json",
      success: function (json, textStatus, jqXHR) {
        callback({json: json, textStatus: textStatus, jqXHR: jqXHR});
      },
      error: function (jqXHR, textStatus, errorThrown) {
        callback({json: {}, textStatus: textStatus, jqXHR: jqXHR});
      }
    });
  },
  
  /**
   * Assign the href attribute of navigation links appropriately.
   */
  initializeNavigation: function() {
    var domain = privlyNetworkService.contentServerDomain();
    $(".home_domain").attr("href", domain);
    $(".home_domain").text(domain.split("/")[2]);  
    $(".login_url").attr("href", domain + "/users/sign_in");
    $(".account_url").attr("href", domain + "/pages/account");
    $(".legal_nav").attr("href", domain + "/pages/privacy");
    document.getElementById("logout_link").addEventListener('click', function(){
      $.post(domain + "/users/sign_out", "_method=delete", function(data) {
        privlyNetworkService.showLoggedOutNav();
      });
    });
  },
  
  /**
   * Show/hide the appropriate navigation items for when the user is logged out.
   */
  showLoggedOutNav: function() {
    $(".logged_in_nav").hide();
    $(".logged_out_nav").show();
  },
  
  /**
   * Show/hide the appropriate navigation items for when the user is logged in.
   */
  showLoggedInNav: function() {
    $(".logged_in_nav").show();
    $(".logged_out_nav").hide();
  }
}
