/**
 * @fileOverview Grabs the data URL for this application and sends it to the
 * extension to make a cross-domain request for content.
 */

/**
 * @namespace
 */
var privlyParameters = {
  
  /**
   * Converts a string to an associative array. You generally only want to use
   * `getParameters()`
   *
   * @param string parameter_string String containing parameters and no anchor
   * text.
   *
   * @return object
   */
  parameterStringToHash: function(parameterString) {
    var parameterHash = {};
    var parameterArray = parameterString.split("&");
    for (var i = 0; i < parameterArray.length; i++) {
      var pair = parameterArray[i].split("=");
      var key = decodeURIComponent(pair[0]);
      var value = decodeURIComponent(pair[1]);
      parameterHash[key] = value;
    }

    return parameterHash;
  },
  
  /**
   * Get an associative array of the parameters found in both the anchor and
   * the parameter string.
   *
   * @param {string} url The original href for the currently injected
   * application.
   *
   * @return {object} An associative array of parameters derived from the url.
   **/
  getParameterHash: function(url)
  {
    url = privlyParameters.getApplicationUrl(url);
    
    var parameters = {};
    var hashIndex = url.indexOf("#");
    if (hashIndex >= 0) {
      parameters = privlyParameters.parameterStringToHash(url.substring(hashIndex + 1));
    }
    var paramIndex = url.indexOf("?");
    if (paramIndex >= 0) {
      var param2 = {};
      if( hashIndex >= 0 ) {
        param2 = privlyParameters.parameterStringToHash(url.substring(paramIndex + 1, hashIndex));
      } else {
        param2 = privlyParameters.parameterStringToHash(url.substr(paramIndex + 1));
      }
      for (var attrname in param2) { parameters[attrname] = param2[attrname]; }
    }
    return parameters;
  },
  
  /** 
   * Gets the URL the application is tied to. We need this because the
   * application may not be served from the server where it is normally
   * hosted.
   *
   * @return string the address of the application.
   */
  getApplicationUrl: function(url) {
    
    //handles the Chrome platform
    if (url.indexOf("privlyOriginalURL=") >= 0) {
      return url.substr(url.indexOf("privlyOriginalURL=") + 18);
    } else {
      return url;
    }
  },
  
  /**
   * Converts an associative array to an encoded string
   * for appending to the anchor.
   *
   * @param object associativeArray Object to be serialized
   * @return string
   */
  objectToParameterString: function(associativeArray) {
    var parameterString = ""
    for (key in associativeArray)
    {
        if( parameterString === "" )
        {
          parameterString = encodeURIComponent(key);
          parameterString += "=" + encodeURIComponent(associativeArray[key]);
        } else {
          parameterString += "&" + encodeURIComponent(key);
          parameterString += "=" + encodeURIComponent(associativeArray[key]);
        }
    }
    
    return parameterString;
  }
};
