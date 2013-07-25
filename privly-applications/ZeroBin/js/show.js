/**
 * The URL of the application when accessed via the remote server. This
 * parameter is usually assigned by the extension since the original URL
 * is replaced by one served from the extension.
 */
var webApplicationURL = "";

/**
 * The URL of the data endpoint for this application.
 */
var jsonURL = "";

/**
 * Gives the URL of the encrypted content.
 *
 * @return {string} Return the url where the data is stored.
 *
 */
function cipherTextUrl() {
    return getParameterHash()["privlyCiphertextURL"];
}

/**
 * Function to execute after content is returned by the content server.
 * It is responsible for assigning the content of the document as well as
 * resizing the iframe containing it.
 *
 * @param {object} response The response from the remote server. In cases
 * without error, the response body will be in response.response.
 *
 */
function contentCallback(response) {
  if( response.jqXHR.status === 200 ) {
    
    var json = response.json;
    if (json.structured_content !== undefined) {
      var cleartext = zeroDecipher(pageKey(), json.structured_content);
      $('div#cleartext').text(cleartext);
      urls2links($('div#cleartext')); // Convert URLs to clickable links.
    } else {
      $('div#cleartext').text("The data behind this link is corrupted.");
    }
    
    // Tells the parent document how tall the iframe is so that
    // the iframe height can be changed to its content's height
    privlyHostPage.resizeToWrapper();
  } else if( response.jqXHR.status === 403 ) {
    $('div#cleartext').text("Your current user account does not have access to this.");
    privlyHostPage.resizeToWrapper();
  } else {
    $('div#cleartext').text("You do not have access to this.");
    privlyHostPage.resizeToWrapper();
  }
}


/**
 * Opens the injected content in a new window. If the user clicked a link
 * in the injected content, the link is followed in the current window.
 */
function singleClick(evt) {
  if(evt.target.nodeName == "A" && evt.target.href !== ""){
    parent.window.location = evt.target.href;
  } else {
    if(privlyHostPage.isInjected()) {
      window.open(location.href, '_blank');
    }
  }
};

/**
 * On Page load, the forms and layouts are initialized.
 * If the URL's hash contains content, then the application
 * will attempt to fetch the remote ciphertext for decryption
 */
jQuery(window).load(function(){
  
  // Set the application and data URLs
  var href = window.location.href;
  webApplicationURL = privlyParameters.getApplicationUrl(href);
  parameters = privlyParameters.getParameterHash(webApplicationURL);
  
  if (parameters["privlyDataURL"] !== undefined) {
    jsonURL = decodeURIComponent(parameters["privlyDataURL"]);
  } else if(parameters["privlyCiphertextURL"] !== undefined) {
    jsonURL = decodeURIComponent(parameters["privlyCiphertextURL"]); // deprecated
  }
  
  // The domain the data is pulled from
  var dataProtocol = jsonURL.split("/")[0];
  var dataDomain = jsonURL.split("/")[2];
  
  if(privlyHostPage.isInjected()) {
    // Creates a tooptip which indicates the content is not a 
    // natural element of the page
    privlyTooltip.tooltip();
    
    // Display the domain of the content in the glyph
    privlyTooltip.updateMessage(dataDomain + " ZeroBin: Read Only");
    
    // Register the click listener.
    jQuery("body").on("click", singleClick);
    
    loadInjectedCSS();
  } else {
    $(".home_domain").attr("href", dataProtocol + "//" + dataDomain);
    $(".home_domain").text(dataDomain);
    
    var manageURL = jsonURL.replace("format=json", "format=html");
    manageURL = manageURL.replace(".json", ".html");
    $(".privly_manage_link").attr("href", manageURL);
    loadTopCSS();
  }
  
  // Make the cross origin request as if it were on the same origin.
  privlyNetworkService.initPrivlyService(false);
  privlyNetworkService.sameOriginGetRequest(jsonURL, contentCallback);
  
});