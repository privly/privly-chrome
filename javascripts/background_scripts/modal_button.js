/**
 * @fileOverview This file initializes the modal button (browser action).
 * If the user is inputing in a seamless-posting form, the modal button
 * will become green. In other cases, it indicates whether content injection
 * is enabled: red for enabled, gray for disabled.
 */

/*global chrome */
/*global Privly */

/**
 * Detecting whether user is inputing in a seamless-posting form
 * is not simple. For example, when user switches the tab, the
 * status should be updated.
 *
 * We use the data structure below to store the status:
 *
 * postingFormStatus: {
 *   tabId1: {                        // (1):
 *                                    // The form focusing status for
 *                                    // this tab.
 *   
 *     seamlessPostingFormId1: true   // (2):
 *                                    // The `seamlessPostingFormId1`
 *                                    // form in `tabId1` tab is in
 *                                    // focus status.
 *                                    // 
 *                                    // If a form is no longer in
 *                                    // focus status (blurred), the
 *                                    // entry is removed.
 *   },
 *   tabId2: {
 *     ...
 *   },
 *   tabId3: {
 *     ...
 *   },
 *   ...
 * }
 *
 * Why not just using a simple boolean in (1), indicates whether the
 * posting form of this tab is focused? Answer below.
 * 
 * In most of the time, there should be only zero or one entity in each
 * tab object (1). However, it isn't at the moment that the user is
 * jumping from one posting form to another posting form: focus and
 * blur events are not received in sequence. Thus, we can't simply use
 * a boolean here.
 */
var postingFormStatus = {};

/**
 * The tabId of the current activated tab.
 * 
 * @type {Number}
 */
var currentActiveTabId = null;

/**
 * Check whether the user is currently inputing in a seamless-posting form
 * according to the focusing status of all tabs and the info of current tab.
 * 
 * @return {Boolean}
 */
function isSeamlessPostingAppFocused() {
  if (postingFormStatus[currentActiveTabId] === undefined) {
    return false;
  }
  if (Object.keys(postingFormStatus[currentActiveTabId]).length === 0) {
    return false;
  }
  return true;
}

/**
 * Updates the browser action button (modal button)
 * according to the collected status.
 */
function updateBrowserAction() {
  if (isSeamlessPostingAppFocused()) {
    chrome.browserAction.setIcon({
      path: {
        19: 'images/icon_writing_19.png',
        38: 'images/icon_writing_38.png',
      }
    });
    return;
  }

  chrome.browserAction.setIcon({
    path: {
      19: 'images/icon_disabled_19.png',
      38: 'images/icon_disabled_38.png',
    }
  });
}

/**
 * Update the activated tab id when it is changed
 */
chrome.tabs.onActivated.addListener(function (activeInfo) {
  currentActiveTabId = activeInfo.tabId;
  updateBrowserAction();
});

// Subscribe to focusing and blurring events
// of the seamless-posting form.
Privly.message.addListener(function (request, sendRequest, sender) {
  if (request.action === 'posting/background/focused') {
    if (postingFormStatus[sender.tab.id] === undefined) {
      postingFormStatus[sender.tab.id] = {};
    }
    postingFormStatus[sender.tab.id][request.appId] = true;
    updateBrowserAction();
  } else if (request.action === 'posting/background/blurred') {
    if (postingFormStatus[sender.tab.id] !== undefined) {
      delete postingFormStatus[sender.tab.id][request.appId];
    }
    updateBrowserAction();
  }
});

/**
 * Delete the related entry of the removed tab.
 */
chrome.tabs.onRemoved.addListener(function (tabId) {
  delete postingFormStatus[tabId];
});

/**
 * When the page is reloaded, status should be updated.
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
    delete postingFormStatus[tabId];
    updateBrowserAction();
  }
});

// Set up an initial icon
updateBrowserAction();