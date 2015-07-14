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
  sendApplicationInjectionUrlResponse: function (request, sendResponse) {

    if( request.privlyOriginalURL === undefined ) {
      return;
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
    }
    sendResponse({privlyApplicationURL: chrome.extension.getURL(path) + encodeURIComponent(url)});
  },

  /**
   * Monitor tabs and messages to facilitate reading injected content.
   */
  addListeners: function () {
    Privly.message.addListener( readingProcess.sendApplicationInjectionUrlResponse );
  }
};

readingProcess.addListeners();
