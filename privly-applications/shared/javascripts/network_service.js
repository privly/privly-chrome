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
   * Permissions the user may have on creating and updating content.
   * Each of these permissions are associated with a network request.
   * They should only be set to "true" if the associated get/post/delete
   * request could be made without harming the remote server. You can usually
   * establish that the request will not harm data stored remotely by 
   * doing a get request that affirms the user's right to perform certain
   * operations.
   */
  permissions: {
    canCreate: false,
    canDestroy: false,
    canUpdate: false,
    canShare: false,
    canShow: false
  },
  
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
    
    // get the parameter string for the auth token
    privlyNetworkService.setAuthTokenString();
    
    // Don't change the URL if there is no auth token, or the URL
    // is not for the content server
    if( privlyNetworkService.authToken === "" || 
      url.indexOf(privlyNetworkService.contentServerDomain()) !== 0 ) {
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
   * Helper for determining the protocol+domain of a
   * URL.
   *
   * @param {string} url the URL for which we want the domain and protocl
   * @return {string} The string of the protocol and domain.
   */
  getProtocolAndDomain: function(url) {
    var domainGrabber = document.createElement("a");
    domainGrabber.href = url;
    return domainGrabber.protocol + "//" + domainGrabber.host;
  },
  
  /**
   * The cross-site request forgery tokens for servers initialized via 
   * initPrivlyService.
   */
  csrfTokens: {},
  
  /**
   * Get the CSRF token (if it exists) for a domain. CSRF tokens should be
   * initialized before requesting them here.
   * @param {string} url a URL for which we need to lookup its CSRF token
   */
  getCSRFToken: function(url) {
    return privlyNetworkService.csrfTokens[privlyNetworkService.getProtocolAndDomain(url)];
  },
  
  /**
   * This function is specific to the privly content server available on GitHub.
   * It initializes a CSRF token, and checks whether the user is logged in.
   *
   * @param loggedInCallback function the function to execute when
   * initialization is successful.
   *
   * @param loginCallback function the function to execute if the user is 
   * not logged in.
   *
   * @param errorCallback function the function to execute if the remote 
   * server is not available.
   */
  initPrivlyService: function(url, loggedInCallback, loginCallback, 
    errorCallback) {
    
    var csrfTokenAddress = privlyNetworkService.getProtocolAndDomain(url) + 
                           "/posts/user_account_data";
    
    csrfTokenAddress =  privlyNetworkService.getAuthenticatedUrl(csrfTokenAddress);
    $.ajax({
      url: csrfTokenAddress,
      dataType: "json",
      headers: { 
              Accept: "application/json"
          },
      success: function (json, textStatus, jqXHR) {
        // set the CSRF
        privlyNetworkService.csrfTokens[privlyNetworkService.getProtocolAndDomain(url)] = json.csrf;
        if(json.signedIn) {
          loggedInCallback(json, textStatus, jqXHR);
        } else {
          loginCallback(json, textStatus, jqXHR);
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        errorCallback(jqXHR, textStatus, errorThrown);
      }
    });
    
  },
  
  /**
   * Determines network policy for request. Since network requests can be 
   * used to track when a user is reading Privly content (emails for instance),
   * requests must be checked for whitelisting status when the content is 
   * injected.
   *
   * @param {string} url The URL that may be able to track the user.
   *
   */
  isWhitelistedDomain: function(url) {
    
    // Chrome maintains an explicit whitelist in localStorage
    if( privlyNetworkService.platformName() === "CHROME" ) {
      
      // get the user defined whitelist and add in the default whitelist
      var whitelist = localStorage["user_whitelist_csv"].split(" , ");
      whitelist.push("priv.ly");
      whitelist.push("dev.privly.org");
      whitelist.push("localhost");
      whitelist.push("privlyalpha.org");
      whitelist.push("privlybeta.org");
      whitelist.push("localhost:3000");
      whitelist.push("localhost:4000");
      
      // See if the domain is in the whitelist
      for(var i = 0; i < whitelist.length; i++) {
        if( url.indexOf(whitelist[i]) > 0) {
          if(url.split("/")[2] == whitelist[i]) return true; // make sure it is just the domain
        }
      }
    } else {
      //Hosted, Android, and iOS don't have the same privacy concerns
      return true;
    }
    return false;
  },
  
  /**
   * Gives the domain for the user's trusted content server.
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
      headers: { 
              Accept: "application/json"
          },
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
   * @param {string} url The url to make a cross domain request for.
   * @param {function} callback The function to execute after the response
   * returns.
   * @param {object} data The data to be sent with the post request.
   */
  sameOriginPostRequest: function(url, callback, data) {
    url = privlyNetworkService.getAuthenticatedUrl(url);
    $.ajax({
      url: url,
      cache: false,
      type: "POST",
      data: data,
      dataType: "json",
      headers: { 
              Accept: "application/json",
              "X-CSRF-Token": privlyNetworkService.getCSRFToken(url)
          },
      success: function (json, textStatus, jqXHR) {
        callback({json: json, textStatus: textStatus, jqXHR: jqXHR});
      },
      error: function (jqXHR, textStatus, errorThrown) {
        callback({json: {}, textStatus: textStatus, jqXHR: jqXHR});
      }
    });
  },
  
  /**
   * Make a same-origin put request to the specified server.
   *
   * Warning: Do not use this function without first checking the data returned
   * by a get request for conformance with the application's signature.
   * Basically, you need to see whether the data at the URL expects to interface
   * with your application. The easiest way to do this is to have a version
   * string for your application in the JSON stored on the content server.
   * This prevents some rather nasty cross-site-scripting attacks.
   *
   * @param {string} url The url to make a cross domain request for.
   * @param {function} callback The function to execute after the response
   * returns.
   * @param {object} data The data to be sent with the post request.
   */
  sameOriginPutRequest: function(url, callback, data) {
    url = privlyNetworkService.getAuthenticatedUrl(url);
    $.ajax({
      url: url,
      cache: false,
      type: "PUT",
      data: data,
      dataType: "json",
      headers: { 
              Accept: "application/json",
              "X-CSRF-Token": privlyNetworkService.getCSRFToken(url)
          },
      success: function (json, textStatus, jqXHR) {
        callback({json: json, textStatus: textStatus, jqXHR: jqXHR});
      },
      error: function (jqXHR, textStatus, errorThrown) {
        callback({json: {}, textStatus: textStatus, jqXHR: jqXHR});
      }
    });
  },
  
  /**
   * Make a same-origin delete request to the specified server.
   *
   * Warning: Do not use this function without first checking the data returned
   * by a get request for conformance with the application's signature.
   * Basically, you need to see whether the data at the URL expects to interface
   * with your application. The easiest way to do this is to have a version
   * string for your application in the JSON stored on the content server.
   * This prevents some rather nasty cross-site-scripting attacks.
   *
   * @param {string} url The url to make a cross domain request for.
   * @param {function} callback The function to execute after the response
   * returns.
   * @param {object} data The data to be sent with the post request.
   */
  sameOriginDeleteRequest: function(url, callback, data) {
    url = privlyNetworkService.getAuthenticatedUrl(url);
    $.ajax({
      url: url,
      cache: false,
      type: "DELETE",
      data: data,
      dataType: "json",
      headers: { 
              Accept: "application/json",
              "X-CSRF-Token": privlyNetworkService.getCSRFToken(url)
          },
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
        location.reload(true);
      });
    });
    
    // Change the target property to be self if the application is hosted
    // by a remote server.
    if( privlyNetworkService.platformName() === "HOSTED" ) {
      $(".home_domain").attr("target", "_self"); 
      $(".login_url").attr("target", "_self");
      $(".account_url").attr("target", "_self");
      $(".legal_nav").attr("target", "_self");
    }
    
    if( privlyNetworkService.platformName() === "IOS" ||
        privlyNetworkService.platformName() === "ANDROID" ) {
      $(".mobile_hide").hide(); 
    }
    
  },
  
  /**
   * Show/hide the appropriate navigation items for when the user is logged out.
   */
  showLoggedOutNav: function() {
    $(".logged_in_nav").hide();
    $(".logged_out_nav").show();
    if( privlyNetworkService.platformName() === "IOS" ||
        privlyNetworkService.platformName() === "ANDROID" ) {
      $(".mobile_hide").hide(); 
    }
  },
  
  /**
   * Show/hide the appropriate navigation items for when the user is logged in.
   */
  showLoggedInNav: function() {
    $(".logged_in_nav").show();
    $(".logged_out_nav").hide();
    if( privlyNetworkService.platformName() === "IOS" ||
        privlyNetworkService.platformName() === "ANDROID" ) {
      $(".mobile_hide").hide(); 
    }
  }
}
