/**
 * @fileOverview reading_process.js manages the process of reading content
 * injected into host pages. The process is as follows:
 *
 * 1. The manifest.json file injects a content script, privly.js, into every
 *    websites the user visits, including iframes.
 * 2. This background script messages the privly.js content script the user's
 *    whitelist. This whitelist defines domains the user trust in addition to
 *    the default white list. see: readingProcess.updateContentScriptWhitelist()
 * 3. This background script checks the state of the modal button, and turns
 *    on the privly.js content script if the modal button is on. This
 *    background script also defines a click listener on the modal button,
 *    that will start or stop the content scripts depending on the new state
 *    of the button. see: readingProcess.tabChange()
 * 4. The content script, privly.js, discovers whitelisted links or
 *    clicks on a passive link, then it requests a source URL from the
 *    extension using the message interface. The source URL
 *    will be assigned to the URL returned by
 *    readingProcess.getApplicationInjectionUrlResponse(). If the
 *    application behind the URL is known, the application will be served
 *    from local storage and not the remote content server.
 *
 **/

  /*global chrome:false, ls:true, modalButton:false */


/**
 * @namespace For functionality related to reading content injected into
 * a host page.
 */
var readingProcess = {

  /**
   * If the content script has been injected, this will ask it to run.
   *
   * @param {tab} tabId The integer identifier of the tab to activate with
   * the content script.
   *
   * @see readingProcess.deactivateContentInjectionScript
   */
  activateContentInjectionScript: function (tabId) {
    chrome.tabs.executeScript(tabId, {
        code: "if(typeof privly != 'undefined'){privly.start();}",
        allFrames: true
    });
  },

  /**
   * If the content script has been injected, this will ask it to not run.
   *
   * @param {tab} tabId The integer identifier of the tab who needs to stop
   * running the content script.
   *
   * @see readingProcess.activateContentInjectionScript
   */
  deactivateContentInjectionScript: function(tabId) {
    chrome.tabs.executeScript(tabId, {
        code: "if(typeof privly != 'undefined'){privly.stop();}",
        allFrames: true
    });
  },

  /**
   * Notifies content script of additions to injection whitelist. This list is
   * assigned from the options page.
   *
   * @param {integer} tabId The integer identifier of the tab who needs to be told
   * the updated whitelist.
   *
   */
  updateContentScriptWhitelist: function(tabId) {
    var user_whitelist_regexp = ls.getItem("user_whitelist_regexp");
    if (!user_whitelist_regexp) {
      return;
    }
    chrome.tabs.executeScript(tabId, {
        code: "if(typeof privly != 'undefined'){privly.updateWhitelist('"+user_whitelist_regexp+"');}",
        allFrames: true
    });
  },

  /**
   * Callback assigns content script state according to the modal button.
   *
   * @param {tab} tab The tab that
   * needs to be sent the operation mode and user's whitelist.
   */
  tabChange: function(tab) {

    if (tab.status !== "complete" ||
        tab.title === "New Tab" ||          // Solves hard to replicate error
        (tab.url.indexOf("http") !== 0 &&
         tab.url.indexOf("file") !== 0)) {
           return;
    }

    readingProcess.updateContentScriptWhitelist(tab.id);
    if( modalButton.badgeText === "off" ) {
      readingProcess.deactivateContentInjectionScript(tab.id);
    } else {
      readingProcess.activateContentInjectionScript(tab.id);
    }

  },

  /**
   * Helper for updating multiple tabs simultaneously. Relies on
   * the readingProcess.tabChange function.
   *
   * @param {[tab,...]} tabs The array of tabs that
   * needs to be sent the operation mode and user's whitelist.
   */
  tabsChange: function(tabs) {

    // Facilitate modifying an array of tabs by recursively
    // calling this function on every tab.
    if ( typeof tabs.length !== "undefined" ) {
      for( var i = 0; i < tabs.length; i++){
        readingProcess.tabChange(tabs[i]);
      }
      return;
    }
  },

  /**
   * Gives the URL to inject an iframe if it is a known application.
   *
   * @param {object} request The json request object sent by the content scrpt.
   * @param {object} sender The sender of the message.
   * @param {function} sendResponse The callback function of the message from
   * the content script.
   *
   */
  sendApplicationInjectionUrlResponse: function(request, sender, sendResponse) {
    var url = request.privlyOriginalURL;
    var response, path;

    // Deprecated app specification parameter
    var pattern = /privlyInjectableApplication\=/i;
    url = url.replace(pattern, "privlyApp=");

    if( url.indexOf("privlyApp=Message") > 0 ) {
      path = "privly-applications/Message/show.html?privlyOriginalURL=";
    } else if( url.indexOf("privlyApp=ZeroBin") > 0) {
      path = "privly-applications/Message/show.html?privlyOriginalURL="; // Deprecated
    } else if( url.indexOf("privlyApp=PlainPost") > 0) {
      path = "privly-applications/PlainPost/show.html?privlyOriginalURL=";
    } else if( url.indexOf("https://priv.ly") === 0 ) {
      path = "privly-applications/PlainPost/show.html?privlyOriginalURL="; // Deprecated
    } else {
      sendResponse({}); // Don't inject unknown apps
      return;
    }
    response = chrome.extension.getURL(path) + encodeURIComponent(url);
    sendResponse( {privlyApplicationURL: response} );
  },

  /**
   * Monitor tabs and messages to facilitate reading injected content.
   */
  addListeners: function() {

    // Message listeners are currently distinguised by whether they contain
    // the appropriate JSON in their request.
    chrome.extension.onMessage.addListener(
      function(request, sender, sendResponse) {
        if (request.privlyOriginalURL !== undefined) {
          readingProcess.sendApplicationInjectionUrlResponse(request, sender, sendResponse);
          return;
        }
      });

    // When the active tab changes we must update the tab's content script for
    // the current operation mode of the modal button.
    chrome.tabs.onActivated.addListener(function(activeInfo) {
      chrome.tabs.get(activeInfo.tabId, readingProcess.tabChange);
    });
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      chrome.tabs.get(tabId, readingProcess.tabChange);
    });

    // Respond to every request to start the content script.
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        if (request.ask === "shouldStartPrivly?") {
          if(modalButton.badgeText !== "off") {
            sendResponse({tell: "yes"});
          }
        }
    });
  }
};

readingProcess.addListeners();
