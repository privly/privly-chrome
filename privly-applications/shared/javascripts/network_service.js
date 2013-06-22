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
   * Determines which platform the script is runing on. This helps determine
   * which request function should be used. The current values are "CHROME"
   * for the Google Chrome extension, and "HOSTED" for all other architectures.
   * HOSTED functions use standard same-origin AJAX requests.
   *
   * @return {string} the name of the platform.
   */
  platformName: function() {
    if (typeof chrome !== undefined && typeof chrome.extension !== undefined) {
      return "CHROME";
    } else if (navigator.userAgent.indexOf("privly-ios") >= 0) {
      return "IOS";
    } else if(typeof androidJsBridge !== undefined) {
      return "ANDROID";
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
    } else if (privlyNetworkService.platformName() === "CHROME") {
      return localStorage["posting_content_server_url"];
    } else {
      return protocolDomainPort;
    }
  },
  
  /**
   * Make a same-origin get request for content.
   *
   * This request should always proceed a post request.
   *
   * @param {string} url The URL to make a cross domain request for.
   * @param {function} callback The function to execute after the response
   * returns.
   */
  sameOriginGetRequest: function(url, callback) {
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
  }
}
