/**
 * @fileOverview This background script is responsible for
 * forwarding messages among seamless-posting content scripts
 * and seamless-posting applications. It also handles requests
 * in the form of messages to popup a new window for user to
 * login.
 */
/*global chrome */
/*global Privly */
'use strict';
Privly.message.addListener(function (data, sendResponse) {
  if (typeof data.action !== 'string') {
    return;
  }

  // any incoming messages that starts with 'posting/contentScript/'
  // should be forwarded to content scripts
  if (data.action.indexOf('posting/contentScript/') === 0) {
    Privly.message.messageContentScripts(data, data.hasResponse).then(sendResponse);
    return true;
  }

  // any incoming messages that starts with 'posting/app/'
  // should be forwarded to Privly application
  if (data.action.indexOf('posting/app/') === 0) {
    Privly.message.messagePrivlyApplications(data, data.hasResponse).then(sendResponse);
    return true;
  }

  // any incoming messages that starts with 'posting/background/'
  // should be processed by the this background script
  if (data.action.indexOf('posting/background/') === 0) {
    switch (data.action) {
    case 'posting/background/popupLogin':
      chrome.windows.create({
        // when login succeed, login page will be redirected to the URL
        // specified by the `loginCallbackUrl` property in the message.
        url: chrome.extension.getURL('privly-applications/Login/new.html?' + data.loginCallbackUrl),
        focused: true,
        top: 0,
        left: 0,
        type: 'normal'
      });

      break;
    }
  }

});