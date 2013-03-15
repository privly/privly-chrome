/**
 * ZeroBin Privly Fork
 *
 * This is a port of the ZeroBin project for a Privly injectable appliction.
 *
 * @link http://sebsauvage.net/wiki/doku.php?id=php:zerobin
 * @author sebsauvage
 * @contributor smcgregor
 *
 *
 * Copyright (c) 2012 Sébastien SAUVAGE (sebsauvage.net)
 * This software is provided 'as-is', without any express or implied warranty. In no event will the authors be held liable for any damages arising from the use of this software.
 * Permission is granted to anyone to use this software for any purpose, including commercial applications, and to alter it and redistribute it freely, subject to the following restrictions:
 * 1. The origin of this software must not be misrepresented; you must 
 *    not claim that you wrote the original software. If you use this 
 *      software in a product, an acknowledgment in the product documentation
 *      would be appreciated but is not required.
 *
 * 2. Altered source versions must be plainly marked as such, and must 
 *    not be misrepresented as being the original software.
 *
 * 3. This notice may not be removed or altered from any source distribution.
 *
 */

// Immediately start random number generator collector.
sjcl.random.startCollectors();

/**
 * The parameters as parsed by the parameter script.
 */
var parameters = {};

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
 * Compress a message (deflate compression).
 *
 * @param {string} message
 * @return {string} base64 encoded data.
 */
function compress(message) {
    return Base64.toBase64( RawDeflate.deflate( Base64.utob(message) ) );
}

/**
 * Decompress a message compressed with compress().
 *
 * @param {string} data Base64 encoded data.
 *
 * @return {string} Decompressed data.
 */
function decompress(data) {
    return Base64.btou( RawDeflate.inflate( Base64.fromBase64(data) ) );
}

/**
 * Compress, then encrypt message with key.
 *
 * @param string key
 * @param string message
 * @return encrypted string data
 */
function zeroCipher(key, message) {
    return sjcl.encrypt(key,compress(message));
}
/**
 *  Decrypt message with key, then decompress.
 *
 *  @param {string} key
 *  @param {json} data a JSON document storing the content and
 *  initialization vector.
 *  @return {string} readable message
 */
function zeroDecipher(key, data) {
    return decompress(sjcl.decrypt(key,JSON.stringify(data)));
}

/**
 * Convert URLs to clickable links.
 * URLs to handle:
 * <code>
 *     magnet:?xt.1=urn:sha1:YNCKHTQCWBTRNJIV4WNAE52SJUQCZO5C&xt.2=urn:sha1:TXGCZQTH26NL6OUQAJJPFALHG2LTGBC7
 *     http://localhost:8800/zero/?6f09182b8ea51997#WtLEUO5Epj9UHAV9JFs+6pUQZp13TuspAUjnF+iM+dM=
 *     http://user:password@localhost:8800/zero/?6f09182b8ea51997#WtLEUO5Epj9UHAV9JFs+6pUQZp13TuspAUjnF+iM+dM=
 * </code>
 *
 * @param object element : a jQuery DOM element.
 * @FIXME: add ppa & apt links.
 */
function urls2links(element) {
    var re = /((http|https|ftp):\/\/[\w?=&.\/-;#@~%+-]+(?![\w\s?&.\/;#~%"=-]*>))/ig;
    element.html(element.html().replace(re,'<a href="$1" rel="nofollow">$1</a>'));
    var re = /((magnet):[\w?=&.\/-;#@~%+-]+)/ig;
    element.html(element.html().replace(re,'<a href="$1">$1</a>'));
}

/**
 * Return the deciphering key stored in anchor part of the URL.
 *
 * @return {string} Gives the decryption key found in the URL
 *
 */
function pageKey() {
    
    var key = parameters["privlyLinkKey"];  // Get key
    
    // Some stupid web 2.0 services and redirectors add data AFTER the anchor
    // (such as &utm_source=...).
    // We will strip any additional data.
    
    // First, strip everything after the equal sign (=) which signals end of base64 string.
    i = key.indexOf('='); if (i>-1) { key = key.substring(0,i+1); }
    
    // If the equal sign was not present, some parameters may remain:
    i = key.indexOf('&'); if (i>-1) { key = key.substring(0,i); }
    
    // Then add trailing equal sign if it's missing
    if (key.charAt(key.length-1)!=='=') key+='=';
    
    return key;
}

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
  if( response.status === 200 && 
      response.response.structured_content !== undefined ) {
    
    
    var json = null;
    
    try {
      json = JSON.parse(response.responseText);
      var cleartext = zeroDecipher(pageKey(), json.structured_content);
      $('div#cleartext').text(cleartext);
      urls2links($('div#cleartext')); // Convert URLs to clickable links.
    } catch(err) {
      $('div#cleartext').text("The data behind this link is corrupted.");
    }
    
    // Tells the parent document how tall the iframe is so that
    // the iframe height can be changed to its content's height
    privlyHostPage.resizeToWrapper();
  } else if( response.status === 403 ) {
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
  if(evt.target.nodeName == "A"){
    parent.window.location = evt.target.href;
  } else {
    window.open(webApplicationURL, '_blank');
  }
};

/**
 * On Page load, the forms and layouts are initialized.
 * If the URL's hash contains content, then the application
 * will attempt to fetch the remote ciphertext for decryption
 */
jQuery(window).load(function(){
  
  // Creates a tooptip which indicates the content is not a 
  // natural element of the page
  privlyTooltip.tooltip();
  
  // Set the application and data URLs
  var href = window.location.href;
  webApplicationURL = href.substr(href.indexOf("privlyOriginalURL=") + 18);
  parameters = privlyParameters.getParameterHash(webApplicationURL);
  jsonURL = parameters["privlyCiphertextURL"];
  
  //var href = "https://privlyalpha.org/zero_bin/#privlyLinkKey=HTBQUu%2F46rdcGm1e%2F55zhat0Acra6JZCccKv5aVTz3w%3D&privlyCiphertextURL=https%3A%2F%2Fprivlyalpha.org%2Fposts%2F677.json%3FburntAfter%3D1364523256%26privlyBurntAfter%3D1364523256%26privlyInject1%3Dtrue%26privlyInjectableApplication%3DUnknown%26random_token%3D055aae9a94&privlyInject1=true&p=p";
  //parameters = privlyParameters.getParameterHash(href);
  
  //webApplicationURL = href.substr(href.indexOf("privlyOriginalURL=") + 18);
  if (parameters["privlyDataURL"] !== undefined) {
    jsonURL = parameters["privlyDataURL"];
  }
  
  // Make the cross origin request as if it were on the same origin.
  privlyNetworkService.sameOriginRequest(jsonURL, contentCallback);
  
  // Register the click listener.
  jQuery("body").on("click",singleClick);
  
});
