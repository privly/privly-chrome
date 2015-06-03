/**
 * @fileOverview reading_process.js manages the process of reading content
 * injected into host pages. The process is as follows:
 *
 * 1. The content script, privly.js, discovers whitelisted links or
 *    clicks on a passive link, then it requests a source URL from the
 *    extension using the message interface. The source URL
 *    will be assigned to the URL returned by
 *    readingProcess.getApplicationInjectionUrlResponse(). If the
 *    application behind the URL is known, the application will be served
 *    from local storage and not the remote content server.
 *
 **/

/*global chrome */

/**
 * @namespace For functionality related to reading content injected into
 * a host page.
 */
var readingProcess = {

  /**
   * Gives the URL to inject an iframe if it is a known application.
   *
   * @param {object} request The json request object sent by the content scrpt.
   */
  sendApplicationInjectionUrlResponse: function (request) {

    if( request.privlyOriginalURL === undefined ) {
      return false; // Don't remove this listener
    }

    var url = request.privlyOriginalURL;
    var response, path;

    // Deprecated app specification parameter
    var pattern = /privlyInjectableApplication\=/i;
    url = url.replace(pattern, "privlyApp=");

    if (url.indexOf("privlyApp=Message") > 0) {
      path = "privly-applications/Message/show.html?privlyOriginalURL=";
    } else if (url.indexOf("privlyApp=ZeroBin") > 0) {
      path = "privly-applications/Message/show.html?privlyOriginalURL="; // Deprecated
    } else if (url.indexOf("privlyApp=PlainPost") > 0) {
      path = "privly-applications/PlainPost/show.html?privlyOriginalURL=";
    } else if (url.indexOf("https://priv.ly") === 0) {
      path = "privly-applications/PlainPost/show.html?privlyOriginalURL="; // Deprecated
    } else {
      // Don't inject unknown apps
      return false;// Don't remove this listener
    }
    response = chrome.extension.getURL(path) + encodeURIComponent(url);
    Privly.message.messageContentScripts({privlyApplicationURL: response, originalRequest: request});
    return false; // Don't remove this listener
  },

  /**
   * A message listener for content scripts when they ask for the current
   * of application injection.
   * @param {object} message The message received by the messaging interface.
   */
  isInjectionEnabled: function(message) {
    if( message.ask === "options/isInjectionEnabled") {
      var response =
       {
         "action": "options/changed",
         "option": "options/isInjectionEnabled",
         "newValue": Privly.options.isInjectionEnabled()
       }
       Privly.message.messageContentScripts(response);
    }
    return false; // Don't remove this listener
  },


  /**
   * Message listener for content scripts that need to know whether they
   * should display the posting button in the context of the host page.
   * @param {object} message If the object contains an "ask" key
   * with the value "options/isPrivlyButtonEnabled" the Privly button's
   * current setting will be messaged to all the content scripts.
   */
  isPrivlyButtonEnabled: function(message) {
    if( message.ask === "options/isPrivlyButtonEnabled") {
      var response =
       {
         "action": "options/changed",
         "option": "options/isPrivlyButtonEnabled",
         "newValue": Privly.options.isPrivlyButtonEnabled()
       }
       Privly.message.messageContentScripts(response);
    }
    return false; // Don't remove this listener
  },

  /**
   * Monitor tabs and messages to facilitate reading injected content.
   */
  addListeners: function () {
    Privly.message.addListener( readingProcess.sendApplicationInjectionUrlResponse );
    Privly.message.addListener( readingProcess.isInjectionEnabled );
    Privly.message.addListener( readingProcess.isPrivlyButtonEnabled );
  }
};

readingProcess.addListeners();
