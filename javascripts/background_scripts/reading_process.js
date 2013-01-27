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
 * @param {tab} tabId The integer identifier of the tab who needs to be told
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
 */
function tabChange(tab) {
  chrome.browserAction.getBadgeText({},
    function(currentText) {
      if (tab.status === "complete" &&
          tab.url.indexOf("http") === 0 ) {
        if( currentText === "off" ) {
          updateContentScriptWhitelist(tab.id);
          deactivateContentInjectionScript(tab.id);
        } else {
          updateContentScriptWhitelist(tab.id);
          activateContentInjectionScript(tab.id);
        }
      }
    });
}

//
// Content Script Activation
//

// When the active tab changes, the script must update the content script's
// state.
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, tabChange);
});

// Turns on the content script when the badge text is set to "on"
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  tabChange(tab);
});


//
// browserAction Icon Interaction
//
// The browser icon determines whether the extension will
// replace links on the page. "off" indicates that the 
// extension will not inject the privly.js content script,
// whereas "on" indicates the content script will run.
//
// Set the text color to green, and turn on injection
chrome.browserAction.setBadgeBackgroundColor({color: "#004F00"});
chrome.browserAction.setBadgeText({text: "on"});

// When the icon is clicked, toggle the mode and notify the content scripts
chrome.browserAction.onClicked.addListener(function(tab) {
  
  chrome.browserAction.getBadgeText({},
    function(currentText) {
      
      //toggle the on/off state of the button
      if (currentText === "off") {
        
        // Set the text color to green
        chrome.browserAction.setBadgeBackgroundColor({color: "#004F00"});
        chrome.browserAction.setBadgeText({text: "on"});
        chrome.browserAction.setTitle({title: "Turn Privly Viewing Off"});
        activateContentInjectionScript(tab.id);
      } else {
        
        // Set the text color to red
        chrome.browserAction.setBadgeBackgroundColor({color: "#FF0000"});
        chrome.browserAction.setBadgeText({text: "off"});
        chrome.browserAction.setTitle({title: "Turn Privly Viewing On"});
        deactivateContentInjectionScript(tab.id);
      }
    });
});
