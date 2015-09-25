/**
 * @fileOverview This file creates context menus.
 * Clicking certain context menu item will start the
 * app in seamless-posting mode.
 */
/*global chrome */
var createSeamlessMenuItem = function (itemCaption, appName) {
  chrome.contextMenus.create({
    title: itemCaption,
    contexts: ['editable'],
    onclick: function (info, tab) {
      // We use native message sending method here
      // since we want to send to a specific target.
      // context_messenger doesn't support specify
      // target now.
      chrome.tabs.sendMessage(tab.id, {
        type: 'RAW',
        payload: {
          action: 'posting/contextMenuClicked',
          app: appName
        }
      });
    }
  });
};

createSeamlessMenuItem('New Message', 'Message');
createSeamlessMenuItem('New PlainPost', 'PlainPost');
