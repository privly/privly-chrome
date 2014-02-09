/**
 * @fileOverview reading_process.js manages the process of reading content
 * injected into host pages. The process is as follows:
 *
 * 1. The manifest.json file injects a content script, privly.js, into every
 *    websites the user visits, including iframes.
 * 2. This background script messages the privly.js content script the user's
 *    whitelist. This whitelist defines domains the user trust in addition to
 *    the default white list. see: updateContentScriptWhitelist()
 * 3. This background script checks the state of the modal button, and turns
 *    on the privly.js content script if the modal button is on. This 
 *    background script also defines a click listener on the modal button,
 *    that will start or stop the content scripts depending on the new state 
 *    of the button. see: tabChange()
 * 4. The content script, privly.js, discovers whitelisted links or 
 *    clicks on a passive link, then it requests a source URL from the
 *    extension using the message interface. The source URL will be assigned
 *    to the URL returned by getApplicationInjectionUrlResponse(). If the 
 *    application behind the URL is known, the application will be served
 *    from local storage and not the remote content server.
 *    
 **/

/**
 * If the content script has been injected, this will ask it to run.
 *
 * @param {tab} tabId The integer identifier of the tab to activate with
 * the content script.
 *
 * @see deactivateContentInjectionScript
 */
function activateContentInjectionScript(tabId) {
  chrome.tabs.executeScript(tabId, {
      code: "if(typeof privly != 'undefined'){privly.start();}",
      allFrames: true
  });
}

/**
 * If the content script has been injected, this will ask it to not run.
 *
 * @param {tab} tabId The integer identifier of the tab who needs to stop
 * running the content script.
 *
 * @see activateContentInjectionScript
 */
function deactivateContentInjectionScript(tabId) {
  chrome.tabs.executeScript(tabId, {
      code: "if(typeof privly != 'undefined'){privly.stop();}",
      allFrames: true
  });
}

/**
 * Notifies content script of additions to injection whitelist. This list is 
 * assigned from the options page.
 *
 * @param {integer} tabId The integer identifier of the tab who needs to be told
 * the updated whitelist.
 *
 */
function updateContentScriptWhitelist(tabId) {
  var user_whitelist_regexp = localStorage["user_whitelist_regexp"];
  if (!user_whitelist_regexp) {
    return;
  }
  chrome.tabs.executeScript(tabId, {
      code: "if(typeof privly != 'undefined'){privly.updateWhitelist('"+user_whitelist_regexp+"');}",
      allFrames: true
  });
}

/**
 * Callback assigns content script state according to the modal button.
 *
 * @param {tab} tab The tab that has a new instance of the content script
 * and needs to be sent the operation mode and user's whitelist.
 */
function tabChange(tab) {
  
  if (tab.status !== "complete" ||
      tab.title === "New Tab" ||          // Solves hard to replicate error
      (tab.url.indexOf("http") !== 0 &&
       tab.url.indexOf("file") !== 0)) {
         return;
  }
  
  if( badgeText === "off" ) {
    updateContentScriptWhitelist(tab.id);
    deactivateContentInjectionScript(tab.id);
  } else {
    updateContentScriptWhitelist(tab.id);
    activateContentInjectionScript(tab.id);
  }
  
}

/**
 * Gives the URL to inject an iframe from local storage if it is a known
 * application. Otherwise it will (deprecated) inject the application with 
 * the remote origin. Remote code execution is discouraged and will not be
 * permitted in future versions.
 *
 * @param {object} request The json request object sent by the content scrpt.
 * @param {object} sender The sender of the message.
 * @param {function} sendResponse The callback function of the message from
 * the content script.
 *
 */
function getApplicationInjectionUrlResponse(request, sender, sendResponse) {
  var url = request.privlyOriginalURL;
  
  if( url.indexOf("privlyInjectableApplication=ZeroBin") > 0 || // deprecated
      url.indexOf("privlyApp=ZeroBin") > 0) {
    sendResponse({
      privlyApplicationURL: 
        chrome.extension.getURL(
          "privly-applications/ZeroBin/show.html?privlyOriginalURL=" + 
          encodeURIComponent(url))});
  } else if( url.indexOf("privlyInjectableApplication=pgp") > 0 || // deprecated
             url.indexOf("privlyApp=pgp") > 0) {
    sendResponse({
      privlyApplicationURL: 
        chrome.extension.getURL("privly-applications/pgp/show.html?privlyOriginalURL=" + 
        encodeURIComponent(url))});
  } else if( url.indexOf("privlyInjectableApplication=PlainPost") > 0 || // deprecated
             url.indexOf("privlyApp=PlainPost") > 0) {
    sendResponse({
      privlyApplicationURL: 
        chrome.extension.getURL("privly-applications/PlainPost/show.html?privlyOriginalURL=" + 
        encodeURIComponent(url))});
  } else {
    console.warn("Injectable App not specified, defaulting to sanitized " + 
                 "PlainPost: "+ request.privlyOriginalURL);
    sendResponse({
      privlyApplicationURL: 
        chrome.extension.getURL("privly-applications/PlainPost/show.html?privlyOriginalURL=" + 
        encodeURIComponent(url))});
  }
}

//
// LISTENERS
//

// Message listeners are currently distinguised by whether they contain
// the appropriate JSON in their request.
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.privlyOriginalURL !== undefined) {
      return getApplicationInjectionUrlResponse(request, sender, sendResponse);
    }
  });

// When the active tab changes we must update the tab's content script for
// the current operation mode of the modal button.
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, tabChange);
});

// When a tab's application changes, we have to message the proper operation
// mode to the content script
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  tabChange(tab);
});
