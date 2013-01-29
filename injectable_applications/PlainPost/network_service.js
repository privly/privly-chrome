/**
 * @fileOverview Grabs the data URL for this application and sends it to the
 * extension to make a cross-domain request for content.
 */

/**
 * Converts a string to an associative array.
 *
 * @param string parameter_string String containing parameters
 *
 * @return object
 */
function parameterStringToHash(parameterString)
{
  var parameterHash = {};
  var parameterArray = parameterString.split("&");
  for (var i = 0; i < parameterArray.length; i++) {
    //var currentParamterString = decodeURIComponent(parameterArray[i]);
    var pair = parameterArray[i].split("=");
    var key = decodeURIComponent(pair[0]);
    var value = decodeURIComponent(pair[1]);
    parameterHash[key] = value;
  }
  
  return parameterHash;
}

/**
 * Get an associative arroy of the parameters found in the anchor
 *
 * @param {string} href The original href for the currently injected
 * application.
 *
 * @return object
 **/
function getParameterHash(href)
{
  if (href.indexOf("privlyOriginalURL=") >= 0) {
    href = href.substr(href.indexOf("privlyOriginalURL=") + 18);
  }
  var hashIndex = href.indexOf("#");
  if (hashIndex >= 0) {
    return parameterStringToHash(href.substring(hashIndex + 1));
  } else {
    return {};
  } 
}

/**
 * The URL of the application when accessed via the remote server.
 */
var webApplicationURL = "";

/**
 * The URL of the data endpoint for this application.
 */
var jsonURL = "";

/**
 * Send the data URL to the extension so it can make a cross-domain request
 * for the content. When the extension returns the content, it assigns the
 * content area to the returned sanitized string.
 */
function getContent()
{
  // set the application and data URLs
  var href = window.location.href;
  webApplicationURL = href.substr(href.indexOf("privlyOriginalURL=") + 18);
  var paramaters = getParameterHash(webApplicationURL);
  if (paramaters["privlyDataURL"] !== undefined) {
    jsonURL = paramaters["privlyDataURL"];
  } else {
    jsonURL = webApplicationURL.replace("format=iframe", "format=json");
    
    //deprecated
    webApplicationURL = webApplicationURL.replace("format=iframe", "format=html");
  }
  
  //Ask the extension to make the cross-domain request
  chrome.extension.sendMessage(
    {privlyGetContent: jsonURL},
    function(response) {
      if( response.status === 200 && 
          response.response.rendered_markdown !== undefined ) {
        console.log(response.response);
        // Set the permissions the user has on the content
        if ( response.response.permissions !== undefined ) {
          iframeBehavior.permissions = response.response.permissions;
          iframeBehavior.tooltipMessage = "Editable (Privly)";
        }
        
        $("#post_content").html(html_sanitize(response.response.rendered_markdown));
        iframeBehavior.resize();
      } else if( response.status === 403 ) {
        $("#post_content").html("<p>Your current user account does not have access to this.</p>");
      } else {
        $("#post_content").html("<p>You do not have access to this.</p>");
      }
  });
}
