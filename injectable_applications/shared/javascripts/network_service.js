/**
 * @fileOverview Interfaces the injectable applications with the
 * extension to facilitate same origin requests.
 **/
 
/**
 * @namespace
 */
var privlyNetworkService = {
  
  /**
   * Message a Google Chrome extension for a Cross-origin request
   * sent from the same-origin as the domain.
   *
   * @param {string} url The URL to make a cross domain request for.
   * @param {function} callback The function to execute after the response
   * returns.
   */
  googleChromeXHR: function(url, callback) {
    chrome.extension.sendMessage({privlyGetContent: url},callback);
  },
  
  /**
   * Send the data URL to the extension so it can make a cross-domain request
   * for the content. When the extension returns the content, it assigns the
   * content area to the returned sanitized string.
   *
   * @param {string} url The URL to make a cross domain request for.
   * @param {function} callback The function to execute after the response
   * returns.
   */
  sameOriginRequest: function(url, callback) {
    privlyNetworkService.googleChromeXHR(url, callback);
  }
  
}
