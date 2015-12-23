/**
 * @fileOverview This file opens a tab with the first run html doc under
 * appropriate conditions when the extension is loaded on extension install.
 **/
/*global chrome:false, ls:true */
// Automatically open the first-run page when the extension is newly installed
'use strict';
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.previousVersion === undefined) {
    setTimeout(function () {
      var page = chrome.extension.getURL('privly-applications/Pages/ChromeFirstRun.html');
      chrome.tabs.create({
        url: page,
        active: true
      });
    }, 200);
  }
});