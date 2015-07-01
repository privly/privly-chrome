/**
 * @fileOverview This file initializes the modal button (browser action).
 * This file initializing the button's state on browser start and
 * change button's state (badage color and text) when user toggles
 * injection in popup.html.
 * 
 * The text message on the button determines the operating mode.
 * "off" indicates that the content script can be injected, but it
 * doesn't execute any code.
 *
 * "on" indicates that the content script is injected, and should
 * actively replace links on the user's whitelist.
 */

/*global chrome */
/*global Privly */

/**
 * This function updates the badge text and background color of the
 * browser action button (modal button) according to the parameter.
 * 
 * @param  {Boolean} enableInjection Whether injection is enabled
 */
var injectionEnabled = Privly.options.isInjectionEnabled();;

function updateBrowserAction() {
  if (isInEmbededPosting()) {
    chrome.browserAction.setIcon({
      path: {
        19: 'images/icon_writing_19.png',
        38: 'images/icon_writing_38.png',
      }
    });
  } else {
    if (injectionEnabled) {
      chrome.browserAction.setIcon({
        path: {
          19: 'images/icon_enabled_19.png',
          38: 'images/icon_enabled_38.png',
        }
      });
    } else {
      chrome.browserAction.setIcon({
        path: {
          19: 'images/icon_disabled_19.png',
          38: 'images/icon_disabled_38.png',
        }
      });
    }
  }
}

function isInEmbededPosting() {
  if (embededStatus[currentActiveTabId] === undefined) {
    return false;
  }
  if (Object.keys(embededStatus[currentActiveTabId]).length === 0) {
    return false;
  }
  return true;
}

// Subscribe to option changed events
Privly.message.addListener(function (request, sendRequest, sender) {
  if (request.action === 'options/changed') {
    if (request.option === 'options/isInjectionEnabled') {
      injectionEnabled = request.newValue;
      updateBrowserAction();
    }
  }
});

// Per-tab embeded-posting focus and blur status
var embededStatus = {};
var currentActiveTabId = null;

// Subscribe to embeded-posting focus and blur events
Privly.message.addListener(function (request, sendRequest, sender) {
  if (request.action === 'embeded/app/focus') {
    if (embededStatus[sender.tab.id] === undefined) {
      embededStatus[sender.tab.id] = {};
    }
    embededStatus[sender.tab.id][request.appId] = true;
    updateBrowserAction();
  } else if (request.action === 'embeded/app/blur') {
    if (embededStatus[sender.tab.id] !== undefined) {
      delete embededStatus[sender.tab.id][request.appId]
    }
    updateBrowserAction();
  }
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  currentActiveTabId = activeInfo.tabId;
  updateBrowserAction();
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  delete embededStatus[tabId];
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
    delete embededStatus[tabId];
    updateBrowserAction();
  }
});

// Retrive the initial option value
updateBrowserAction();
