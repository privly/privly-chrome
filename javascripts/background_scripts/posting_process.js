/**
 *
 * This background script creates contextMenu for editable elements.
 *
 * It will forward contextMenu click event to the content script by messaging.
 *
 * Process of starting embed posting from clicking contextMenu:
 * 1. The user selects an editable element with a right click.
 * 2. The content script records the editable element.
 * 3. The user clicks a Privly posting application in the resultant context
 *    menu.
 * 4. This script tells the content script that the context menu item is clicked.
 *    The event message will be received by all content scripts in the source tab.
 *    (There will be multiple content scripts in one tab if there are iframes)
 *    To help content scripts identify whether they should respond to the event message,
 *    info.frameUrl is carried in the message.
 *      If user clicks a contextMenu inside an iframe, frameUrl === frameWindow.location
 *      If user clicks a contextMenu outside iframes, frameUrl === undefined
 * 5. The content script begins to prepare embed posting.
 * 
 */

/*global chrome:false, ls:true */

// Creates the Message context menu
chrome.contextMenus.create({
  "title": "New Message",
  "contexts": ["editable"],
  "onclick" : function (info, tab) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'posting/on_context_menu_clicked',
      frameUrl: info.frameUrl
    });
  }
});

// posting_button may ask for capturing visible areas
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.ask === "CaptureViewport") {
    if (chrome.tabs && chrome.tabs.captureVisibleTab) {
      chrome.tabs.captureVisibleTab(null, {format: 'png'}, sendResponse);
      return true;
    } else {
      sendResponse();
    }
  }
});
