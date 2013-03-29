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
 * 5. If an injected application needs a cross-domain request, it messages
 *    this background script to make the request. see: getContentResponse()
 *    This step is only performed for locally injected applications.
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
      code: "if(privly !== undefined){privly.start();}",
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
      code: "if(privly !== undefined){privly.stop();}",
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
      code: "if(privly !== undefined){privly.updateWhitelist('"+user_whitelist_regexp+"');}",
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
 * Makes a cross-domain request for content. This function is usually called
 * by a message listener. If request.privlyOriginalURL is defined then this
 * function is called by the message listener.
 *
 * @param {object} request The request object's JSON document.
 * @param {object} sender Information on the extension sending the message
 * @param {function} sendResponse The callback function for replying to message
 *
 * @return {boolean} Gives "true" so that the AJAX request can make a
 * subsequent return to the message. The return of the message is sent
 * after the remote server returns.
 *
 */
function getContentResponse(request, sender, sendResponse) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if (xhr.readyState === 4) {
      sendResponse({status: xhr.status, responseText: xhr.responseText});
    }
  }
  xhr.open("GET", request.privlyGetContent, true);
  xhr.setRequestHeader("Accept", "application/json");
  xhr.send();
  return true;
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
  
  if( url.indexOf("privlyInjectableApplication=ZeroBin") > 0 ) {
    sendResponse({
      privlyApplicationURL: 
        chrome.extension.getURL("injectable_applications/ZeroBin/index.html?privlyOriginalURL="+url)});
  } else if( url.indexOf("privlyInjectableApplication=PlainPost") > 0 ) {
    sendResponse({
      privlyApplicationURL: 
        chrome.extension.getURL("injectable_applications/PlainPost/index.html?privlyOriginalURL="+url)});
  } else {
    console.warn("Injectable App not specified, defaulting to sanitized " + 
                 "PlainPost: "+ request.privlyOriginalURL);
    sendResponse({
      privlyApplicationURL: 
        chrome.extension.getURL("injectable_applications/PlainPost/index.html?privlyOriginalURL="+url)});
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
    } else if(request.privlyGetContent !== undefined) {
      return getContentResponse(request, sender, sendResponse);
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

//Initialize the spoofing glyph
if (localStorage["privly_glyph"] === undefined) {
  localStorage["privly_glyph"] = Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16);
}
