/**
 * @fileOverview This script is responsible for integration issues with
 * browser extensions and mobile architectures. Apps should call these
 * functions as appropriate.
 **/

/**
 * @namespace
 * Wrapper for behaviors required by extensions.
 */
var privlyExtension = {
    
  /**
   * Fire an event containing the Privly URL for extensions to capture.
   * This is used in posting dialogs where the application pops up for the
   * user to create a post.
   *
   * @param {string} url the URL to send to the extension.
   *
   */
  firePrivlyURLEvent: function(url) {
    var element = document.createElement("privlyEventSender");  
    element.setAttribute("privlyUrl", url);  
    document.documentElement.appendChild(element);  
    
    var evt = document.createEvent("Events");  
    evt.initEvent("PrivlyUrlEvent", true, false);  
    element.dispatchEvent(evt);
    
    // Platform specific messaging
    if (privlyNetworkService.platformName() === "CHROME") {
      chrome.extension.sendMessage(
        {privlyUrl: url},
        function(response) {});
    } else if(privlyNetworkService.platformName() === "IOS") {
      // hery todo, send the privlyUrl to the ios platform
      //"privly-ios" in the user agent string indicates privly ios
      // todo:
      // Communicate with iOS app by creating a new frame and passing the URL in src:
      // var iframe = document.createElement("IFRAME");
      // iframe.setAttribute("src", "js-frame:myObjectiveCFunction");
      // iframe.setAttribute("height", "1px");
      // iframe.setAttribute("width", "1px");
      // document.documentElement.appendChild(iframe);
      // iframe.parentNode.removeChild(iframe);
      // iframe = null;
    } else if(privlyNetworkService.platformName() === "ANDROID") {
      //visham todo, send the privlyUrl to the android platform
    }
  }
};
